import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

export const dailyLogRouter = router({
  // 業務日誌一覧（ユニット別）
  list: protectedProcedure
    .input(
      z.object({
        unitId: z.string(),
        limit: z.number().min(1).max(100).default(30),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const items = await ctx.db.dailyLog.findMany({
        where: { unitId: input.unitId },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: [{ logDate: "desc" }, { shiftStart: "desc" }],
        include: {
          staff: { select: { id: true, name: true, email: true } },
          _count: { select: { entries: true } },
        },
      });

      let nextCursor: string | undefined;
      if (items.length > input.limit) {
        const next = items.pop();
        nextCursor = next?.id;
      }

      return { items, nextCursor };
    }),

  // 業務日誌詳細
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.dailyLog.findUniqueOrThrow({
        where: { id: input.id },
        include: {
          unit: { select: { id: true, name: true } },
          staff: { select: { id: true, name: true, email: true } },
          entries: {
            include: {
              recipient: {
                select: {
                  id: true,
                  name: true,
                  nameKana: true,
                  medicationSchedules: {
                    where: { isActive: true },
                    orderBy: { timing: "asc" },
                  },
                  assessment: {
                    select: {
                      toiletCareTypes: true,
                      toiletInterval: true,
                      toiletNote: true,
                    },
                  },
                },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      });
    }),

  // 業務日誌作成
  create: protectedProcedure
    .input(
      z.object({
        unitId: z.string(),
        logDate: z.date(),
        shift: z.enum(["Day", "Late", "Night"]),
        shiftStart: z.date(),
        shiftEnd: z.date(),
        staffRole: z.string().optional(),
        residentSummary: z
          .object({
            inHouse: z.number().default(0),
            outing: z.number().default(0),
            overnight: z.number().default(0),
            hospital: z.number().default(0),
            homeLeave: z.number().default(0),
          })
          .optional(),
        majorEvent: z.boolean().default(false),
        handover: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // ユニットの現在の所属利用者を取得
      const unitRecipients = await ctx.db.unitRecipient.findMany({
        where: { unitId: input.unitId, leftAt: null },
        include: { recipient: { select: { id: true, deletedAt: true } } },
      });

      const activeRecipientIds = unitRecipients
        .filter((ur) => !ur.recipient.deletedAt)
        .map((ur) => ur.recipientId);

      // 日誌ヘッダー＋所属利用者全員分のエントリを同時作成
      const dailyLog = await ctx.db.dailyLog.create({
        data: {
          ...input,
          staffId: ctx.session.user.id,
          entries: {
            create: activeRecipientIds.map((recipientId) => ({ recipientId })),
          },
        },
        include: {
          unit: { select: { id: true, name: true } },
          staff: { select: { id: true, name: true } },
        },
      });

      // 監査ログ記録
      await ctx.db.auditLog.create({
        data: {
          userId: ctx.session.user.id,
          action: "Create",
          resourceType: "DailyLog",
          resourceId: dailyLog.id,
          path: `/units/${input.unitId}/log/${dailyLog.id}`,
          metadata: {
            unitId: input.unitId,
            shift: input.shift,
            majorEvent: input.majorEvent,
          },
        },
      });

      return dailyLog;
    }),

  // 業務日誌更新（ヘッダー）
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        shift: z.enum(["Day", "Late", "Night"]).optional(),
        shiftStart: z.date().optional(),
        shiftEnd: z.date().optional(),
        staffRole: z.string().optional(),
        residentSummary: z
          .object({
            inHouse: z.number(),
            outing: z.number(),
            overnight: z.number(),
            hospital: z.number(),
            homeLeave: z.number(),
          })
          .optional(),
        majorEvent: z.boolean().optional(),
        handover: z.string().optional(),
        changeNote: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, changeNote, ...data } = input;

      const dailyLog = await ctx.db.dailyLog.update({ where: { id }, data });

      // 監査ログ記録
      await ctx.db.auditLog.create({
        data: {
          userId: ctx.session.user.id,
          action: "Edit",
          resourceType: "DailyLog",
          resourceId: id,
          path: `/units/${dailyLog.unitId}/log/${id}`,
          changeNote,
          metadata: {
            updatedFields: Object.keys(data),
          },
        },
      });

      return dailyLog;
    }),

  // 業務日誌削除
  delete: protectedProcedure
    .input(z.object({ id: z.string(), changeNote: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const dailyLog = await ctx.db.dailyLog.findUniqueOrThrow({
        where: { id: input.id },
        select: { unitId: true, logDate: true, shift: true },
      });

      await ctx.db.dailyLog.delete({ where: { id: input.id } });

      // 監査ログ記録
      await ctx.db.auditLog.create({
        data: {
          userId: ctx.session.user.id,
          action: "Delete",
          resourceType: "DailyLog",
          resourceId: input.id,
          path: `/units/${dailyLog.unitId}/log`,
          changeNote: input.changeNote,
          metadata: {
            logDate: dailyLog.logDate.toISOString(),
            shift: dailyLog.shift,
          },
        },
      });

      return dailyLog;
    }),

  // 利用者別記録の保存（upsert）
  upsertEntry: protectedProcedure
    .input(
      z.object({
        dailyLogId: z.string(),
        recipientId: z.string(),
        // A. 状態
        temperature: z.number().optional(),
        bloodPressure: z.string().optional(),
        spo2: z.number().int().optional(),
        vitalAlert: z.boolean().optional(),
        sleepTime: z.date().optional(),
        wakeTime: z.date().optional(),
        nightWaking: z.string().optional(),
        behaviorNote: z.string().optional(),
        // B. 生活支援
        mealAmount: z.string().optional(),
        mealTexture: z.string().optional(),
        swallowNote: z.string().optional(),
        waterIntake: z.string().optional(),
        dehydrationRisk: z.boolean().optional(),
        toiletRecords: z.any().optional(),
        bathDone: z.boolean().optional(),
        bathRefusal: z.string().optional(),
        oralCareDone: z.boolean().optional(),
        dressingDone: z.boolean().optional(),
        // C. 服薬
        medicationChecks: z.any().optional(),
        prnMedications: z.any().optional(),
        // D. 外出・外泊
        outingDestination: z.string().optional(),
        outingCompanion: z.string().optional(),
        plannedReturnTime: z.date().optional(),
        returnTime: z.date().optional(),
        returnCondition: z.string().optional(),
        overnightStay: z.boolean().optional(),
        overnightDest: z.string().optional(),
        // E. 拒否記録
        refusalRecords: z.any().optional(),
        // F. 支援タグ
        supportTags: z.array(z.string()).optional(),
        planItemRefs: z.array(z.string()).optional(),
        // G. 特記事項
        notes: z.string().optional(),
        // H. 時間帯別記録
        timeSlotRecords: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { dailyLogId, recipientId, ...data } = input;

      // 既存のエントリがあるかチェック
      const existing = await ctx.db.dailyLogEntry.findUnique({
        where: { dailyLogId_recipientId: { dailyLogId, recipientId } },
      });

      const entry = await ctx.db.dailyLogEntry.upsert({
        where: { dailyLogId_recipientId: { dailyLogId, recipientId } },
        create: { dailyLogId, recipientId, ...data },
        update: data,
      });

      // 監査ログ記録（編集時のみ）
      if (existing) {
        const dailyLog = await ctx.db.dailyLog.findUniqueOrThrow({
          where: { id: dailyLogId },
          select: { unitId: true },
        });

        await ctx.db.auditLog.create({
          data: {
            userId: ctx.session.user.id,
            action: "Edit",
            resourceType: "DailyLog",
            resourceId: dailyLogId,
            path: `/units/${dailyLog.unitId}/log/${dailyLogId}`,
            metadata: {
              recipientId,
              updatedFields: Object.keys(data).filter(
                (k) => data[k as keyof typeof data] !== undefined
              ),
            },
          },
        });
      }

      return entry;
    }),
});
