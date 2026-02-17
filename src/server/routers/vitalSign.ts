import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

// バリデーションスキーマ
const createVitalSignSchema = z.object({
  recipientId: z.string(),
  measuredAt: z.date(),
  // V - Vital signs
  temperature: z.number().min(30).max(45).optional(),
  systolic: z.number().int().min(50).max(250).optional(),
  diastolic: z.number().int().min(30).max(150).optional(),
  pulse: z.number().int().min(30).max(200).optional(),
  spo2: z.number().int().min(50).max(100).optional(),
  weight: z.number().min(0).max(300).optional(),
  // P - Physical status
  consciousness: z.enum(["Clear", "Drowsy", "Stupor", "Coma"]).optional(),
  mobility: z
    .enum(["Independent", "Assisted", "Wheelchair", "Bedridden"])
    .optional(),
  skinCondition: z
    .enum(["Normal", "Dry", "Rash", "Wound", "Pressure"])
    .optional(),
  excretion: z
    .enum(["Normal", "Constipation", "Diarrhea", "Urinary"])
    .optional(),
  // N - Nutrition
  mealIntake: z
    .enum(["Full", "ThreeQuarters", "Half", "Quarter", "None"])
    .optional(),
  waterIntake: z.enum(["Adequate", "Insufficient", "Excessive"]).optional(),
  nutritionNote: z.string().optional(),
  notes: z.string().optional(),
});

const updateVitalSignSchema = createVitalSignSchema.partial().extend({
  id: z.string(),
});

export const vitalSignRouter = router({
  // バイタルサイン一覧取得
  list: protectedProcedure
    .input(
      z.object({
        recipientId: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().optional().default(100),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {
        recipientId: input.recipientId,
        recipient: {
          userId: ctx.session.user.id,
        },
      };

      if (input.startDate || input.endDate) {
        where.measuredAt = {};
        if (input.startDate) {
          where.measuredAt.gte = input.startDate;
        }
        if (input.endDate) {
          where.measuredAt.lte = input.endDate;
        }
      }

      return ctx.db.vitalSign.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { measuredAt: "desc" },
        take: input.limit,
      });
    }),

  // バイタルサイン詳細取得
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const vitalSign = await ctx.db.vitalSign.findFirst({
        where: {
          id: input.id,
          recipient: {
            userId: ctx.session.user.id,
          },
        },
        include: {
          recipient: true,
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!vitalSign) {
        throw new Error("バイタルサインが見つかりません");
      }

      return vitalSign;
    }),

  // バイタルサイン作成
  create: protectedProcedure
    .input(createVitalSignSchema)
    .mutation(async ({ ctx, input }) => {
      // 利用者の存在確認
      const recipient = await ctx.db.careRecipient.findFirst({
        where: {
          id: input.recipientId,
          userId: ctx.session.user.id,
          deletedAt: null,
        },
      });

      if (!recipient) {
        throw new Error("利用者が見つかりません");
      }

      return ctx.db.vitalSign.create({
        data: {
          ...input,
          userId: ctx.session.user.id,
        },
      });
    }),

  // バイタルサイン更新
  update: protectedProcedure
    .input(updateVitalSignSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // 権限チェック
      const existing = await ctx.db.vitalSign.findFirst({
        where: {
          id,
          recipient: {
            userId: ctx.session.user.id,
          },
        },
      });

      if (!existing) {
        throw new Error("バイタルサインが見つかりません");
      }

      return ctx.db.vitalSign.update({
        where: { id },
        data,
      });
    }),

  // バイタルサイン削除
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // 権限チェック
      const existing = await ctx.db.vitalSign.findFirst({
        where: {
          id: input.id,
          recipient: {
            userId: ctx.session.user.id,
          },
        },
      });

      if (!existing) {
        throw new Error("バイタルサインが見つかりません");
      }

      return ctx.db.vitalSign.delete({
        where: { id: input.id },
      });
    }),

  // 統計情報取得（グラフ用）
  stats: protectedProcedure
    .input(
      z.object({
        recipientId: z.string(),
        startDate: z.date(),
        endDate: z.date(),
        metric: z.enum([
          "temperature",
          "bloodPressure",
          "pulse",
          "spo2",
          "weight",
        ]),
      })
    )
    .query(async ({ ctx, input }) => {
      const vitalSigns = await ctx.db.vitalSign.findMany({
        where: {
          recipientId: input.recipientId,
          recipient: {
            userId: ctx.session.user.id,
          },
          measuredAt: {
            gte: input.startDate,
            lte: input.endDate,
          },
        },
        orderBy: { measuredAt: "asc" },
      });

      return vitalSigns.map((vs) => ({
        measuredAt: vs.measuredAt,
        value:
          input.metric === "bloodPressure"
            ? { systolic: vs.systolic, diastolic: vs.diastolic }
            : vs[input.metric as keyof typeof vs],
      }));
    }),

  // 異常値チェック
  checkAbnormal: protectedProcedure
    .input(z.object({ recipientId: z.string() }))
    .query(async ({ ctx, input }) => {
      // 直近10件のバイタルサインを取得
      const recentVitals = await ctx.db.vitalSign.findMany({
        where: {
          recipientId: input.recipientId,
          recipient: {
            userId: ctx.session.user.id,
          },
        },
        orderBy: { measuredAt: "desc" },
        take: 10,
      });

      // 異常値の判定基準
      const abnormals = recentVitals.filter((vs) => {
        return (
          (vs.temperature &&
            (vs.temperature < 35.0 || vs.temperature > 38.5)) ||
          (vs.systolic && (vs.systolic < 90 || vs.systolic > 160)) ||
          (vs.diastolic && (vs.diastolic < 60 || vs.diastolic > 100)) ||
          (vs.pulse && (vs.pulse < 50 || vs.pulse > 100)) ||
          (vs.spo2 && vs.spo2 < 95)
        );
      });

      return abnormals;
    }),
});
