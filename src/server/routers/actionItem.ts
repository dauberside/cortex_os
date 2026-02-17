import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";

// Zodスキーマ定義
export const createActionItemSchema = z.object({
  noteId: z.string().cuid(),
  title: z.string().min(1, "タイトルは必須です").max(255),
  description: z.string().optional(),
  owner: z.string().optional(),
  dueDate: z.date().optional(),
});

export const updateActionItemSchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  owner: z.string().optional(),
  status: z.enum(["Open", "InProgress", "Done"]).optional(),
  dueDate: z.date().optional(),
});

export const listActionItemsSchema = z.object({
  noteId: z.string().cuid(),
  status: z.enum(["Open", "InProgress", "Done", "all"]).optional().default("all"),
});

// ActionItem Router
export const actionItemRouter = router({
  // アクションアイテムを作成
  create: protectedProcedure
    .input(createActionItemSchema)
    .mutation(async ({ ctx, input }) => {
      // インシデントの存在と権限を確認
      const incident = await (ctx.prisma as any).note.findFirst({
        where: {
          id: input.noteId,
          userId: ctx.session.user.id,
          deletedAt: null,
        } as any,
      });

      if (!incident) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "インシデントが見つかりません",
        });
      }

      const actionItem = await (ctx.prisma as any).incidentActionItem.create({
        data: {
          noteId: input.noteId,
          title: input.title,
          description: input.description || null,
          owner: input.owner || null,
          dueDate: input.dueDate || null,
        },
      });

      return actionItem;
    }),

  // アクションアイテムを更新
  update: protectedProcedure
    .input(updateActionItemSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const actionItem = await (ctx.prisma as any).incidentActionItem.findUnique({
        where: { id },
        include: { note: true },
      });

      if (!actionItem || actionItem.note.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "アクションアイテムが見つかりません",
        });
      }

      const updated = await (ctx.prisma as any).incidentActionItem.update({
        where: { id },
        data,
      });

      return updated;
    }),

  // アクションアイテム一覧を取得
  list: protectedProcedure
    .input(listActionItemsSchema)
    .query(async ({ ctx, input }) => {
      // インシデントの存在と権限を確認
      const incident = await (ctx.prisma as any).note.findFirst({
        where: {
          id: input.noteId,
          userId: ctx.session.user.id,
          deletedAt: null,
        } as any,
      });

      if (!incident) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "インシデントが見つかりません",
        });
      }

      const where: any = { noteId: input.noteId };
      if (input.status !== "all") {
        where.status = input.status;
      }

      const actionItems = await (ctx.prisma as any).incidentActionItem.findMany({
        where,
        orderBy: { createdAt: "desc" },
      });

      return actionItems;
    }),
});
