import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

export const serviceRecordRouter = router({
  // サービス実績一覧（月次集計用）
  list: protectedProcedure
    .input(
      z.object({
        // フィルタ条件
        startDate: z.date().optional(), // 期間開始
        endDate: z.date().optional(), // 期間終了
        recipientId: z.string().optional(), // 利用者ID
        serviceType: z.string().optional(), // サービス種別
        timeBand: z.enum(["DAYTIME", "EARLY_LATE", "CROSSES_BANDS"]).optional(), // 時間帯
        needsReview: z.boolean().optional(), // 要レビューのみ（CROSSES_BANDS）
        limit: z.number().int().min(1).max(200).default(100),
      })
    )
    .query(async ({ ctx, input }) => {
      const whereClause: any = {};

      // 期間フィルタ
      if (input.startDate || input.endDate) {
        whereClause.serviceDate = {};
        if (input.startDate) {
          whereClause.serviceDate.gte = input.startDate;
        }
        if (input.endDate) {
          whereClause.serviceDate.lte = input.endDate;
        }
      }

      // 利用者フィルタ
      if (input.recipientId) {
        whereClause.recipientId = input.recipientId;
      }

      // サービス種別フィルタ
      if (input.serviceType) {
        whereClause.serviceType = input.serviceType;
      }

      // 時間帯フィルタ
      if (input.timeBand) {
        whereClause.timeBand = input.timeBand;
      }

      // 要レビュー（時間帯跨ぎ）のみ
      if (input.needsReview) {
        whereClause.timeBand = "CROSSES_BANDS";
      }

      return ctx.db.serviceRecord.findMany({
        where: whereClause,
        include: {
          recipient: {
            select: {
              id: true,
              name: true,
              nameKana: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          guideRecord: {
            select: {
              id: true,
              status: true,
            },
          },
        },
        orderBy: [{ serviceDate: "desc" }, { startTime: "desc" }],
        take: input.limit,
      });
    }),

  // サービス実績詳細
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const record = await ctx.db.serviceRecord.findUnique({
        where: { id: input.id },
        include: {
          recipient: {
            select: {
              id: true,
              name: true,
              nameKana: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          guideRecord: {
            select: {
              id: true,
              status: true,
              startedAt: true,
              endedAt: true,
              destination: true,
              purpose: true,
              transport: true,
              supportContent: true,
              userCondition: true,
              notes: true,
            },
          },
        },
      });

      if (!record) {
        throw new Error("サービス実績が見つかりません");
      }

      return record;
    }),

  // 月次サマリー（集計情報）
  monthlySummary: protectedProcedure
    .input(
      z.object({
        year: z.number().int(),
        month: z.number().int().min(1).max(12),
        recipientId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // 月の開始日・終了日を計算
      const startDate = new Date(input.year, input.month - 1, 1);
      const endDate = new Date(input.year, input.month, 0, 23, 59, 59);

      const whereClause: any = {
        serviceDate: {
          gte: startDate,
          lte: endDate,
        },
      };

      if (input.recipientId) {
        whereClause.recipientId = input.recipientId;
      }

      // 全レコード取得（集計のため）
      const records = await ctx.db.serviceRecord.findMany({
        where: whereClause,
        include: {
          recipient: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // サービス種別ごとの集計
      const byServiceType: Record<string, number> = {};
      const byTimeBand: Record<string, number> = {};
      let totalDuration = 0;
      let crossesBandsCount = 0;

      records.forEach((record) => {
        // サービス種別集計
        byServiceType[record.serviceType] =
          (byServiceType[record.serviceType] || 0) + 1;

        // 時間帯集計
        if (record.timeBand) {
          byTimeBand[record.timeBand] =
            (byTimeBand[record.timeBand] || 0) + 1;

          if (record.timeBand === "CROSSES_BANDS") {
            crossesBandsCount++;
          }
        }

        // 総所要時間
        totalDuration += record.duration;
      });

      return {
        totalRecords: records.length,
        totalDuration,
        totalHours: Math.floor(totalDuration / 60),
        totalMinutes: totalDuration % 60,
        byServiceType,
        byTimeBand,
        crossesBandsCount, // 要レビュー件数
        records: records.slice(0, 20), // 最新20件のみ返す
      };
    }),
});
