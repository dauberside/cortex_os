import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import {
  assessmentSchema,
  assessmentUpdateSchema,
} from "@/lib/validations/assessment";

export const assessmentRouter = router({
  // アセスメント取得（利用者IDで）
  getByRecipient: protectedProcedure
    .input(z.object({ recipientId: z.string() }))
    .query(async ({ ctx, input }) => {
      const assessment = await ctx.prisma.assessment.findUnique({
        where: { recipientId: input.recipientId },
        include: {
          recipient: {
            select: {
              id: true,
              name: true,
              nameKana: true,
              birthDate: true,
              gender: true,
            },
          },
        },
      });

      return assessment;
    }),

  // 後方互換性のためのエイリアス（deprecated: getByRecipientを使用してください）
  get: protectedProcedure
    .input(z.object({ recipientId: z.string() }))
    .query(async ({ ctx, input }) => {
      const assessment = await ctx.prisma.assessment.findUnique({
        where: { recipientId: input.recipientId },
        include: {
          recipient: {
            select: {
              id: true,
              name: true,
              nameKana: true,
              birthDate: true,
              gender: true,
            },
          },
        },
      });

      return assessment;
    }),

  // アセスメント作成または更新
  upsert: protectedProcedure
    .input(assessmentSchema)
    .mutation(async ({ ctx, input }) => {
      const { recipientId, ...data } = input;

      // 利用者の存在確認
      const recipient = await ctx.prisma.careRecipient.findUnique({
        where: { id: recipientId },
      });

      if (!recipient) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "利用者が見つかりません",
        });
      }

      // 既存のアセスメント確認
      const existing = await ctx.prisma.assessment.findUnique({
        where: { recipientId },
      });

      if (existing) {
        // 更新
        const updated = await ctx.prisma.assessment.update({
          where: { id: existing.id },
          data: {
            ...data,
            userId: ctx.session.user.id,
          },
        });

        // 監査ログ記録
        await ctx.prisma.auditLog.create({
          data: {
            userId: ctx.session.user.id,
            action: "Edit",
            resourceType: "Assessment",
            resourceId: updated.id,
            metadata: {
              recipientId,
              recipientName: recipient.name,
            },
          },
        });

        return updated;
      } else {
        // 新規作成
        const created = await ctx.prisma.assessment.create({
          data: {
            recipientId,
            userId: ctx.session.user.id,
            ...data,
          },
        });

        // 監査ログ記録
        await ctx.prisma.auditLog.create({
          data: {
            userId: ctx.session.user.id,
            action: "Create",
            resourceType: "Assessment",
            resourceId: created.id,
            metadata: {
              recipientId,
              recipientName: recipient.name,
            },
          },
        });

        return created;
      }
    }),

  // アセスメント削除
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const assessment = await ctx.prisma.assessment.findUnique({
        where: { id: input.id },
        include: {
          recipient: {
            select: { name: true },
          },
        },
      });

      if (!assessment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "アセスメントが見つかりません",
        });
      }

      // 削除
      await ctx.prisma.assessment.delete({
        where: { id: input.id },
      });

      // 監査ログ記録
      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.session.user.id,
          action: "Delete",
          resourceType: "Assessment",
          resourceId: input.id,
          metadata: {
            recipientId: assessment.recipientId,
            recipientName: assessment.recipient.name,
          },
        },
      });

      return { success: true };
    }),
});
