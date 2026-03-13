import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { ShiftStatus } from "@prisma/client";
import { assertMonthNotClosed } from "./monthlyClosing";

export const shiftRouter = router({
  /**
   * Get shifts for a specific month
   * STAFF: Own shifts only
   * LEAD: Same unit shifts only
   * MANAGER: All shifts (with optional unit filter)
   */
  list: protectedProcedure
    .input(
      z.object({
        year: z.number().int(),
        month: z.number().int().min(1).max(12),
        unitId: z.string().optional(),
        staffId: z.string().optional(),
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

      // Calculate date range for the month
      const startDate = new Date(input.year, input.month - 1, 1);
      const endDate = new Date(input.year, input.month, 0);

      const whereClause: any = {
        date: {
          gte: startDate,
          lte: endDate,
        },
      };

      // Apply unit filter if provided
      if (input.unitId) {
        whereClause.unitId = input.unitId;
      }

      // Apply staff filter if provided
      if (input.staffId) {
        whereClause.staffId = input.staffId;
      }

      // Role-based filtering
      if (currentUser.role === "STAFF") {
        // STAFF can only see their own shifts
        whereClause.staffId = ctx.session.user.id;
      } else if (currentUser.role === "LEAD") {
        // LEAD can see shifts in their units only
        const userUnits = await ctx.db.unitStaff.findMany({
          where: { userId: ctx.session.user.id },
          select: { unitId: true },
        });
        const unitIds = userUnits.map((u) => u.unitId);

        if (unitIds.length === 0) {
          // LEAD has no assigned units, return empty
          return [];
        }

        // Filter by units
        if (input.unitId) {
          // Check if requested unit is in LEAD's units
          if (!unitIds.includes(input.unitId)) {
            throw new Error("この事業所のシフトを閲覧する権限がありません");
          }
        } else {
          // No specific unit requested, show all LEAD's units
          whereClause.unitId = { in: unitIds };
        }
      }
      // MANAGER: No additional filtering (can see all)

      const shifts = await ctx.db.shift.findMany({
        where: whereClause,
        include: {
          staff: {
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
              serviceType: true,
            },
          },
          shiftType: true,
          publishedByUser: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [{ date: "asc" }, { startAt: "asc" }],
      });

      return shifts;
    }),

  /**
   * Get single shift
   * Permission check included
   */
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const shift = await ctx.db.shift.findUnique({
        where: { id: input.id },
        include: {
          staff: true,
          unit: true,
          shiftType: true,
          publishedByUser: true,
        },
      });

      if (!shift) {
        throw new Error("シフトが見つかりません");
      }

      // Permission check
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { role: true },
      });

      if (!currentUser) {
        throw new Error("ユーザーが見つかりません");
      }

      if (currentUser.role === "STAFF") {
        // STAFF can only see their own shifts
        if (shift.staffId !== ctx.session.user.id) {
          throw new Error("このシフトを閲覧する権限がありません");
        }
      } else if (currentUser.role === "LEAD") {
        // LEAD can see shifts in their units only
        const userUnits = await ctx.db.unitStaff.findMany({
          where: { userId: ctx.session.user.id },
          select: { unitId: true },
        });
        const unitIds = userUnits.map((u) => u.unitId);

        if (!unitIds.includes(shift.unitId)) {
          throw new Error("このシフトを閲覧する権限がありません");
        }
      }
      // MANAGER: Can see all

      return shift;
    }),

  /**
   * Create shift
   * LEAD: Can create shifts in their units
   * MANAGER: Can create any shift
   */
  create: protectedProcedure
    .input(
      z.object({
        staffId: z.string(),
        unitId: z.string(),
        shiftTypeId: z.string(),
        date: z.date(),
        startAt: z.date(),
        endAt: z.date(),
        breakMinutes: z.number().int().min(0).default(0),
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

      // STAFF cannot create shifts
      if (currentUser.role === "STAFF") {
        throw new Error("シフトを作成する権限がありません");
      }

      // LEAD permission check
      if (currentUser.role === "LEAD") {
        const userUnits = await ctx.db.unitStaff.findMany({
          where: { userId: ctx.session.user.id },
          select: { unitId: true },
        });
        const unitIds = userUnits.map((u) => u.unitId);

        if (!unitIds.includes(input.unitId)) {
          throw new Error("この事業所のシフトを作成する権限がありません");
        }
      }

      // Validate shiftType exists
      const shiftType = await ctx.db.shiftType.findUnique({
        where: { id: input.shiftTypeId },
      });

      if (!shiftType || !shiftType.isActive) {
        throw new Error("指定された勤務区分が見つかりません");
      }

      // Validate staff exists and is in the unit
      const staffInUnit = await ctx.db.unitStaff.findFirst({
        where: {
          userId: input.staffId,
          unitId: input.unitId,
        },
      });

      if (!staffInUnit) {
        throw new Error("指定された職員はこの事業所に所属していません");
      }

      // Check if month is closed
      await assertMonthNotClosed(ctx, input.date);

      return await ctx.db.shift.create({
        data: {
          ...input,
          status: ShiftStatus.DRAFT,
          createdBy: ctx.session.user.id,
        },
        include: {
          staff: true,
          unit: true,
          shiftType: true,
        },
      });
    }),

  /**
   * Update shift
   * LEAD: Can update shifts in their units (DRAFT or PUBLISHED)
   * MANAGER: Can update any shift
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        shiftTypeId: z.string().optional(),
        date: z.date().optional(),
        startAt: z.date().optional(),
        endAt: z.date().optional(),
        breakMinutes: z.number().int().min(0).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // Get existing shift
      const existing = await ctx.db.shift.findUnique({
        where: { id },
        include: { unit: true },
      });

      if (!existing) {
        throw new Error("シフトが見つかりません");
      }

      // Permission check
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { role: true },
      });

      if (!currentUser) {
        throw new Error("ユーザーが見つかりません");
      }

      if (currentUser.role === "STAFF") {
        throw new Error("シフトを更新する権限がありません");
      }

      if (currentUser.role === "LEAD") {
        const userUnits = await ctx.db.unitStaff.findMany({
          where: { userId: ctx.session.user.id },
          select: { unitId: true },
        });
        const unitIds = userUnits.map((u) => u.unitId);

        if (!unitIds.includes(existing.unitId)) {
          throw new Error("このシフトを更新する権限がありません");
        }
      }

      // Validate shiftType if provided
      if (data.shiftTypeId) {
        const shiftType = await ctx.db.shiftType.findUnique({
          where: { id: data.shiftTypeId },
        });

        if (!shiftType || !shiftType.isActive) {
          throw new Error("指定された勤務区分が見つかりません");
        }
      }

      // Check if month is closed (use existing date or updated date)
      const targetDate = data.date || existing.date;
      await assertMonthNotClosed(ctx, targetDate);

      return await ctx.db.shift.update({
        where: { id },
        data,
        include: {
          staff: true,
          unit: true,
          shiftType: true,
        },
      });
    }),

  /**
   * Delete shift
   * LEAD: Can delete shifts in their units
   * MANAGER: Can delete any shift
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Get existing shift
      const existing = await ctx.db.shift.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new Error("シフトが見つかりません");
      }

      // Permission check
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { role: true },
      });

      if (!currentUser) {
        throw new Error("ユーザーが見つかりません");
      }

      if (currentUser.role === "STAFF") {
        throw new Error("シフトを削除する権限がありません");
      }

      if (currentUser.role === "LEAD") {
        const userUnits = await ctx.db.unitStaff.findMany({
          where: { userId: ctx.session.user.id },
          select: { unitId: true },
        });
        const unitIds = userUnits.map((u) => u.unitId);

        if (!unitIds.includes(existing.unitId)) {
          throw new Error("このシフトを削除する権限がありません");
        }
      }

      // Check if month is closed
      await assertMonthNotClosed(ctx, existing.date);

      return await ctx.db.shift.delete({
        where: { id: input.id },
      });
    }),

  /**
   * Publish shift (change status to PUBLISHED)
   * LEAD: Can publish shifts in their units
   * MANAGER: Can publish any shift
   */
  publish: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Get existing shift
      const existing = await ctx.db.shift.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new Error("シフトが見つかりません");
      }

      // Permission check
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { role: true },
      });

      if (!currentUser) {
        throw new Error("ユーザーが見つかりません");
      }

      if (currentUser.role === "STAFF") {
        throw new Error("シフトを公開する権限がありません");
      }

      if (currentUser.role === "LEAD") {
        const userUnits = await ctx.db.unitStaff.findMany({
          where: { userId: ctx.session.user.id },
          select: { unitId: true },
        });
        const unitIds = userUnits.map((u) => u.unitId);

        if (!unitIds.includes(existing.unitId)) {
          throw new Error("このシフトを公開する権限がありません");
        }
      }

      // Check if month is closed
      await assertMonthNotClosed(ctx, existing.date);

      return await ctx.db.shift.update({
        where: { id: input.id },
        data: {
          status: ShiftStatus.PUBLISHED,
          publishedAt: new Date(),
          publishedBy: ctx.session.user.id,
        },
        include: {
          staff: true,
          unit: true,
          shiftType: true,
          publishedByUser: true,
        },
      });
    }),

  /**
   * Bulk publish shifts for a month/unit
   * LEAD: Can bulk publish in their units
   * MANAGER: Can bulk publish any
   */
  bulkPublish: protectedProcedure
    .input(
      z.object({
        unitId: z.string(),
        year: z.number().int(),
        month: z.number().int().min(1).max(12),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Permission check
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { role: true },
      });

      if (!currentUser) {
        throw new Error("ユーザーが見つかりません");
      }

      if (currentUser.role === "STAFF") {
        throw new Error("シフトを公開する権限がありません");
      }

      if (currentUser.role === "LEAD") {
        const userUnits = await ctx.db.unitStaff.findMany({
          where: { userId: ctx.session.user.id },
          select: { unitId: true },
        });
        const unitIds = userUnits.map((u) => u.unitId);

        if (!unitIds.includes(input.unitId)) {
          throw new Error("この事業所のシフトを公開する権限がありません");
        }
      }

      // Calculate date range
      const startDate = new Date(input.year, input.month - 1, 1);
      const endDate = new Date(input.year, input.month, 0);

      // Check if month is closed
      await assertMonthNotClosed(ctx, startDate);

      // Update all DRAFT shifts in the unit/month
      const result = await ctx.db.shift.updateMany({
        where: {
          unitId: input.unitId,
          date: {
            gte: startDate,
            lte: endDate,
          },
          status: ShiftStatus.DRAFT,
        },
        data: {
          status: ShiftStatus.PUBLISHED,
          publishedAt: new Date(),
          publishedBy: ctx.session.user.id,
        },
      });

      return { count: result.count };
    }),
});
