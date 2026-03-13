import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { ApprovalRequestType, ApprovalRequestStatus, AttendanceStatus } from "@prisma/client";
import { calculateDailyAttendance } from "./attendance";
import { assertMonthNotClosed } from "./monthlyClosing";

/**
 * Phase 4: Approval Router
 *
 * MVP1 Implementation:
 * - TIME_EDIT: Staff can request time clock corrections
 * - SHIFT_CHANGE: Staff can request shift changes
 * - LEAD/MANAGER can approve/reject requests for their units
 * - Simple single-step approval (no multi-step chain in MVP1)
 * - Auto-recalculates AttendanceRecord after approval
 *
 * Future Enhancement (Phase 5):
 * - Add monthly closing lock check before applying changes
 * - Prevent approval of requests for closed months
 * - Add reopening workflow for exceptional cases
 */

// Input schemas
const timeEditRequestSchema = z.object({
  clockEventId: z.string().optional(), // If editing existing event
  date: z.date(),
  type: z.enum(["CLOCK_IN", "CLOCK_OUT"]),
  before: z.date().nullable().optional(), // Current time (null if missing)
  after: z.date(), // Requested time
  reason: z.string().min(1, "理由を入力してください"),
});

const shiftChangeRequestSchema = z.object({
  shiftId: z.string().optional(), // If editing existing shift
  date: z.date(),
  shiftTypeId: z.string().optional(),
  startAt: z.date().optional(),
  endAt: z.date().optional(),
  breakMinutes: z.number().optional(),
  reason: z.string().min(1, "理由を入力してください"),
});

