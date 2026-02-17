import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

// Zodスキーマ定義
export const createLinkSchema = z.object({
  fromNoteId: z.string().cuid(),
  toNoteId: z.string().cuid(),
  type: z.string().optional(),
});

export const deleteLinkSchema = z.object({
  id: z.string().cuid(),
});

export const getLinksByNoteSchema = z.object({
  noteId: z.string().cuid(),
});

// Link Router
export const linkRouter = router({
  // グラフビュー用：全ノートとリンクを取得
  getGraph: protectedProcedure.query(async ({ ctx }) => {
    // ユーザーの全ノートを取得
    const notes = await ctx.prisma.note.findMany({
      where: {
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
      orderBy: {
        updatedAt: "desc",
      },
    });

    // ユーザーの全リンクを取得
    const links = await ctx.prisma.link.findMany({
      where: {
        userId: ctx.userId,
      },
      select: {
        id: true,
        fromNoteId: true,
        toNoteId: true,
        type: true,
      },
    });

    return {
      nodes: notes.map((note) => ({
        id: note.id,
        title: note.title,
        content: note.content,
        tags: note.noteTags.map((nt) => ({
          id: nt.tag.id,
          name: nt.tag.name,
        })),
      })),
      links: links.map((link) => ({
        id: link.id,
        source: link.fromNoteId,
        target: link.toNoteId,
        type: link.type,
      })),
    };
  }),

  // ノートに紐付くリンク一覧取得（fromLinks + toLinks）
  getByNote: protectedProcedure
    .input(getLinksByNoteSchema)
    .query(async ({ ctx, input }) => {
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

      // 出ていくリンク（fromLinks）と入ってくるリンク（toLinks）を取得
      const [fromLinks, toLinks] = await Promise.all([
        ctx.prisma.link.findMany({
          where: {
            fromNoteId: input.noteId,
            userId: ctx.userId,
          },
          include: {
            toNote: {
              select: {
                id: true,
                title: true,
                content: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        }),
        ctx.prisma.link.findMany({
          where: {
            toNoteId: input.noteId,
            userId: ctx.userId,
          },
          include: {
            fromNote: {
              select: {
                id: true,
                title: true,
                content: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        }),
      ]);

      return {
        outgoing: fromLinks.map((link) => ({
          id: link.id,
          type: link.type,
          note: link.toNote,
          createdAt: link.createdAt,
        })),
        incoming: toLinks.map((link) => ({
          id: link.id,
          type: link.type,
          note: link.fromNote,
          createdAt: link.createdAt,
        })),
      };
    }),

  // リンク作成
  create: protectedProcedure
    .input(createLinkSchema)
    .mutation(async ({ ctx, input }) => {
      // 両方のノートの権限チェック
      const [fromNote, toNote] = await Promise.all([
        ctx.prisma.note.findFirst({
          where: {
            id: input.fromNoteId,
            userId: ctx.userId,
            deletedAt: null,
          },
        }),
        ctx.prisma.note.findFirst({
          where: {
            id: input.toNoteId,
            userId: ctx.userId,
            deletedAt: null,
          },
        }),
      ]);

      if (!fromNote) {
        throw new Error("リンク元のノートが見つかりません");
      }

      if (!toNote) {
        throw new Error("リンク先のノートが見つかりません");
      }

      // 自己リンク防止
      if (input.fromNoteId === input.toNoteId) {
        throw new Error("同じノートへのリンクは作成できません");
      }

      // 既存リンクチェック（重複防止）
      const existing = await ctx.prisma.link.findFirst({
        where: {
          fromNoteId: input.fromNoteId,
          toNoteId: input.toNoteId,
          userId: ctx.userId,
        },
      });

      if (existing) {
        return existing;
      }

      // リンク作成
      const link = await ctx.prisma.link.create({
        data: {
          fromNoteId: input.fromNoteId,
          toNoteId: input.toNoteId,
          type: input.type,
          userId: ctx.userId,
        },
        include: {
          toNote: {
            select: {
              id: true,
              title: true,
              content: true,
            },
          },
        },
      });

      return link;
    }),

  // リンク削除
  delete: protectedProcedure
    .input(deleteLinkSchema)
    .mutation(async ({ ctx, input }) => {
      // 権限チェック
      const existing = await ctx.prisma.link.findFirst({
        where: {
          id: input.id,
          userId: ctx.userId,
        },
      });

      if (!existing) {
        throw new Error("リンクが見つかりません");
      }

      await ctx.prisma.link.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});
