import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";

// 時間帯計算ヘルパー関数
type TimeBandResult = {
  timeBand: "DAYTIME" | "EARLY_LATE" | "CROSSES_BANDS";
  ruleVersion: string | null;
};

async function calculateTimeBand(
  db: any,
  startTime: Date,
  endTime: Date
): Promise<TimeBandResult> {
  // 有効な TimeBandRule を取得
  const activeRule = await db.timeBandRule.findFirst({
    where: {
      isActive: true,
      effectiveFrom: { lte: startTime },
      OR: [
        { effectiveTo: null },
        { effectiveTo: { gte: startTime } },
      ],
    },
    orderBy: { effectiveFrom: "desc" },
  });

  // ルールが存在しない場合は DAYTIME とみなす（デフォルト）
  if (!activeRule) {
    return { timeBand: "DAYTIME", ruleVersion: null };
  }

  const timeBands = activeRule.timeBands as {
    daytime?: { start: string; end: string };
    earlyLate?: Array<{ start: string; end: string }>;
  };

  // 時刻を HH:MM 形式に変換
  const formatTime = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const startTimeStr = formatTime(startTime);
  const endTimeStr = formatTime(endTime);

  // 時刻比較ヘルパー（HH:MM 形式）
  const isInRange = (time: string, start: string, end: string): boolean => {
    // 日跨ぎ対応（例: 22:00-06:00）
    if (start <= end) {
      return time >= start && time <= end;
    } else {
      return time >= start || time <= end;
    }
  };

  // DAYTIME チェック
  const daytime = timeBands.daytime;
  if (daytime) {
    const startInDaytime = isInRange(startTimeStr, daytime.start, daytime.end);
    const endInDaytime = isInRange(endTimeStr, daytime.start, daytime.end);

    if (startInDaytime && endInDaytime) {
      return { timeBand: "DAYTIME", ruleVersion: activeRule.version };
    }
    if (startInDaytime || endInDaytime) {
      return { timeBand: "CROSSES_BANDS", ruleVersion: activeRule.version };
    }
  }

  // EARLY_LATE チェック
  const earlyLate = timeBands.earlyLate;
  if (earlyLate && earlyLate.length > 0) {
    const startInEarlyLate = earlyLate.some((range) =>
      isInRange(startTimeStr, range.start, range.end)
    );
    const endInEarlyLate = earlyLate.some((range) =>
      isInRange(endTimeStr, range.start, range.end)
    );

    if (startInEarlyLate && endInEarlyLate) {
      return { timeBand: "EARLY_LATE", ruleVersion: activeRule.version };
    }
    if (startInEarlyLate || endInEarlyLate) {
      return { timeBand: "CROSSES_BANDS", ruleVersion: activeRule.version };
    }
  }

  // どの時間帯にも該当しない場合は DAYTIME とみなす
  return { timeBand: "DAYTIME", ruleVersion: activeRule.version };
}

const createGuideRecordSchema = z.object({
  recipientId: z.string(),
  startedAt: z.date(),
  endedAt: z.date().optional(),
  destination: z.string().optional(),
  purpose: z.string().optional(),

  // 集合・解散情報
  assemblyLocation: z.string().optional(),
  dismissalLocation: z.string().optional(),

  // 経路情報
  route: z.array(z.string()).optional(),

  transport: z.array(z.string()).default([]),
  supportContent: z.string().optional(),
  userCondition: z.string().optional(),

  // 金銭管理
  cashHandled: z.boolean().default(false),
  handedAmount: z.number().int().min(0).optional(),
  returnedAmount: z.number().int().min(0).optional(),
  cashNote: z.string().optional(),

  // 金銭詳細内訳
  transportExpenses: z.array(z.object({
    amount: z.number().int().min(0),
    description: z.string().optional(),
  })).optional(),
  foodExpenses: z.array(z.object({
    amount: z.number().int().min(0),
    description: z.string().optional(),
  })).optional(),
  otherExpenses: z.array(z.object({
    amount: z.number().int().min(0),
    description: z.string().optional(),
  })).optional(),
  staffMealExpense: z.number().int().min(0).optional(),

  // 食事情報
  mealContent: z.string().optional(),
  mealAmount: z.enum(["全量", "半量", "食べず"]).optional(),

  // 服薬情報
  medicationTaken: z.boolean().optional(),
  medicationTime: z.string().optional(),

  // 手順書・インシデント
  procedure: z.string().optional(),
  incidents: z.any().optional(),

  notes: z.string().optional(),
});

