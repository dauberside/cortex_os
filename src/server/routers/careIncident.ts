import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

// バリデーションスキーマ
const createCareIncidentSchema = z.object({
  recipientId: z.string(),
  occurredAt: z.date(),
  discoveredBy: z.string().min(1, "発見者名は必須です"),
  location: z.string().min(1, "発生場所は必須です"),
  incidentType: z.enum(["Fall", "Medication", "Wandering", "Injury", "Other"]),
  severityLevel: z.number().int().min(0).max(5),
  situation: z.string().min(1, "発生状況は必須です"),
  cause: z.string().optional(),
  response: z.string().optional(),
  prevention: z.string().optional(),
});

const updateCareIncidentSchema = createCareIncidentSchema.partial().extend({
  id: z.string(),
});

export const careIncidentRouter = router({
  // ヒヤリハット一覧取得
  list: protectedProcedure
    .input(
      z.object({
        recipientId: z.string().optional(),
        incidentType: z
          .enum(["Fall", "Medication", "Wandering", "Injury", "Other"])
          .optional(),
        severityLevel: z.number().int().min(0).max(5).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
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

      if (input.incidentType) {
        where.incidentType = input.incidentType;
      }

      if (input.severityLevel !== undefined) {
        where.severityLevel = input.severityLevel;
      }

      if (input.startDate || input.endDate) {
        where.occurredAt = {};
        if (input.startDate) {
          where.occurredAt.gte = input.startDate;
        }
        if (input.endDate) {
          where.occurredAt.lte = input.endDate;
        }
      }

      return ctx.db.careIncident.findMany({
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
        orderBy: { occurredAt: "desc" },
        take: input.limit,
      });
    }),

  // ヒヤリハット詳細取得
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const incident = await ctx.db.careIncident.findFirst({
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

      if (!incident) {
        throw new Error("ヒヤリハット報告が見つかりません");
      }

      return incident;
    }),

  // ヒヤリハット作成
  create: protectedProcedure
    .input(createCareIncidentSchema)
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

      return ctx.db.careIncident.create({
        data: {
          ...input,
          userId: ctx.session.user.id,
        },
      });
    }),

  // ヒヤリハット更新
  update: protectedProcedure
    .input(updateCareIncidentSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // 権限チェック
      const existing = await ctx.db.careIncident.findFirst({
        where: {
          id,
          recipient: {
            userId: ctx.session.user.id,
          },
        },
      });

      if (!existing) {
        throw new Error("ヒヤリハット報告が見つかりません");
      }

      return ctx.db.careIncident.update({
        where: { id },
        data,
      });
    }),

  // ヒヤリハット削除
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // 権限チェック
      const existing = await ctx.db.careIncident.findFirst({
        where: {
          id: input.id,
          recipient: {
            userId: ctx.session.user.id,
          },
        },
      });

      if (!existing) {
        throw new Error("ヒヤリハット報告が見つかりません");
      }

      return ctx.db.careIncident.delete({
        where: { id: input.id },
      });
    }),

  // タイプ別統計
  statsByType: protectedProcedure
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
        where.occurredAt = {};
        if (input.startDate) {
          where.occurredAt.gte = input.startDate;
        }
        if (input.endDate) {
          where.occurredAt.lte = input.endDate;
        }
      }

      const stats = await ctx.db.careIncident.groupBy({
        by: ["incidentType"],
        where,
        _count: true,
      });

      return stats;
    }),

  // 重要度別統計
  statsBySeverity: protectedProcedure
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
        where.occurredAt = {};
        if (input.startDate) {
          where.occurredAt.gte = input.startDate;
        }
        if (input.endDate) {
          where.occurredAt.lte = input.endDate;
        }
      }

      const stats = await ctx.db.careIncident.groupBy({
        by: ["severityLevel"],
        where,
        _count: true,
        orderBy: {
          severityLevel: "desc",
        },
      });

      return stats;
    }),

  // 月次推移統計
  monthlyTrend: protectedProcedure
    .input(
      z.object({
        recipientId: z.string().optional(),
        months: z.number().int().min(1).max(12).default(6),
      })
    )
    .query(async ({ ctx, input }) => {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - input.months);

      const where: any = {
        recipient: {
          userId: ctx.session.user.id,
        },
        occurredAt: {
          gte: startDate,
        },
      };

      if (input.recipientId) {
        where.recipientId = input.recipientId;
      }

      const incidents = await ctx.db.careIncident.findMany({
        where,
        select: {
          occurredAt: true,
          severityLevel: true,
        },
        orderBy: { occurredAt: "asc" },
      });

      // 月ごとに集計
      const monthlyData = new Map<string, number>();
      incidents.forEach((incident) => {
        const monthKey = `${incident.occurredAt.getFullYear()}-${String(
          incident.occurredAt.getMonth() + 1
        ).padStart(2, "0")}`;
        monthlyData.set(monthKey, (monthlyData.get(monthKey) || 0) + 1);
      });

      return Array.from(monthlyData.entries()).map(([month, count]) => ({
        month,
        count,
      }));
    }),
});
