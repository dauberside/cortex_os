import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { ClockEventType } from "@prisma/client";
import { assertMonthNotClosed } from "./monthlyClosing";

export const timeClockRouter = router({
  /**
   * Get today's clock status for current user
   * STAFF: Own status only
   *
   * 夜勤対応: 前日午後から今日朝にかけての勤務も考慮
   * 実運用: 夜勤は「15:30入り / 翌9:30明け」が基本
   */
  getTodayStatus: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 前日15:30から今日23:59までの打刻を取得（夜勤考慮）
    // 夜勤基本: 15:30入り / 翌9:30明け
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(15, 30, 0, 0);

    const events = await ctx.db.timeClockEvent.findMany({
      where: {
        staffId: ctx.session.user.id,
        occurredAt: {
          gte: yesterday,
          lt: tomorrow,
        },
      },
      orderBy: {
        occurredAt: "asc",
      },
    });

    // 今日0:00以降の打刻のみを「今日の打刻履歴」として表示
    const todayEvents = events.filter((e) => e.occurredAt >= today);

    // 全イベントから最新のCLOCK_INとCLOCK_OUTを探す
    const clockInEvents = events.filter((e) => e.type === "CLOCK_IN");
    const clockOutEvents = events.filter((e) => e.type === "CLOCK_OUT");

    const latestClockIn = clockInEvents[clockInEvents.length - 1];
    const latestClockOut = clockOutEvents[clockOutEvents.length - 1];

    // 状態判定: 最新のイベントがCLOCK_INなら勤務中
    let status: "NOT_CLOCKED_IN" | "CLOCKED_IN" | "CLOCKED_OUT" =
      "NOT_CLOCKED_IN";

    if (latestClockIn && !latestClockOut) {
      status = "CLOCKED_IN";
    } else if (latestClockIn && latestClockOut) {
      // 最新の打刻がCLOCK_INなら勤務中、CLOCK_OUTなら退勤済み
      if (latestClockIn.occurredAt > latestClockOut.occurredAt) {
        status = "CLOCKED_IN";
      } else {
        status = "CLOCKED_OUT";
      }
    }

    return {
      status,
      latestClockIn,
      latestClockOut,
      events: todayEvents, // 今日分のみ返す
    };
  }),

  /**
   * Clock in (出勤打刻)
   * STAFF: Own clock-in only
   *
   * 夜勤対応: 前日からの継続勤務も考慮して二重打刻を防止
   * 実運用: 夜勤は「15:30入り / 翌9:30明け」が基本
   */
  clockIn: protectedProcedure
    .input(
      z.object({
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        accuracy: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 前日15:30から現在までの打刻を確認（夜勤考慮）
      // 夜勤基本: 15:30入り / 翌9:30明け
      const now = new Date();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(15, 30, 0, 0);

      const recentEvents = await ctx.db.timeClockEvent.findMany({
        where: {
          staffId: ctx.session.user.id,
          occurredAt: {
            gte: yesterday,
            lte: now,
          },
          type: {
            in: ["CLOCK_IN", "CLOCK_OUT"],
          },
        },
        orderBy: {
          occurredAt: "desc",
        },
      });

      // 最新のイベントを確認
      const latestEvent = recentEvents[0];

      // 最新イベントがCLOCK_INの場合、既に勤務中なので二重打刻不可
      if (latestEvent && latestEvent.type === "CLOCK_IN") {
        throw new Error("既に出勤打刻済みです");
      }

      // Get device info from request (if available)
      // Note: In a real implementation, you'd extract this from ctx.req
      const device = "web"; // mobile/tablet/web
      const ipAddress = ""; // Extract from req
      const userAgent = ""; // Extract from req

      return await ctx.db.timeClockEvent.create({
        data: {
          staffId: ctx.session.user.id,
          type: ClockEventType.CLOCK_IN,
          occurredAt: new Date(),
          latitude: input.latitude,
          longitude: input.longitude,
          accuracy: input.accuracy,
          notes: input.notes,
          device,
          ipAddress,
          userAgent,
        },
      });
    }),

  /**
   * Clock out (退勤打刻)
   * STAFF: Own clock-out only
   *
   * 夜勤対応: 前日からの継続勤務を考慮
   * 実運用: 夜勤は「15:30入り / 翌9:30明け」が基本
   */
  clockOut: protectedProcedure
    .input(
      z.object({
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        accuracy: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 前日15:30から現在までの打刻を確認（夜勤考慮）
      // 夜勤基本: 15:30入り / 翌9:30明け
      const now = new Date();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(15, 30, 0, 0);

      const recentEvents = await ctx.db.timeClockEvent.findMany({
        where: {
          staffId: ctx.session.user.id,
          occurredAt: {
            gte: yesterday,
            lte: now,
          },
          type: {
            in: ["CLOCK_IN", "CLOCK_OUT"],
          },
        },
        orderBy: {
          occurredAt: "desc",
        },
      });

      // 最新のイベントを確認
      const latestEvent = recentEvents[0];

      // 最新イベントがCLOCK_OUTまたは存在しない場合、退勤不可
      if (!latestEvent || latestEvent.type === "CLOCK_OUT") {
        throw new Error("出勤打刻が記録されていません");
      }

      const device = "web";
      const ipAddress = "";
      const userAgent = "";

      return await ctx.db.timeClockEvent.create({
        data: {
          staffId: ctx.session.user.id,
          type: ClockEventType.CLOCK_OUT,
          occurredAt: new Date(),
          latitude: input.latitude,
          longitude: input.longitude,
          accuracy: input.accuracy,
          notes: input.notes,
          device,
          ipAddress,
          userAgent,
        },
      });
    }),

  /**
   * Get my clock events (STAFF: own events only)
   */
  getMyEvents: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.db.timeClockEvent.findMany({
        where: {
          staffId: ctx.session.user.id,
          occurredAt: {
            gte: input.startDate,
            lte: input.endDate,
          },
        },
        orderBy: {
          occurredAt: "desc",
        },
      });
    }),

  /**
   * List all clock events (LEAD/MANAGER)
   * LEAD: Same unit staff only
   * MANAGER: All staff
   */
  listEvents: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
        staffId: z.string().optional(),
        unitId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { role: true },
      });

      if (!currentUser) {
        throw new Error("ユーザーが見つかりません");
      }

      const whereClause: any = {
        occurredAt: {
          gte: input.startDate,
          lte: input.endDate,
        },
      };

      // Apply staffId filter if provided
      if (input.staffId) {
        whereClause.staffId = input.staffId;
      }

      // Role-based filtering
      if (currentUser.role === "STAFF") {
        // STAFF can only see their own events
        whereClause.staffId = ctx.session.user.id;
      } else if (currentUser.role === "LEAD") {
        // LEAD can see events in their units only
        const userUnits = await ctx.db.unitStaff.findMany({
          where: { userId: ctx.session.user.id },
          select: { unitId: true },
        });
        const unitIds = userUnits.map((u) => u.unitId);

        if (unitIds.length === 0) {
          return [];
        }

        // Get staff in same units
        const sameUnitStaffs = await ctx.db.unitStaff.findMany({
          where: { unitId: { in: unitIds } },
          select: { userId: true },
        });
        const allowedUserIds = sameUnitStaffs.map((us) => us.userId);

        // If staffId filter is provided, check if it's allowed
        if (input.staffId && !allowedUserIds.includes(input.staffId)) {
          throw new Error("このスタッフの打刻記録を閲覧する権限がありません");
        }

        whereClause.staffId = { in: allowedUserIds };
      }
      // MANAGER: No additional filtering

      return await ctx.db.timeClockEvent.findMany({
        where: whereClause,
        include: {
          staff: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          occurredAt: "desc",
        },
      });
    }),

  /**
   * Modify clock event (LEAD/MANAGER)
   * Used for corrections
   */
  modifyEvent: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        occurredAt: z.date(),
        reason: z.string().min(1, "修正理由は必須です"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { role: true },
      });

      if (!currentUser) {
        throw new Error("ユーザーが見つかりません");
      }

      if (currentUser.role === "STAFF") {
        throw new Error("打刻を修正する権限がありません");
      }

      // Get existing event
      const existing = await ctx.db.timeClockEvent.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new Error("打刻記録が見つかりません");
      }

      // LEAD permission check
      if (currentUser.role === "LEAD") {
        const userUnits = await ctx.db.unitStaff.findMany({
          where: { userId: ctx.session.user.id },
          select: { unitId: true },
        });
        const unitIds = userUnits.map((u) => u.unitId);

        const sameUnitStaffs = await ctx.db.unitStaff.findMany({
          where: { unitId: { in: unitIds } },
          select: { userId: true },
        });
        const allowedUserIds = sameUnitStaffs.map((us) => us.userId);

        if (!allowedUserIds.includes(existing.staffId)) {
          throw new Error("この打刻記録を修正する権限がありません");
        }
      }

      // Check if month is closed
      await assertMonthNotClosed(ctx, input.occurredAt);

      return await ctx.db.timeClockEvent.update({
        where: { id: input.id },
        data: {
          occurredAt: input.occurredAt,
          isModified: true,
          modifiedBy: ctx.session.user.id,
          modifiedAt: new Date(),
          modifiedReason: input.reason,
          originalOccurredAt: existing.occurredAt,
        },
        include: {
          staff: true,
          modifier: true,
        },
      });
    }),

  /**
   * Delete clock event (LEAD/MANAGER)
   */
  deleteEvent: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { role: true },
      });

      if (!currentUser) {
        throw new Error("ユーザーが見つかりません");
      }

      if (currentUser.role === "STAFF") {
        throw new Error("打刻を削除する権限がありません");
      }

      const existing = await ctx.db.timeClockEvent.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new Error("打刻記録が見つかりません");
      }

      // LEAD permission check
      if (currentUser.role === "LEAD") {
        const userUnits = await ctx.db.unitStaff.findMany({
          where: { userId: ctx.session.user.id },
          select: { unitId: true },
        });
        const unitIds = userUnits.map((u) => u.unitId);

        const sameUnitStaffs = await ctx.db.unitStaff.findMany({
          where: { unitId: { in: unitIds } },
          select: { userId: true },
        });
        const allowedUserIds = sameUnitStaffs.map((us) => us.userId);

        if (!allowedUserIds.includes(existing.staffId)) {
          throw new Error("この打刻記録を削除する権限がありません");
        }
      }

      // Check if month is closed
      await assertMonthNotClosed(ctx, existing.occurredAt);

      return await ctx.db.timeClockEvent.delete({
        where: { id: input.id },
      });
    }),
});