export const guideRecordRouter = router({
  // ガイド記録一覧
  list: protectedProcedure
    .input(
      z.object({
        recipientId: z.string(),
        limit: z.number().int().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      // ユーザーのroleを取得
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { role: true },
      });

      const whereClause: any = {
        recipientId: input.recipientId,
      };

      // MANAGER: 全記録閲覧可能
      // LEAD/STAFF: 提出済み(SUBMITTED)の記録は全利用者閲覧可能、DRAFT記録は同一ユニット内のみ閲覧可能
      if (currentUser?.role !== "MANAGER") {
        // 自分が所属するユニットのスタッフID一覧を取得
        const userUnits = await ctx.db.unitStaff.findMany({
          where: { userId: ctx.session.user.id },
          select: { unitId: true },
        });

        const unitIds = userUnits.map((us: { unitId: string }) => us.unitId);

        // 同一ユニットのスタッフID一覧を取得
        const sameUnitStaffs = await ctx.db.unitStaff.findMany({
          where: { unitId: { in: unitIds } },
          select: { userId: true },
        });

        const allowedUserIds = sameUnitStaffs.map((us: { userId: string }) => us.userId);

        // 提出済み記録は全利用者閲覧可能、DRAFT記録は同一ユニット内のみ
        whereClause.OR = [
          { status: "SUBMITTED" }, // 提出済みは誰でも閲覧可能
          { userId: { in: allowedUserIds } }, // DRAFT記録は同一ユニット内のみ
        ];
      }

      return ctx.db.guideRecord.findMany({
        where: whereClause,
        include: {
          user: { select: { name: true } },
        },
        orderBy: { startedAt: "desc" },
        take: input.limit,
      });
    }),

  // ガイド記録詳細
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // ユーザーのroleを取得
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { role: true },
      });

      const whereClause: any = { id: input.id };

      // MANAGER: 全記録閲覧可能
      // LEAD/STAFF: 提出済み(SUBMITTED)の記録は全利用者閲覧可能、DRAFT記録は同一ユニット内のみ閲覧可能
      if (currentUser?.role !== "MANAGER") {
        // 自分が所属するユニットのスタッフID一覧を取得
        const userUnits = await ctx.db.unitStaff.findMany({
          where: { userId: ctx.session.user.id },
          select: { unitId: true },
        });

        const unitIds = userUnits.map((us: { unitId: string }) => us.unitId);

        // 同一ユニットのスタッフID一覧を取得
        const sameUnitStaffs = await ctx.db.unitStaff.findMany({
          where: { unitId: { in: unitIds } },
          select: { userId: true },
        });

        const allowedUserIds = sameUnitStaffs.map((us: { userId: string }) => us.userId);

        // 提出済み記録は全利用者閲覧可能、DRAFT記録は同一ユニット内のみ
        whereClause.OR = [
          { status: "SUBMITTED" }, // 提出済みは誰でも閲覧可能
          { userId: { in: allowedUserIds } }, // DRAFT記録は同一ユニット内のみ
        ];
      }

      const record = await ctx.db.guideRecord.findFirst({
        where: whereClause,
        include: {
          user: { select: { name: true } },
          recipient: { select: { name: true, createdBy: true } },
        },
      });
      if (!record) throw new Error("記録が見つかりません");
      return record;
    }),

  // ガイド記録作成
  create: protectedProcedure
    .input(createGuideRecordSchema)
    .mutation(async ({ ctx, input }) => {
      // ユーザーのroleを取得
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { role: true },
      });

      // 利用者の権限確認
      const recipient = await ctx.db.careRecipient.findFirst({
        where: {
          id: input.recipientId,
          deletedAt: null,
        },
      });
      if (!recipient) throw new Error("利用者が見つかりません");

      // STAFF: 自分が作成した利用者、またはcreatedByがnullの利用者のみ記録作成可能
      // LEAD/MANAGER: 全利用者の記録作成可能
      if (
        currentUser?.role === "STAFF" &&
        recipient.createdBy !== null &&
        recipient.createdBy !== ctx.session.user.id
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "この利用者の記録を作成する権限がありません",
        });
      }

      return ctx.db.guideRecord.create({
        data: {
          ...input,
          userId: ctx.session.user.id,
        },
      });
    }),

  // ガイド記録更新
  update: protectedProcedure
    .input(createGuideRecordSchema.partial().extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // ユーザーのroleを取得
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { role: true },
      });

      const whereClause: any = { id };

      // MANAGER: 全記録編集可能
      // LEAD: 同一ユニット内の記録のみ編集可能
      // STAFF: DRAFT記録は全利用者編集可能、SUBMITTED記録は編集不可
      if (currentUser?.role === "STAFF") {
        // 記録を取得し、ステータスをチェック
        const record = await ctx.db.guideRecord.findFirst({
          where: { id },
          include: { recipient: { select: { createdBy: true } } },
        });

        if (!record) throw new Error("記録が見つかりません");

        // 下書き（DRAFT）の場合は誰でも編集可能
        if (record.status === "DRAFT") {
          // createdBy が null または自分が作成した利用者の場合のみ編集可能
          if (
            record.recipient.createdBy !== null &&
            record.recipient.createdBy !== ctx.session.user.id
          ) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "この利用者の記録を編集する権限がありません",
            });
          }
          // DRAFT記録は作成者に関係なく編集可能なので、whereClauseにuserIdを追加しない
        } else if (record.status === "SUBMITTED") {
          // 提出済み記録は編集不可
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "提出済みの記録は編集できません",
          });
        }
      } else if (currentUser?.role === "LEAD") {
        // 自分が所属するユニットのスタッフID一覧を取得
        const userUnits = await ctx.db.unitStaff.findMany({
          where: { userId: ctx.session.user.id },
          select: { unitId: true },
        });

        const unitIds = userUnits.map((us: { unitId: string }) => us.unitId);

        // 同一ユニットのスタッフID一覧を取得
        const sameUnitStaffs = await ctx.db.unitStaff.findMany({
          where: { unitId: { in: unitIds } },
          select: { userId: true },
        });

        const allowedUserIds = sameUnitStaffs.map((us: { userId: string }) => us.userId);

        // 同一ユニット内のスタッフの記録のみに制限
        whereClause.userId = { in: allowedUserIds };
      }

      const existing = await ctx.db.guideRecord.findFirst({
        where: whereClause,
      });
      if (!existing) throw new Error("記録が見つかりません");

      // LEAD/MANAGER: 提出済み記録も編集可能（監査ログで追跡）
      // STAFF: DRAFT記録のみ編集可能（提出済みは編集不可）

      // 更新実行
      const updated = await ctx.db.guideRecord.update({ where: { id }, data });

      // 利用者情報を取得
      const recipient = await ctx.db.careRecipient.findUnique({
        where: { id: existing.recipientId },
        select: { name: true },
      });

      // 監査ログに記録
      await ctx.db.auditLog.create({
        data: {
          userId: ctx.session.user.id,
          action: "Edit",
          resourceType: "GuideRecord",
          resourceId: id,
          path: `/recipients/${existing.recipientId}/guide/${id}/edit`,
          metadata: {
            recipientId: existing.recipientId,
            recipientName: recipient?.name,
            beforeStatus: existing.status,
            afterStatus: updated.status,
          },
        },
      });

      return updated;
    }),

  // ガイド記録削除
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // ユーザーのroleを取得
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { role: true },
      });

      const whereClause: any = { id: input.id };

      // MANAGER: 全記録削除可能
      // LEAD: 同一ユニット内の記録のみ削除可能
      // STAFF: DRAFT記録は全利用者削除可能、SUBMITTED記録は削除不可
      if (currentUser?.role === "STAFF") {
        // 記録を取得し、ステータスをチェック
        const record = await ctx.db.guideRecord.findFirst({
          where: { id: input.id },
          include: { recipient: { select: { createdBy: true } } },
        });

        if (!record) throw new Error("記録が見つかりません");

        // 下書き（DRAFT）の場合は誰でも削除可能
        if (record.status === "DRAFT") {
          // createdBy が null または自分が作成した利用者の場合のみ削除可能
          if (
            record.recipient.createdBy !== null &&
            record.recipient.createdBy !== ctx.session.user.id
          ) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "この利用者の記録を削除する権限がありません",
            });
          }
          // DRAFT記録は作成者に関係なく削除可能なので、whereClauseにuserIdを追加しない
        } else if (record.status === "SUBMITTED") {
          // 提出済み記録は削除不可
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "提出済みの記録は削除できません",
          });
        }
      } else if (currentUser?.role === "LEAD") {
        // 自分が所属するユニットのスタッフID一覧を取得
        const userUnits = await ctx.db.unitStaff.findMany({
          where: { userId: ctx.session.user.id },
          select: { unitId: true },
        });

        const unitIds = userUnits.map((us: { unitId: string }) => us.unitId);

        // 同一ユニットのスタッフID一覧を取得
        const sameUnitStaffs = await ctx.db.unitStaff.findMany({
          where: { unitId: { in: unitIds } },
          select: { userId: true },
        });

        const allowedUserIds = sameUnitStaffs.map((us: { userId: string }) => us.userId);

        // 同一ユニット内のスタッフの記録のみに制限
        whereClause.userId = { in: allowedUserIds };
      }

      const existing = await ctx.db.guideRecord.findFirst({
        where: whereClause,
        include: { recipient: { select: { name: true } } },
      });
      if (!existing) throw new Error("記録が見つかりません");

      // 監査ログに記録（削除前に記録）
      await ctx.db.auditLog.create({
        data: {
          userId: ctx.session.user.id,
          action: "Delete",
          resourceType: "GuideRecord",
          resourceId: input.id,
          path: `/recipients/${existing.recipientId}/guide/${input.id}`,
          metadata: {
            recipientId: existing.recipientId,
            recipientName: existing.recipient.name,
            status: existing.status,
          },
        },
      });

      return ctx.db.guideRecord.delete({ where: { id: input.id } });
    }),

  // ガイド記録提出（DRAFT → SUBMITTED への遷移 + ServiceRecord 自動生成）
  submit: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // ユーザーのroleを取得
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { role: true },
      });

      const whereClause: any = { id: input.id };

      // MANAGER: 全記録提出可能
      // LEAD: 同一ユニット内の記録のみ提出可能
      // STAFF: 自分が作成した利用者の記録、またはcreatedByがnullの利用者の記録のみ提出可能
      if (currentUser?.role === "STAFF") {
        // 記録を取得し、利用者の作成者をチェック
        const staffRecord = await ctx.db.guideRecord.findFirst({
          where: { id: input.id },
          include: { recipient: { select: { createdBy: true } } },
        });

        if (!staffRecord) throw new Error("記録が見つかりません");

        // createdBy が null でなく、かつ自分が作成者でない場合はエラー
        if (
          staffRecord.recipient.createdBy !== null &&
          staffRecord.recipient.createdBy !== ctx.session.user.id
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "この利用者の記録を提出する権限がありません",
          });
        }

        // STAFF は自分の記録のみ提出可能（この制約は残す）
        whereClause.userId = ctx.session.user.id;
      } else if (currentUser?.role === "LEAD") {
        // 自分が所属するユニットのスタッフID一覧を取得
        const userUnits = await ctx.db.unitStaff.findMany({
          where: { userId: ctx.session.user.id },
          select: { unitId: true },
        });

        const unitIds = userUnits.map((us: { unitId: string }) => us.unitId);

        // 同一ユニットのスタッフID一覧を取得
        const sameUnitStaffs = await ctx.db.unitStaff.findMany({
          where: { unitId: { in: unitIds } },
          select: { userId: true },
        });

        const allowedUserIds = sameUnitStaffs.map((us: { userId: string }) => us.userId);

        // 同一ユニット内のスタッフの記録のみに制限
        whereClause.userId = { in: allowedUserIds };
      }

      const record = await ctx.db.guideRecord.findFirst({
        where: whereClause,
        include: { recipient: { select: { name: true } } },
      });
      if (!record) throw new Error("記録が見つかりません");

      if (record.status !== "DRAFT") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "提出できるのはDRAFT状態の記録のみです",
        });
      }

      if (!record.endedAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "終了日時が入力されていません",
        });
      }

      const now = new Date();
      const durationMinutes = Math.round(
        (record.endedAt.getTime() - record.startedAt.getTime()) / (1000 * 60)
      );

      // TimeBand を計算
      const { timeBand, ruleVersion } = await calculateTimeBand(
        ctx.db,
        record.startedAt,
        record.endedAt
      );

      // 1. GuideRecord を SUBMITTED に更新
      const updatedGuideRecord = await ctx.db.guideRecord.update({
        where: { id: input.id },
        data: {
          status: "SUBMITTED",
          submittedAt: now,
          submittedBy: ctx.session.user.id,
        },
      });

      // 監査ログに記録
      await ctx.db.auditLog.create({
        data: {
          userId: ctx.session.user.id,
          action: "Submit",
          resourceType: "GuideRecord",
          resourceId: input.id,
          path: `/recipients/${record.recipientId}/guide/${input.id}`,
          metadata: {
            recipientId: record.recipientId,
            recipientName: record.recipient.name,
            beforeStatus: "DRAFT",
            afterStatus: "SUBMITTED",
          },
        },
      });

      // 2. ServiceRecord を upsert（guideRecordId で一意）
      await ctx.db.serviceRecord.upsert({
        where: { guideRecordId: input.id },
        create: {
          recipientId: record.recipientId,
          userId: record.userId,
          serviceType: "BehaviorSupport", // NOTE: ガイド記録は行動援護として記録
          serviceDate: record.startedAt,
          startTime: record.startedAt,
          endTime: record.endedAt,
          duration: durationMinutes,
          destination: record.destination,
          purpose: record.purpose,
          serviceDetail: record.supportContent || "",
          userCondition: record.userCondition,
          incidents: record.notes,
          timeBand: timeBand,
          appliedRuleVersion: ruleVersion,
          guideRecordId: input.id,
        },
        update: {
          serviceDate: record.startedAt,
          startTime: record.startedAt,
          endTime: record.endedAt,
          duration: durationMinutes,
          destination: record.destination,
          purpose: record.purpose,
          serviceDetail: record.supportContent || "",
          userCondition: record.userCondition,
          incidents: record.notes,
          timeBand: timeBand,
          appliedRuleVersion: ruleVersion,
        },
      });

      return updatedGuideRecord;
    }),

  // ガイド記録閲覧済みマーク（LEAD/MANAGER が記録を確認したことを示す）
  review: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // 権限チェック：LEAD または MANAGER のみ閲覧済みマーク可能
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { role: true },
      });

      if (!currentUser || (currentUser.role !== "LEAD" && currentUser.role !== "MANAGER")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "閲覧済みマークにはリーダー以上の権限が必要です。",
        });
      }

      const record = await ctx.db.guideRecord.findFirst({
        where: { id: input.id },
      });
      if (!record) throw new Error("記録が見つかりません");

      const now = new Date();

      // reviewedAt/reviewedBy を更新（statusは変更しない）
      return ctx.db.guideRecord.update({
        where: { id: input.id },
        data: {
          reviewedAt: now,
          reviewedBy: ctx.session.user.id,
        },
      });
    }),
});
