import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

// バリデーションスキーマ
const upsertAssessmentSchema = z.object({
  recipientId: z.string(),
  // ADL
  adlMovement: z
    .enum(["Independent", "Assisted", "Wheelchair", "Bedridden", ""])
    .optional(),
  adlEating: z.enum(["Independent", "Partial", "Full", ""]).optional(),
  adlToilet: z.enum(["Independent", "Partial", "Full", ""]).optional(),
  adlBathing: z.enum(["Independent", "Partial", "Full", ""]).optional(),
  adlDressing: z.enum(["Independent", "Partial", "Full", ""]).optional(),
  adlGrooming: z.enum(["Independent", "Partial", "Full", ""]).optional(),
  // コミュニケーション
  commMethod: z.string().optional(),
  commVision: z.enum(["Normal", "Weak", "Blind", ""]).optional(),
  commHearing: z.enum(["Normal", "Weak", "Deaf", ""]).optional(),
  commSpeech: z.enum(["Normal", "Difficult", "None", ""]).optional(),
  // 行動特性
  lifeRhythm: z.string().optional(),
  hobbies: z.string().optional(),
  personality: z.string().optional(),
  // 注意事項
  cautions: z.string().optional(),
  emergencyNote: z.string().optional(),
  // 服薬情報詳細
  medicationDetails: z.string().optional(),
  // その他
  familyStructure: z.string().optional(),
  supportSystem: z.string().optional(),
});

export const assessmentRouter = router({
  // アセスメント取得
  get: protectedProcedure
    .input(z.object({ recipientId: z.string() }))
    .query(async ({ ctx, input }) => {
      const assessment = await ctx.db.assessment.findUnique({
        where: {
          recipientId: input.recipientId,
        },
        include: {
          recipient: true,
        },
      });

      // 権限チェック
      if (assessment && assessment.recipient.userId !== ctx.session.user.id) {
        throw new Error("アクセス権限がありません");
      }

      return assessment;
    }),

  // アセスメント作成・更新（Upsert）
  upsert: protectedProcedure
    .input(upsertAssessmentSchema)
    .mutation(async ({ ctx, input }) => {
      const { recipientId, ...data } = input;

      // 利用者の存在確認・権限チェック
      const recipient = await ctx.db.careRecipient.findFirst({
        where: {
          id: recipientId,
          userId: ctx.session.user.id,
          deletedAt: null,
        },
      });

      if (!recipient) {
        throw new Error("利用者が見つかりません");
      }

      // 空文字列をundefinedに変換
      const cleanedData: any = {};
      for (const [key, value] of Object.entries(data)) {
        if (value !== "") {
          cleanedData[key] = value;
        }
      }

      return ctx.db.assessment.upsert({
        where: { recipientId },
        create: {
          recipientId,
          userId: ctx.session.user.id,
          ...cleanedData,
        },
        update: cleanedData,
        include: {
          recipient: true,
        },
      });
    }),

  // アセスメント削除
  delete: protectedProcedure
    .input(z.object({ recipientId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // 権限チェック
      const assessment = await ctx.db.assessment.findUnique({
        where: { recipientId: input.recipientId },
        include: { recipient: true },
      });

      if (!assessment || assessment.recipient.userId !== ctx.session.user.id) {
        throw new Error("アクセス権限がありません");
      }

      return ctx.db.assessment.delete({
        where: { recipientId: input.recipientId },
      });
    }),
});
