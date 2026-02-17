import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

// バリデーションスキーマ
const createCareRecordSchema = z.object({
  recipientId: z.string(),
  recordDate: z.date(),
  category: z.enum([
    "Meal",
    "Excretion",
    "Bath",
    "Medical",
    "Communication",
    "Activity",
  ]),
  content: z.string().min(1, "支援内容は必須です"),
  notes: z.string().optional(),
  // 食事記録用
  mealAmount: z.enum(["全量", "半量", "少量"]).optional(),
  mealTexture: z.enum(["常食", "刻み", "ミキサー"]).optional(),
  // 排泄記録用
  excretionType: z.enum(["Urine", "Feces"]).optional(),
  excretionForm: z.enum(["正常", "軟便", "下痢", "便秘"]).optional(),
  // 入浴記録用
  bathType: z.enum(["入浴", "シャワー", "清拭"]).optional(),
});

const updateCareRecordSchema = createCareRecordSchema.partial().extend({
  id: z.string(),
});

export const careRecordRouter = router({
  // 支援記録一覧取得
  list: protectedProcedure
    .input(
      z.object({
        recipientId: z.string().optional(),
        category: z
          .enum([
            "Meal",
            "Excretion",
            "Bath",
            "Medical",
            "Communication",
            "Activity",
          ])
          .optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().optional().default(50),
        offset: z.number().optional().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {
        userId: ctx.session.user.id,
      };

      if (input.recipientId) {
        where.recipientId = input.recipientId;
      }

      if (input.category) {
        where.category = input.category;
      }

      if (input.startDate || input.endDate) {
        where.recordDate = {};
        if (input.startDate) {
          where.recordDate.gte = input.startDate;
        }
        if (input.endDate) {
          where.recordDate.lte = input.endDate;
        }
      }

      const [records, total] = await Promise.all([
        ctx.db.careRecord.findMany({
          where,
          include: {
            recipient: {
              select: {
                id: true,
                name: true,
              },
            },
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { recordDate: "desc" },
          take: input.limit,
          skip: input.offset,
        }),
        ctx.db.careRecord.count({ where }),
      ]);

      return {
        records,
        total,
      };
    }),

  // 支援記録詳細取得
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const record = await ctx.db.careRecord.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
        include: {
          recipient: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!record) {
        throw new Error("支援記録が見つかりません");
      }

      return record;
    }),

  // 支援記録作成
  create: protectedProcedure
    .input(createCareRecordSchema)
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

      return ctx.db.careRecord.create({
        data: {
          ...input,
          userId: ctx.session.user.id,
        },
        include: {
          recipient: true,
        },
      });
    }),

  // 支援記録更新
  update: protectedProcedure
    .input(updateCareRecordSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // 権限チェック
      const existing = await ctx.db.careRecord.findFirst({
        where: {
          id,
          userId: ctx.session.user.id,
        },
      });

      if (!existing) {
        throw new Error("支援記録が見つかりません");
      }

      return ctx.db.careRecord.update({
        where: { id },
        data,
      });
    }),

  // 支援記録削除
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // 権限チェック
      const existing = await ctx.db.careRecord.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
      });

      if (!existing) {
        throw new Error("支援記録が見つかりません");
      }

      return ctx.db.careRecord.delete({
        where: { id: input.id },
      });
    }),

  // カテゴリ別統計
  statsByCategory: protectedProcedure
    .input(
      z.object({
        recipientId: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {
        userId: ctx.session.user.id,
      };

      if (input.recipientId) {
        where.recipientId = input.recipientId;
      }

      if (input.startDate || input.endDate) {
        where.recordDate = {};
        if (input.startDate) {
          where.recordDate.gte = input.startDate;
        }
        if (input.endDate) {
          where.recordDate.lte = input.endDate;
        }
      }

      const stats = await ctx.db.careRecord.groupBy({
        by: ["category"],
        where,
        _count: true,
      });

      return stats;
    }),
});
