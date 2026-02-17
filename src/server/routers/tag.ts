import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

// Zodスキーマ定義
export const createTagSchema = z.object({
  name: z.string().min(1, "タグ名は必須です").max(50),
});

export const deleteTagSchema = z.object({
  id: z.string().cuid(),
});

export const addTagToNoteSchema = z.object({
  noteId: z.string().cuid(),
  tagId: z.string().cuid(),
});

export const removeTagFromNoteSchema = z.object({
  noteId: z.string().cuid(),
  tagId: z.string().cuid(),
});

export const getTagsByNoteSchema = z.object({
  noteId: z.string().cuid(),
});

export const getNotesByTagSchema = z.object({
  tagId: z.string().cuid(),
});

// Tag Router
export const tagRouter = router({
  // タグ一覧取得
  list: protectedProcedure.query(async ({ ctx }) => {
    const tags = await ctx.prisma.tag.findMany({
      where: {
        userId: ctx.userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        _count: {
          select: {
            noteTags: true, // タグが使われているノート数
          },
        },
      },
    });

    return tags.map((tag) => ({
      ...tag,
      noteCount: tag._count.noteTags,
    }));
  }),

  // タグ作成（既存の場合は既存タグを返す）
  create: protectedProcedure
    .input(createTagSchema)
    .mutation(async ({ ctx, input }) => {
      // 既存のタグをチェック
      const existing = await ctx.prisma.tag.findUnique({
        where: {
          userId_name: {
            userId: ctx.userId,
            name: input.name,
          },
        },
      });

      if (existing) {
        return existing;
      }

      // 新規作成
      const tag = await ctx.prisma.tag.create({
        data: {
          name: input.name,
          userId: ctx.userId,
        },
      });

      return tag;
    }),

  // タグ削除（関連するNoteTagも削除される）
  delete: protectedProcedure
    .input(deleteTagSchema)
    .mutation(async ({ ctx, input }) => {
      // 権限チェック
      const existing = await ctx.prisma.tag.findFirst({
        where: {
          id: input.id,
          userId: ctx.userId,
        },
      });

      if (!existing) {
        throw new Error("タグが見つかりません");
      }

      await ctx.prisma.tag.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // ノートにタグを追加
  addToNote: protectedProcedure
    .input(addTagToNoteSchema)
    .mutation(async ({ ctx, input }) => {
      // ノートとタグの権限チェック
      const [note, tag] = await Promise.all([
        ctx.prisma.note.findFirst({
          where: {
            id: input.noteId,
            userId: ctx.userId,
            deletedAt: null,
          },
        }),
        ctx.prisma.tag.findFirst({
          where: {
            id: input.tagId,
            userId: ctx.userId,
          },
        }),
      ]);

      if (!note) {
        throw new Error("ノートが見つかりません");
      }

      if (!tag) {
        throw new Error("タグが見つかりません");
      }

      // 既に紐付いているかチェック
      const existing = await ctx.prisma.noteTag.findUnique({
        where: {
          noteId_tagId: {
            noteId: input.noteId,
            tagId: input.tagId,
          },
        },
      });

      if (existing) {
        return existing;
      }

      // 紐付け作成
      const noteTag = await ctx.prisma.noteTag.create({
        data: {
          noteId: input.noteId,
          tagId: input.tagId,
        },
      });

      return noteTag;
    }),

  // ノートからタグを削除
  removeFromNote: protectedProcedure
    .input(removeTagFromNoteSchema)
    .mutation(async ({ ctx, input }) => {
      // ノートの権限チェック
      const note = await ctx.prisma.note.findFirst({
        where: {
          id: input.noteId,
          userId: ctx.userId,
          deletedAt: null,
        },
      });

      if (!note) {
        throw new Error("ノートが見つかりません");
      }

      await ctx.prisma.noteTag.delete({
        where: {
          noteId_tagId: {
            noteId: input.noteId,
            tagId: input.tagId,
          },
        },
      });

      return { success: true };
    }),

  // ノートに紐付くタグ一覧取得
  getByNote: protectedProcedure
    .input(getTagsByNoteSchema)
    .query(async ({ ctx, input }) => {
      const noteTags = await ctx.prisma.noteTag.findMany({
        where: {
          noteId: input.noteId,
          note: {
            userId: ctx.userId,
            deletedAt: null,
          },
        },
        include: {
          tag: true,
        },
      });

      return noteTags.map((nt) => nt.tag);
    }),

  // タグでノートを絞り込み
  getNotesByTag: protectedProcedure
    .input(getNotesByTagSchema)
    .query(async ({ ctx, input }) => {
      const noteTags = await ctx.prisma.noteTag.findMany({
        where: {
          tagId: input.tagId,
          tag: {
            userId: ctx.userId,
          },
          note: {
            deletedAt: null,
          },
        },
        include: {
          note: {
            select: {
              id: true,
              title: true,
              content: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });

      return noteTags.map((nt) => nt.note);
    }),
});
