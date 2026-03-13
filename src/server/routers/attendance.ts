import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { AttendanceStatus } from "@prisma/client";
import { assertMonthNotClosed } from "./monthlyClosing";

/**
 * Calculate midnight minutes (22:00-05:00)
 */
function calculateMidnightMinutes(
  startAt: Date,
  endAt: Date
): number {
  let totalMidnight = 0;
  const current = new Date(startAt);

  while (current < endAt) {
    const currentHour = current.getHours();
    const nextHour = new Date(current);
    nextHour.setHours(currentHour + 1, 0, 0, 0);

    const periodEnd = nextHour > endAt ? endAt : nextHour;
    const minutes = (periodEnd.getTime() - current.getTime()) / (1000 * 60);

    // 22:00-23:59 or 00:00-04:59
    if (currentHour >= 22 || currentHour < 5) {
      totalMidnight += minutes;
    }

    current.setTime(nextHour.getTime());
  }

  return Math.round(totalMidnight);
}

/**
 * Calculate daily attendance from clock events
 *
 * MVP1 Implementation Notes:
 * - Always returns data for upsert (record is created even if clocks are missing)
 * - Missing clocks: clockInAt/clockOutAt = null, workMinutes = 0, warnings in notes
 * - Warnings stored as plain text in notes field (ERROR/WARNING/INFO structure: future work)
 * - Overtime and holiday minutes: not calculated in MVP1
 */
export async function calculateDailyAttendance(
  ctx: any,
  staffId: string,
  date: Date
) {
  // Get date range (today 00:00 - tomorrow 23:59 for night shifts)
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfNextDay = new Date(startOfDay);
  endOfNextDay.setDate(endOfNextDay.getDate() + 2);

  // Get clock events for this day
  const events = await ctx.db.timeClockEvent.findMany({
    where: {
      staffId,
      occurredAt: {
        gte: startOfDay,
        lt: endOfNextDay,
      },
      type: {
        in: ["CLOCK_IN", "CLOCK_OUT"],
      },
    },
    orderBy: {
      occurredAt: "asc",
    },
  });

  // Get shifts for this day
  const shifts = await ctx.db.shift.findMany({
    where: {
      staffId,
      date: {
        gte: startOfDay,
        lt: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000),
      },
    },
    include: {
      shiftType: true,
    },
  });

  // Find first CLOCK_IN and last CLOCK_OUT
  const clockInEvents = events.filter((e) => e.type === "CLOCK_IN");
  const clockOutEvents = events.filter((e) => e.type === "CLOCK_OUT");

  const firstClockIn = clockInEvents[0];
  const lastClockOut = clockOutEvents[clockOutEvents.length - 1];

  // Calculate break minutes from shifts
  const totalBreakMinutes = shifts.reduce(
    (sum, shift) => sum + shift.breakMinutes,
    0
  );

  // Calculate work minutes
  let workMinutes = 0;
  let midnightMinutes = 0;
  let warnings: string[] = [];

  if (firstClockIn && lastClockOut) {
    const totalMinutes =
      (lastClockOut.occurredAt.getTime() - firstClockIn.occurredAt.getTime()) /
      (1000 * 60);
    workMinutes = Math.round(totalMinutes - totalBreakMinutes);

    // Calculate midnight minutes
    midnightMinutes = calculateMidnightMinutes(
      firstClockIn.occurredAt,
      lastClockOut.occurredAt
    );

    // Validate against shifts
    if (shifts.length > 0) {
      const expectedStart = new Date(
        Math.min(...shifts.map((s) => s.startAt.getTime()))
      );
      const expectedEnd = new Date(
        Math.max(...shifts.map((s) => s.endAt.getTime()))
      );

      const startDiff = Math.abs(
        (firstClockIn.occurredAt.getTime() - expectedStart.getTime()) /
          (1000 * 60)
      );
      const endDiff = Math.abs(
        (lastClockOut.occurredAt.getTime() - expectedEnd.getTime()) /
          (1000 * 60)
      );

      if (startDiff > 120) {
        warnings.push(
          `出勤時刻がシフトと大きく異なります（差分: ${Math.round(startDiff)}分）`
        );
      }
      if (endDiff > 120) {
        warnings.push(
          `退勤時刻がシフトと大きく異なります（差分: ${Math.round(endDiff)}分）`
        );
      }
    }
  } else {
    // Missing clock events
    if (firstClockIn && !lastClockOut) {
      warnings.push("退勤打刻が記録されていません");
    } else if (!firstClockIn && lastClockOut) {
      warnings.push("出勤打刻が記録されていません");
    } else if (shifts.length > 0) {
      warnings.push("出勤・退勤の打刻がありません");
    }
  }

  return {
    clockInAt: firstClockIn?.occurredAt || null,
    clockOutAt: lastClockOut?.occurredAt || null,
    workMinutes: workMinutes >= 0 ? workMinutes : 0,
    breakMinutes: totalBreakMinutes,
    overtimeMinutes: 0, // MVP1: Not calculated
    midnightMinutes,
    holidayMinutes: 0, // MVP1: Not calculated
    warnings,
  };
}

