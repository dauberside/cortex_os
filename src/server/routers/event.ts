import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";

// Zodスキーマ定義
export const addEventSchema = z.object({
  noteId: z.string().cuid(),
  eventType: z.enum(["Action", "Decision", "Update", "Evidence"]),
  content: z.string().min(1, "内容は必須です"),
  createdBy: z.string().optional(),
});

export const listEventsSchema = z.object({
  noteId: z.string().cuid(),
});

// Event Router
export const eventRouter = router({
  // イベントを追加
  add: protectedProcedure
    .input(addEventSchema)
    .mutation(async ({ ctx, input }) => {
      // インシデントの存在と権限を確認
      const incident = await (ctx.prisma as any).note.findFirst({
        where: {
          id: input.noteId,
          userId: ctx.session.user.id,
          isIncident: true,
          deletedAt: null,
        },
      });

      if (!incident) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "インシデントが見つかりません",
        });
      }

      const event = await (ctx.prisma as any).incidentEvent.create({
        data: {
          noteId: input.noteId,
          eventType: input.eventType,
          content: input.content,
          createdBy:
            input.createdBy || ctx.session.user.name || ctx.session.user.email,
        },
      });

      return event;
    }),

  // イベント一覧を取得
  list: protectedProcedure
    .input(listEventsSchema)
    .query(async ({ ctx, input }) => {
      // インシデントの存在と権限を確認
      const incident = await (ctx.prisma as any).note.findFirst({
        where: {
          id: input.noteId,
          userId: ctx.session.user.id,
          isIncident: true,
          deletedAt: null,
        },
      });

      if (!incident) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "インシデントが見つかりません",
        });
      }

      const events = await (ctx.prisma as any).incidentEvent.findMany({
        where: { noteId: input.noteId },
        orderBy: { createdAt: "desc" },
      });

      return events;
    }),
});