export const approvalRouter = router({
  /**
   * Submit time edit request (STAFF)
   * Request to correct clock-in/out time
   */
  requestTimeEdit: protectedProcedure
    .input(timeEditRequestSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if month is closed
      await assertMonthNotClosed(ctx, input.date);

      // Create approval request
      return await ctx.db.approvalRequest.create({
        data: {
          type: ApprovalRequestType.TIME_EDIT,
          requesterId: ctx.session.user.id,
          status: ApprovalRequestStatus.PENDING,
          payload: {
            clockEventId: input.clockEventId,
            date: input.date.toISOString(),
            type: input.type,
            before: input.before?.toISOString() || null,
            after: input.after.toISOString(),
            reason: input.reason,
          },
        },
        include: {
          requester: {
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
   * Submit shift change request (STAFF)
   * Request to change shift schedule
   */
  requestShiftChange: protectedProcedure
    .input(shiftChangeRequestSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if month is closed
      await assertMonthNotClosed(ctx, input.date);

      return await ctx.db.approvalRequest.create({
        data: {
          type: ApprovalRequestType.SHIFT_CHANGE,
          requesterId: ctx.session.user.id,
          status: ApprovalRequestStatus.PENDING,
          payload: {
            shiftId: input.shiftId,
            date: input.date.toISOString(),
            shiftTypeId: input.shiftTypeId,
            startAt: input.startAt?.toISOString(),
            endAt: input.endAt?.toISOString(),
            breakMinutes: input.breakMinutes,
            reason: input.reason,
          },
        },
        include: {
          requester: {
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
   * Get my requests (STAFF)
   * View own approval request history
   */
  getMyRequests: protectedProcedure
    .input(
      z.object({
        status: z
          .enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED"])
          .optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const whereClause: any = {
        requesterId: ctx.session.user.id,
      };

      if (input.status) {
        whereClause.status = input.status;
      }

      return await ctx.db.approvalRequest.findMany({
        where: whereClause,
        include: {
          requester: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          approver: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          rejecter: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }),

  /**
   * Get pending requests (LEAD/MANAGER)
   * View requests that need approval
   */
  getPendingRequests: protectedProcedure
    .input(
      z.object({
        type: z.enum(["TIME_EDIT", "SHIFT_CHANGE"]).optional(),
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

      // STAFF cannot access this endpoint
      if (currentUser.role === "STAFF") {
        throw new Error("承認待ち申請を取得する権限がありません");
      }

      const whereClause: any = {
        status: ApprovalRequestStatus.PENDING,
      };

      if (input.type) {
        whereClause.type = input.type;
      }

      // LEAD: Only see requests from staff in same units
      if (currentUser.role === "LEAD") {
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

        whereClause.requesterId = { in: allowedUserIds };
      }

      return await ctx.db.approvalRequest.findMany({
        where: whereClause,
        include: {
          requester: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc", // Oldest first for approval queue
        },
      });
    }),

  /**
   * Approve request (LEAD/MANAGER)
   * Approve and execute the requested change
   */
  approve: protectedProcedure
    .input(
      z.object({
        requestId: z.string(),
        notes: z.string().optional(),
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

      // STAFF cannot approve
      if (currentUser.role === "STAFF") {
        throw new Error("申請を承認する権限がありません");
      }

      // Get request
      const request = await ctx.db.approvalRequest.findUnique({
        where: { id: input.requestId },
        include: {
          requester: true,
        },
      });

      if (!request) {
        throw new Error("申請が見つかりません");
      }

      if (request.status !== ApprovalRequestStatus.PENDING) {
        throw new Error("この申請は既に処理されています");
      }

      // LEAD: Check if requester is in same unit
      if (currentUser.role === "LEAD") {
        const approverUnits = await ctx.db.unitStaff.findMany({
          where: { userId: ctx.session.user.id },
          select: { unitId: true },
        });
        const approverUnitIds = approverUnits.map((u) => u.unitId);

        const requesterUnits = await ctx.db.unitStaff.findMany({
          where: { userId: request.requesterId },
          select: { unitId: true },
        });
        const requesterUnitIds = requesterUnits.map((u) => u.unitId);

        const hasCommonUnit = approverUnitIds.some((id) =>
          requesterUnitIds.includes(id)
        );

        if (!hasCommonUnit) {
          throw new Error("このスタッフの申請を承認する権限がありません");
        }
      }

      // Check if month is closed
      const payload = request.payload as any;
      const targetDate = new Date(payload.date);
      await assertMonthNotClosed(ctx, targetDate);

      // Execute the approval and apply changes

      if (request.type === ApprovalRequestType.TIME_EDIT) {
        // Apply time edit
        const { clockEventId, date, type, after } = payload;

        if (clockEventId) {
          // Update existing clock event
          const originalEvent = await ctx.db.timeClockEvent.findUnique({
            where: { id: clockEventId },
          });

          await ctx.db.timeClockEvent.update({
            where: { id: clockEventId },
            data: {
              originalOccurredAt: originalEvent?.occurredAt,
              occurredAt: new Date(after),
              isModified: true,
              modifiedBy: ctx.session.user.id,
              modifiedAt: new Date(),
              modifiedReason: payload.reason,
            },
          });
        } else {
          // Create new clock event (missing clock correction)
          await ctx.db.timeClockEvent.create({
            data: {
              staffId: request.requesterId,
              type: type,
              occurredAt: new Date(after),
              isModified: true,
              modifiedBy: ctx.session.user.id,
              modifiedAt: new Date(),
              modifiedReason: payload.reason,
            },
          });
        }

        // Recalculate attendance for that day
        const targetDate = new Date(date);
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);

        // Trigger recalculation
        const calculated = await calculateDailyAttendance(
          ctx,
          request.requesterId,
          targetDate
        );

        // Upsert attendance record
        await ctx.db.attendanceRecord.upsert({
          where: {
            staffId_date: {
              staffId: request.requesterId,
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
            staffId: request.requesterId,
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
      } else if (request.type === ApprovalRequestType.SHIFT_CHANGE) {
        // Apply shift change
        const { shiftId, date, shiftTypeId, startAt, endAt, breakMinutes } =
          payload;

        if (shiftId) {
          // Update existing shift
          const updateData: any = {};
          if (shiftTypeId) updateData.shiftTypeId = shiftTypeId;
          if (startAt) updateData.startAt = new Date(startAt);
          if (endAt) updateData.endAt = new Date(endAt);
          if (breakMinutes !== undefined) updateData.breakMinutes = breakMinutes;

          await ctx.db.shift.update({
            where: { id: shiftId },
            data: updateData,
          });
        } else {
          // Create new shift (if adding shift)
          if (!shiftTypeId || !startAt || !endAt) {
            throw new Error("新規シフト作成には必須項目が不足しています");
          }

          await ctx.db.shift.create({
            data: {
              staffId: request.requesterId,
              date: new Date(date),
              shiftTypeId,
              startAt: new Date(startAt),
              endAt: new Date(endAt),
              breakMinutes: breakMinutes || 0,
              isPublished: true,
            },
          });
        }

        // Recalculate attendance for that day (shift affects break minutes)
        const targetDate = new Date(date);
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);

        const calculated = await calculateDailyAttendance(
          ctx,
          request.requesterId,
          targetDate
        );

        await ctx.db.attendanceRecord.upsert({
          where: {
            staffId_date: {
              staffId: request.requesterId,
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
            staffId: request.requesterId,
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
      }

      // Update approval request status
      return await ctx.db.approvalRequest.update({
        where: { id: input.requestId },
        data: {
          status: ApprovalRequestStatus.APPROVED,
          approvedBy: ctx.session.user.id,
          approvedAt: new Date(),
        },
        include: {
          requester: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          approver: {
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
   * Reject request (LEAD/MANAGER)
   */
  reject: protectedProcedure
    .input(
      z.object({
        requestId: z.string(),
        reason: z.string().min(1, "却下理由を入力してください"),
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

      // STAFF cannot reject
      if (currentUser.role === "STAFF") {
        throw new Error("申請を却下する権限がありません");
      }

      // Get request
      const request = await ctx.db.approvalRequest.findUnique({
        where: { id: input.requestId },
      });

      if (!request) {
        throw new Error("申請が見つかりません");
      }

      if (request.status !== ApprovalRequestStatus.PENDING) {
        throw new Error("この申請は既に処理されています");
      }

      // LEAD: Check if requester is in same unit
      if (currentUser.role === "LEAD") {
        const approverUnits = await ctx.db.unitStaff.findMany({
          where: { userId: ctx.session.user.id },
          select: { unitId: true },
        });
        const approverUnitIds = approverUnits.map((u) => u.unitId);

        const requesterUnits = await ctx.db.unitStaff.findMany({
          where: { userId: request.requesterId },
          select: { unitId: true },
        });
        const requesterUnitIds = requesterUnits.map((u) => u.unitId);

        const hasCommonUnit = approverUnitIds.some((id) =>
          requesterUnitIds.includes(id)
        );

        if (!hasCommonUnit) {
          throw new Error("このスタッフの申請を却下する権限がありません");
        }
      }

      // Update approval request status
      return await ctx.db.approvalRequest.update({
        where: { id: input.requestId },
        data: {
          status: ApprovalRequestStatus.REJECTED,
          rejectedBy: ctx.session.user.id,
          rejectedAt: new Date(),
          rejectReason: input.reason,
        },
        include: {
          requester: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          rejecter: {
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
   * Cancel own request (STAFF)
   */
  cancel: protectedProcedure
    .input(
      z.object({
        requestId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const request = await ctx.db.approvalRequest.findUnique({
        where: { id: input.requestId },
      });

      if (!request) {
        throw new Error("申請が見つかりません");
      }

      // Only requester can cancel
      if (request.requesterId !== ctx.session.user.id) {
        throw new Error("他のユーザーの申請を取り下げることはできません");
      }

      // Can only cancel pending requests
      if (request.status !== ApprovalRequestStatus.PENDING) {
        throw new Error("承認済み・却下済みの申請は取り下げできません");
      }

      return await ctx.db.approvalRequest.update({
        where: { id: input.requestId },
        data: {
          status: ApprovalRequestStatus.CANCELLED,
        },
      });
    }),
});
