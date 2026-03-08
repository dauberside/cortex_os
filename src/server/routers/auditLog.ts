import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

export const auditLogRouter = router({
  // 監査ログ記録
  log: protectedProcedure
    .input(
      z.object({
        action: z.string(), // View/Create/Edit/Delete/Review
        resourceType: z.string(), // CareRecipient/GuideRecord/Assessment/ServiceRecord/DailyLog
        resourceId: z.string(),
        path: z.string().optional(),
        changeNote: z.string().optional(),
        metadata: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // View操作の場合、30秒以内の重複を防ぐ
      if (input.action === "View") {
        const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);

        const recentLog = await ctx.db.auditLog.findFirst({
          where: {
            userId: ctx.session.user.id,
            action: "View",
            resourceType: input.resourceType,
            resourceId: input.resourceId,
            path: input.path,
            createdAt: {
              gte: thirtySecondsAgo,
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        // 重複と判定した場合、既存のログを返す
        if (recentLog) {
          return recentLog;
        }
      }

      // 新規ログ作成
      return ctx.db.auditLog.create({
        data: {
          userId: ctx.session.user.id,
          action: input.action,
          resourceType: input.resourceType,
          resourceId: input.resourceId,
          path: input.path,
          changeNote: input.changeNote,
          metadata: input.metadata,
        },
      });
    }),

  // 監査ログ取得（ID指定）
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // 権限チェック：MANAGER のみ閲覧可能
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { role: true },
      });

      if (currentUser?.role !== "MANAGER") {
        throw new Error("監査ログの閲覧には管理者権限が必要です");
      }

      return ctx.db.auditLog.findUniqueOrThrow({
        where: { id: input.id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });
    }),

  // 監査ログ一覧取得（管理者用）
  list: protectedProcedure
    .input(
      z.object({
        resourceType: z.string().optional(),
        resourceId: z.string().optional(),
        action: z.string().optional(),
        userId: z.string().optional(),
        days: z.number().int().min(1).max(365).default(30), // デフォルト30日
        limit: z.number().int().min(1).max(100).default(50),
        offset: z.number().int().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      // 権限チェック：MANAGER のみ閲覧可能
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { role: true },
      });

      if (currentUser?.role !== "MANAGER") {
        throw new Error("監査ログの閲覧には管理者権限が必要です");
      }

      // 期間範囲を計算（デフォルト30日）
      // 今日の23:59:59まで含める
      const now = new Date();
      now.setHours(23, 59, 59, 999);

      // X日前の00:00:00から
      const from = new Date(now);
      from.setDate(from.getDate() - (input.days - 1));
      from.setHours(0, 0, 0, 0);

      const whereClause: any = {
        createdAt: {
          gte: from,
          lte: now,
        },
      };
      if (input.resourceType) whereClause.resourceType = input.resourceType;
      if (input.resourceId) whereClause.resourceId = input.resourceId;
      if (input.action) whereClause.action = input.action;
      if (input.userId) whereClause.userId = input.userId;

      const [logs, total] = await Promise.all([
        ctx.db.auditLog.findMany({
          where: whereClause,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: input.limit,
          skip: input.offset,
        }),
        ctx.db.auditLog.count({ where: whereClause }),
      ]);

      return { logs, total };
    }),

  // 特定リソースの監査ログ取得
  getByResource: protectedProcedure
    .input(
      z.object({
        resourceType: z.string(),
        resourceId: z.string(),
        limit: z.number().int().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      // 権限チェック：LEAD または MANAGER が閲覧可能
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { role: true },
      });

      if (
        !currentUser ||
        (currentUser.role !== "LEAD" && currentUser.role !== "MANAGER")
      ) {
        throw new Error("監査ログの閲覧にはリーダー以上の権限が必要です");
      }

      return ctx.db.auditLog.findMany({
        where: {
          resourceType: input.resourceType,
          resourceId: input.resourceId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
      });
    }),
});
