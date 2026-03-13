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

  // アセスメント作成または更新（廃止: 利用者基本情報で管理）
  upsert: protectedProcedure
    .input(assessmentSchema)
    .mutation(async () => {
      throw new TRPCError({
        code: "FORBIDDEN",
        message:
          "アセスメントの編集機能は廃止されました。利用者基本情報（CareRecipient）で管理してください。既存データは参照・印刷のみ可能です。",
      });
    }),

  // アセスメント削除（廃止: 利用者基本情報で管理）
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async () => {
      throw new TRPCError({
        code: "FORBIDDEN",
        message:
          "アセスメントの削除機能は廃止されました。既存データは参照・印刷のみ可能です。",
      });
    }),
});
