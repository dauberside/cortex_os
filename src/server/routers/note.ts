import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

// Zodスキーマ定義
export const createNoteSchema = z.object({
  title: z.string().min(1, "タイトルは必須です").max(255),
  content: z.string(),
});

export const updateNoteSchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(1, "タイトルは必須です").max(255),
  content: z.string(),
  tagIds: z.array(z.string().cuid()).optional(),
});

export const deleteNoteSchema = z.object({
  id: z.string().cuid(),
});

export const getNoteSchema = z.object({
  id: z.string().cuid(),
});

export const searchNotesSchema = z.object({
  query: z.string(),
});

export const importNotesSchema = z.object({
  notes: z.array(
    z.object({
      title: z.string(),
      content: z.string(),
    })
  ),
});

export const listNotesSchema = z.object({
  sortBy: z
    .enum(["custom", "title", "createdAt", "updatedAt"])
    .optional()
    .default("updatedAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const updateOrderSchema = z.object({
  noteIds: z.array(z.string().cuid()),
});

// Note Router
export const noteRouter = router({
  // ノート一覧取得（削除されていないもののみ）
  list: protectedProcedure
    .input(listNotesSchema.optional())
    .query(async ({ ctx, input }) => {
      const sortBy = input?.sortBy || "updatedAt";
      const sortOrder = input?.sortOrder || "desc";

      let orderBy: any = {};
      if (sortBy === "custom") {
        orderBy = { sortOrder: "asc" };
      } else {
        orderBy = { [sortBy]: sortOrder };
      }

      const notes = await ctx.prisma.note.findMany({
        where: {
          userId: ctx.userId,
          deletedAt: null,
        },
        orderBy,
        select: {
          id: true,
          title: true,
          content: true,
          sortOrder: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return notes;
    }),

  // ノート1件取得
  get: protectedProcedure.input(getNoteSchema).query(async ({ ctx, input }) => {
    const note = await ctx.prisma.note.findFirst({
      where: {
        id: input.id,
        userId: ctx.userId,
        deletedAt: null,
      },
      include: {
        noteTags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!note) {
      throw new Error("ノートが見つかりません");
    }

    return {
      ...note,
      tags: note.noteTags.map((nt) => ({
        id: nt.tag.id,
        name: nt.tag.name,
      })),
    };
  }),

  // ノート作成
  create: protectedProcedure
    .input(createNoteSchema)
    .mutation(async ({ ctx, input }) => {
      const note = await ctx.prisma.note.create({
        data: {
          title: input.title,
          content: input.content,
          userId: ctx.userId,
        },
      });

      return note;
    }),

  // ノート更新
  update: protectedProcedure
    .input(updateNoteSchema)
    .mutation(async ({ ctx, input }) => {
      // 権限チェック：自分のノートのみ更新可能
      const existing = await ctx.prisma.note.findFirst({
        where: {
          id: input.id,
          userId: ctx.userId,
          deletedAt: null,
        },
      });

      if (!existing) {
        throw new Error("ノートが見つかりません");
      }

      // タグIDが指定されている場合、タグを更新
      if (input.tagIds !== undefined) {
        // 既存のタグ関連を削除
        await ctx.prisma.noteTag.deleteMany({
          where: { noteId: input.id },
        });

        // 新しいタグ関連を作成
        if (input.tagIds.length > 0) {
          await ctx.prisma.noteTag.createMany({
            data: input.tagIds.map((tagId) => ({
              noteId: input.id,
              tagId: tagId,
            })),
          });
        }
      }

      const note = await ctx.prisma.note.update({
        where: { id: input.id },
        data: {
          title: input.title,
          content: input.content,
        },
      });

      return note;
    }),

  // ノート削除（論理削除）
  delete: protectedProcedure
    .input(deleteNoteSchema)
    .mutation(async ({ ctx, input }) => {
      // 権限チェック：自分のノートのみ削除可能
      const existing = await ctx.prisma.note.findFirst({
        where: {
          id: input.id,
          userId: ctx.userId,
          deletedAt: null,
        },
      });

      if (!existing) {
        throw new Error("ノートが見つかりません");
      }

      const note = await ctx.prisma.note.update({
        where: { id: input.id },
        data: {
          deletedAt: new Date(),
        },
      });

      return note;
    }),

  // ノート検索（拡張版：タグも検索対象）
  search: protectedProcedure
    .input(searchNotesSchema)
    .query(async ({ ctx, input }) => {
      if (!input.query || input.query.trim() === "") {
        return [];
      }

      const searchTerm = input.query.trim();

      // PostgreSQLの全文検索を使用（大文字小文字区別なし）
      const notes = await ctx.prisma.$queryRaw<
        Array<{
          id: string;
          title: string;
          content: string;
          createdAt: Date;
          updatedAt: Date;
          matchType: string;
          rank: number;
        }>
      >`
        SELECT DISTINCT
          n.id,
          n.title,
          n.content,
          n."createdAt",
          n."updatedAt",
          CASE
            WHEN n.title ILIKE ${`%${searchTerm}%`} THEN 'title'
            WHEN n.content ILIKE ${`%${searchTerm}%`} THEN 'content'
            ELSE 'tag'
          END as "matchType",
          CASE
            WHEN n.title ILIKE ${`%${searchTerm}%`} THEN 3
            WHEN n.content ILIKE ${`%${searchTerm}%`} THEN 2
            ELSE 1
          END as rank
        FROM notes n
        LEFT JOIN note_tags nt ON n.id = nt."noteId"
        LEFT JOIN tags t ON nt."tagId" = t.id
        WHERE n."userId" = ${ctx.userId}
          AND n."deletedAt" IS NULL
          AND (
            n.title ILIKE ${`%${searchTerm}%`}
            OR n.content ILIKE ${`%${searchTerm}%`}
            OR t.name ILIKE ${`%${searchTerm}%`}
          )
        ORDER BY rank DESC, n."updatedAt" DESC
      `;

      return notes.map((note) => ({
        id: note.id,
        title: note.title,
        content: note.content,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
        matchType: note.matchType,
      }));
    }),

  // ノートをエクスポート（全件取得）
  exportAll: protectedProcedure.query(async ({ ctx }) => {
    const notes = await ctx.prisma.note.findMany({
      where: {
        userId: ctx.userId,
        deletedAt: null,
      },
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return notes;
  }),

  // ノートをインポート
  importNotes: protectedProcedure
    .input(importNotesSchema)
    .mutation(async ({ ctx, input }) => {
      const createdNotes = await Promise.all(
        input.notes.map((note) =>
          ctx.prisma.note.create({
            data: {
              title: note.title,
              content: note.content,
              userId: ctx.userId,
            },
          })
        )
      );

      return { count: createdNotes.length };
    }),

  // ノートの並び順を更新
  updateOrder: protectedProcedure
    .input(updateOrderSchema)
    .mutation(async ({ ctx, input }) => {
      // 各ノートのsortOrderを更新
      await Promise.all(
        input.noteIds.map((noteId, index) =>
          ctx.prisma.note.updateMany({
            where: {
              id: noteId,
              userId: ctx.userId,
            },
            data: {
              sortOrder: index,
            },
          })
        )
      );

      return { success: true };
    }),
});
