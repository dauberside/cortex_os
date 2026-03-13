import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

/**
 * Phase 5: Monthly Closing Router
 *
 * MVP1 Implementation:
 * - MANAGER can close monthly attendance records
 * - Closing locks all modifications for that month
 * - Reopen function for exceptional cases
 * - Monthly summary calculation
 * - CSV export for payroll processing
 */

/**
 * Helper: Check if a month is closed
 */
export async function isMonthClosed(
  ctx: any,
  yearMonth: string,
  unitId?: string
): Promise<boolean> {
  const closing = await ctx.db.monthlyClosing.findUnique({
    where: {
      yearMonth_unitId: {
        yearMonth,
        unitId: unitId || null,
      },
    },
  });

  // If closing exists and not reopened, it's closed
  return closing !== null && closing.reopenedAt === null;
}

/**
 * Helper: Throw error if month is closed
 */
export async function assertMonthNotClosed(
  ctx: any,
  date: Date,
  unitId?: string
): Promise<void> {
  const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  const closed = await isMonthClosed(ctx, yearMonth, unitId);

  if (closed) {
    throw new Error(
      `${yearMonth}は既に締め処理済みです。修正するには差戻しが必要です。`
    );
  }
}

/**
 * Helper: Calculate monthly summary
 */
async function calculateMonthlySummary(
  ctx: any,
  yearMonth: string,
  unitId?: string
) {
  const [year, month] = yearMonth.split("-").map(Number);
  const startDate = new Date(year, month - 1, 1);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(year, month, 0);
  endDate.setHours(23, 59, 59, 999);

  // Get target staff
  let targetStaffIds: string[] = [];
  if (unitId) {
    const unitStaffs = await ctx.db.unitStaff.findMany({
      where: { unitId },
      select: { userId: true },
      distinct: ["userId"],
    });
    targetStaffIds = unitStaffs.map((us) => us.userId);
  } else {
    const allUnitStaffs = await ctx.db.unitStaff.findMany({
      select: { userId: true },
      distinct: ["userId"],
    });
    targetStaffIds = allUnitStaffs.map((us) => us.userId);
  }

  // Get all attendance records for the month
  const records = await ctx.db.attendanceRecord.findMany({
    where: {
      staffId: { in: targetStaffIds },
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      staff: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  // Calculate totals
  const summary = {
    totalStaff: new Set(records.map((r) => r.staffId)).size,
    totalRecords: records.length,
    totalWorkMinutes: records.reduce((sum, r) => sum + r.workMinutes, 0),
    totalBreakMinutes: records.reduce((sum, r) => sum + r.breakMinutes, 0),
    totalOvertimeMinutes: records.reduce((sum, r) => sum + r.overtimeMinutes, 0),
    totalMidnightMinutes: records.reduce((sum, r) => sum + r.midnightMinutes, 0),
    totalHolidayMinutes: records.reduce((sum, r) => sum + r.holidayMinutes, 0),
    totalWarnings: records.filter((r) => r.notes).length,
    staffSummaries: Object.values(
      records.reduce((acc: any, record) => {
        const staffId = record.staffId;
        if (!acc[staffId]) {
          acc[staffId] = {
            staffId,
            staffName: record.staff?.name || record.staff?.email || "不明",
            daysWorked: 0,
            workMinutes: 0,
            breakMinutes: 0,
            overtimeMinutes: 0,
            midnightMinutes: 0,
            holidayMinutes: 0,
            warnings: 0,
          };
        }
        if (record.workMinutes > 0) acc[staffId].daysWorked++;
        acc[staffId].workMinutes += record.workMinutes;
        acc[staffId].breakMinutes += record.breakMinutes;
        acc[staffId].overtimeMinutes += record.overtimeMinutes;
        acc[staffId].midnightMinutes += record.midnightMinutes;
        acc[staffId].holidayMinutes += record.holidayMinutes;
        if (record.notes) acc[staffId].warnings++;
        return acc;
      }, {})
    ),
  };

  return summary;
}

export const monthlyClosingRouter = router({
  /**
   * Close monthly attendance (MANAGER only)
   */
  close: protectedProcedure
    .input(
      z.object({
        yearMonth: z.string().regex(/^\d{4}-\d{2}$/, "YYYY-MM形式で入力してください"),
        unitId: z.string().optional(),
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

      // Only MANAGER can close
      if (currentUser.role !== "MANAGER") {
        throw new Error("月次締め処理はMANAGER権限が必要です");
      }

      // Check if already closed
      const existingClosing = await ctx.db.monthlyClosing.findUnique({
        where: {
          yearMonth_unitId: {
            yearMonth: input.yearMonth,
            unitId: input.unitId || null,
          },
        },
      });

      if (existingClosing && existingClosing.reopenedAt === null) {
        throw new Error("この月は既に締め処理済みです");
      }

      // Calculate summary
      const summary = await calculateMonthlySummary(
        ctx,
        input.yearMonth,
        input.unitId
      );

      // Check for warnings
      if (summary.totalWarnings > 0) {
        // Allow closing but warn user
        // In production, you might want to require confirmation
      }

      // Create or update closing record
      if (existingClosing) {
        // Reclose (after reopen)
        return await ctx.db.monthlyClosing.update({
          where: { id: existingClosing.id },
          data: {
            closedAt: new Date(),
            closedBy: ctx.session.user.id,
            reopenedAt: null,
            reopenedBy: null,
            reopenReason: null,
            summary,
          },
        });
      } else {
        // First time closing
        return await ctx.db.monthlyClosing.create({
          data: {
            yearMonth: input.yearMonth,
            unitId: input.unitId || null,
            closedAt: new Date(),
            closedBy: ctx.session.user.id,
            summary,
          },
          include: {
            closer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });
      }
    }),

  /**
   * Reopen closed month (MANAGER only)
   */
  reopen: protectedProcedure
    .input(
      z.object({
        closingId: z.string(),
        reason: z.string().min(1, "差戻し理由を入力してください"),
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

      // Only MANAGER can reopen
      if (currentUser.role !== "MANAGER") {
        throw new Error("差戻し処理はMANAGER権限が必要です");
      }

      const closing = await ctx.db.monthlyClosing.findUnique({
        where: { id: input.closingId },
      });

      if (!closing) {
        throw new Error("締め処理が見つかりません");
      }

      if (closing.reopenedAt !== null) {
        throw new Error("この月は既に差戻し済みです");
      }

      return await ctx.db.monthlyClosing.update({
        where: { id: input.closingId },
        data: {
          reopenedAt: new Date(),
          reopenedBy: ctx.session.user.id,
          reopenReason: input.reason,
        },
        include: {
          closer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          reopener: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    }),

  /**
   * Get closing status for a month
   */
  getStatus: protectedProcedure
    .input(
      z.object({
        yearMonth: z.string().regex(/^\d{4}-\d{2}$/),
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

      // STAFF cannot access
      if (currentUser.role === "STAFF") {
        throw new Error("締め状態を確認する権限がありません");
      }

      const closing = await ctx.db.monthlyClosing.findUnique({
        where: {
          yearMonth_unitId: {
            yearMonth: input.yearMonth,
            unitId: input.unitId || null,
          },
        },
        include: {
          closer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          reopener: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          unit: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return {
        isClosed: closing !== null && closing.reopenedAt === null,
        closing,
      };
    }),

  /**
   * List closing history
   */
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(12),
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

      // STAFF cannot access
      if (currentUser.role === "STAFF") {
        throw new Error("締め履歴を確認する権限がありません");
      }

      const whereClause: any = {};
      if (input.unitId) {
        whereClause.unitId = input.unitId;
      }

      return await ctx.db.monthlyClosing.findMany({
        where: whereClause,
        include: {
          closer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          reopener: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          unit: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          yearMonth: "desc",
        },
        take: input.limit,
      });
    }),

  /**
   * Get monthly summary (for preview before closing)
   */
  getSummary: protectedProcedure
    .input(
      z.object({
        yearMonth: z.string().regex(/^\d{4}-\d{2}$/),
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

      // STAFF cannot access
      if (currentUser.role === "STAFF") {
        throw new Error("月次集計を確認する権限がありません");
      }

      return await calculateMonthlySummary(ctx, input.yearMonth, input.unitId);
    }),

  /**
   * Export CSV (MANAGER only)
   */
  exportCSV: protectedProcedure
    .input(
      z.object({
        yearMonth: z.string().regex(/^\d{4}-\d{2}$/),
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

      // Only MANAGER can export
      if (currentUser.role !== "MANAGER") {
        throw new Error("CSV出力はMANAGER権限が必要です");
      }

      const [year, month] = input.yearMonth.split("-").map(Number);
      const startDate = new Date(year, month - 1, 1);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(year, month, 0);
      endDate.setHours(23, 59, 59, 999);

      // Get target staff
      let targetStaffIds: string[] = [];
      if (input.unitId) {
        const unitStaffs = await ctx.db.unitStaff.findMany({
          where: { unitId: input.unitId },
          select: { userId: true },
          distinct: ["userId"],
        });
        targetStaffIds = unitStaffs.map((us) => us.userId);
      } else {
        const allUnitStaffs = await ctx.db.unitStaff.findMany({
          select: { userId: true },
          distinct: ["userId"],
        });
        targetStaffIds = allUnitStaffs.map((us) => us.userId);
      }

      // Get all attendance records
      const records = await ctx.db.attendanceRecord.findMany({
        where: {
          staffId: { in: targetStaffIds },
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          staff: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: [{ staffId: "asc" }, { date: "asc" }],
      });

      // Generate CSV header
      const header = [
        "スタッフID",
        "スタッフ名",
        "日付",
        "出勤時刻",
        "退勤時刻",
        "実働時間(分)",
        "休憩時間(分)",
        "残業時間(分)",
        "深夜時間(分)",
        "休日時間(分)",
        "備考",
      ];

      // Generate CSV rows
      const rows = records.map((record) => [
        record.staff?.id || "",
        record.staff?.name || record.staff?.email || "",
        record.date.toISOString().split("T")[0],
        record.clockInAt
          ? new Date(record.clockInAt).toLocaleTimeString("ja-JP", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "",
        record.clockOutAt
          ? new Date(record.clockOutAt).toLocaleTimeString("ja-JP", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "",
        record.workMinutes.toString(),
        record.breakMinutes.toString(),
        record.overtimeMinutes.toString(),
        record.midnightMinutes.toString(),
        record.holidayMinutes.toString(),
        (record.notes || "").replace(/\n/g, " "),
      ]);

      // Convert to CSV string
      const csvContent = [header, ...rows]
        .map((row) => row.map((cell) => `"${cell}"`).join(","))
        .join("\n");

      return {
        csvContent,
        filename: `attendance_${input.yearMonth}${input.unitId ? `_${input.unitId}` : ""}.csv`,
      };
    }),
});