export const attendanceRouter = router({
  /**
   * Get my attendance records (STAFF)
   */
  getMyRecords: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.db.attendanceRecord.findMany({
        where: {
          staffId: ctx.session.user.id,
          date: {
            gte: input.startDate,
            lte: input.endDate,
          },
        },
        orderBy: {
          date: "desc",
        },
      });
    }),

  /**
   * List attendance records (LEAD/MANAGER only)
   * STAFF should use getMyRecords instead
   */
  list: protectedProcedure
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

      // STAFF cannot use this endpoint
      if (currentUser.role === "STAFF") {
        throw new Error("勤怠実績一覧を取得する権限がありません");
      }

      const whereClause: any = {
        date: {
          gte: input.startDate,
          lte: input.endDate,
        },
      };

      if (input.staffId) {
        whereClause.staffId = input.staffId;
      }

      // Role-based filtering
      if (currentUser.role === "LEAD") {
        const userUnits = await ctx.db.unitStaff.findMany({
          where: { userId: ctx.session.user.id },
          select: { unitId: true },
        });
        const unitIds = userUnits.map((u) => u.unitId);

        if (unitIds.length === 0) {
          return [];
        }

        const sameUnitStaffs = await ctx.db.unitStaff.findMany({
          where: { unitId: { in: unitIds } },
          select: { userId: true },
        });
        const allowedUserIds = sameUnitStaffs.map((us) => us.userId);

        whereClause.staffId = { in: allowedUserIds };
      }

      return await ctx.db.attendanceRecord.findMany({
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
        orderBy: [{ date: "desc" }, { staffId: "asc" }],
      });
    }),

  /**
   * Calculate attendance for a specific day
   * Can be called manually or automatically
   *
   * MVP1 Behavior:
   * - Always creates/updates AttendanceRecord via upsert
   * - Missing clocks: null values stored, warnings saved to notes
   * - notes field: plain text warnings (not structured ERROR/WARNING/INFO)
   */
  calculate: protectedProcedure
    .input(
      z.object({
        staffId: z.string(),
        date: z.date(),
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

      // Permission check
      if (currentUser.role === "STAFF" && input.staffId !== ctx.session.user.id) {
        throw new Error("他のスタッフの勤怠実績を計算する権限がありません");
      }

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

        if (!allowedUserIds.includes(input.staffId)) {
          throw new Error("このスタッフの勤怠実績を計算する権限がありません");
        }
      }

      // Check if month is closed
      await assertMonthNotClosed(ctx, input.date);

      // Calculate attendance
      const calculated = await calculateDailyAttendance(
        ctx,
        input.staffId,
        input.date
      );

      // Upsert attendance record
      const startOfDay = new Date(input.date);
      startOfDay.setHours(0, 0, 0, 0);

      return await ctx.db.attendanceRecord.upsert({
        where: {
          staffId_date: {
            staffId: input.staffId,
            date: startOfDay,
          },
        },
        update: {
          clockInAt: calculated.clockInAt,
          clockOutAt: calculated.clockOutAt,
          workMinutes: calculated.workMinutes,
          breakMinutes: calculated.breakMinutes,
          overtimeMinutes: calculated.overtimeMinutes,
          midnightMinutes: calculated.midnightMinutes,
          holidayMinutes: calculated.holidayMinutes,
          notes: calculated.warnings.join("\n") || null,
        },
        create: {
          staffId: input.staffId,
          date: startOfDay,
          clockInAt: calculated.clockInAt,
          clockOutAt: calculated.clockOutAt,
          workMinutes: calculated.workMinutes,
          breakMinutes: calculated.breakMinutes,
          overtimeMinutes: calculated.overtimeMinutes,
          midnightMinutes: calculated.midnightMinutes,
          holidayMinutes: calculated.holidayMinutes,
          status: AttendanceStatus.OPEN,
          notes: calculated.warnings.join("\n") || null,
        },
        include: {
          staff: true,
        },
      });
    }),

  /**
   * Bulk calculate for a date range
   *
   * MVP1 Target Staff:
   * - Only users assigned to Units (UnitStaff)
   * - LEAD: staff in same units
   * - MANAGER: all staff assigned to any unit
   */
  bulkCalculate: protectedProcedure
    .input(
      z.object({
        staffId: z.string().optional(),
        unitId: z.string().optional(),
        startDate: z.date(),
        endDate: z.date(),
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
        throw new Error("一括計算を実行する権限がありません");
      }

      // Get target staff
      let targetStaffIds: string[] = [];

      if (input.staffId) {
        targetStaffIds = [input.staffId];
      } else if (input.unitId) {
        const unitStaffs = await ctx.db.unitStaff.findMany({
          where: { unitId: input.unitId },
          select: { userId: true },
        });
        targetStaffIds = unitStaffs.map((us) => us.userId);
      } else {
        // All staff in LEAD's units or all staff for MANAGER
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
          targetStaffIds = sameUnitStaffs.map((us) => us.userId);
        } else {
          // MANAGER: Get all staff who are assigned to units (勤怠対象ユーザーのみ)
          const allUnitStaffs = await ctx.db.unitStaff.findMany({
            select: { userId: true },
            distinct: ["userId"],
          });
          targetStaffIds = allUnitStaffs.map((us) => us.userId);
        }
      }

      // Calculate for each staff and each day
      const results: any[] = [];
      const current = new Date(input.startDate);
      while (current <= input.endDate) {
        for (const staffId of targetStaffIds) {
          const calculated = await calculateDailyAttendance(
            ctx,
            staffId,
            new Date(current)
          );

          const startOfDay = new Date(current);
          startOfDay.setHours(0, 0, 0, 0);

          const record = await ctx.db.attendanceRecord.upsert({
            where: {
              staffId_date: {
                staffId,
                date: startOfDay,
              },
            },
            update: {
              clockInAt: calculated.clockInAt,
              clockOutAt: calculated.clockOutAt,
              workMinutes: calculated.workMinutes,
              breakMinutes: calculated.breakMinutes,
              overtimeMinutes: calculated.overtimeMinutes,
              midnightMinutes: calculated.midnightMinutes,
              holidayMinutes: calculated.holidayMinutes,
              notes: calculated.warnings.join("\n") || null,
            },
            create: {
              staffId,
              date: startOfDay,
              clockInAt: calculated.clockInAt,
              clockOutAt: calculated.clockOutAt,
              workMinutes: calculated.workMinutes,
              breakMinutes: calculated.breakMinutes,
              overtimeMinutes: calculated.overtimeMinutes,
              midnightMinutes: calculated.midnightMinutes,
              holidayMinutes: calculated.holidayMinutes,
              status: AttendanceStatus.OPEN,
              notes: calculated.warnings.join("\n") || null,
            },
          });

          results.push(record);
        }
        current.setDate(current.getDate() + 1);
      }

      return { count: results.length };
    }),
});
