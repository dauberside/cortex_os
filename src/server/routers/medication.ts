import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

// バリデーションスキーマ
const createMedicationSchema = z.object({
  recipientId: z.string(),
  medicatedAt: z.date(),
  medicationName: z.string().min(1, "薬剤名は必須です"),
  dosage: z.string().min(1, "用量は必須です"),
  method: z.enum(["Oral", "Injection", "Tube"]).optional(),
  status: z.enum(["Completed", "Refused", "Error"]).default("Completed"),
  notes: z.string().optional(),
});

const updateMedicationSchema = createMedicationSchema.partial().extend({
  id: z.string(),
});

export const medicationRouter = router({
  // 服薬記録一覧取得
  list: protectedProcedure
    .input(
      z.object({
        recipientId: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        status: z.enum(["Completed", "Refused", "Error"]).optional(),
        limit: z.number().optional().default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {
        recipient: {
          userId: ctx.session.user.id,
        },
      };

      if (input.recipientId) {
        where.recipientId = input.recipientId;
      }

      if (input.status) {
        where.status = input.status;
      }

      if (input.startDate || input.endDate) {
        where.medicatedAt = {};
        if (input.startDate) {
          where.medicatedAt.gte = input.startDate;
        }
        if (input.endDate) {
          where.medicatedAt.lte = input.endDate;
        }
      }

      return ctx.db.medication.findMany({
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
        orderBy: { medicatedAt: "desc" },
        take: input.limit,
      });
    }),

  // 服薬記録詳細取得
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const medication = await ctx.db.medication.findFirst({
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

      if (!medication) {
        throw new Error("服薬記録が見つかりません");
      }

      return medication;
    }),

  // 服薬記録作成
  create: protectedProcedure
    .input(createMedicationSchema)
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

      return ctx.db.medication.create({
        data: {
          ...input,
          userId: ctx.session.user.id,
        },
      });
    }),

  // 服薬記録更新
  update: protectedProcedure
    .input(updateMedicationSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // 権限チェック
      const existing = await ctx.db.medication.findFirst({
        where: {
          id,
          recipient: {
            userId: ctx.session.user.id,
          },
        },
      });

      if (!existing) {
        throw new Error("服薬記録が見つかりません");
      }

      return ctx.db.medication.update({
        where: { id },
        data,
      });
    }),

  // 服薬記録削除
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // 権限チェック
      const existing = await ctx.db.medication.findFirst({
        where: {
          id: input.id,
          recipient: {
            userId: ctx.session.user.id,
          },
        },
      });

      if (!existing) {
        throw new Error("服薬記録が見つかりません");
      }

      return ctx.db.medication.delete({
        where: { id: input.id },
      });
    }),

  // ステータス別統計
  statsByStatus: protectedProcedure
    .input(
      z.object({
        recipientId: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {
        recipient: {
          userId: ctx.session.user.id,
        },
      };

      if (input.recipientId) {
        where.recipientId = input.recipientId;
      }

      if (input.startDate || input.endDate) {
        where.medicatedAt = {};
        if (input.startDate) {
          where.medicatedAt.gte = input.startDate;
        }
        if (input.endDate) {
          where.medicatedAt.lte = input.endDate;
        }
      }

      const stats = await ctx.db.medication.groupBy({
        by: ["status"],
        where,
        _count: true,
      });

      return stats;
    }),
});
