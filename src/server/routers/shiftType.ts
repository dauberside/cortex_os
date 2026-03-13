import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

export const shiftTypeRouter = router({
  /**
   * Get all shift types (including inactive)
   * STAFF/LEAD/MANAGER: All can view
   */
  list: protectedProcedure
    .input(
      z
        .object({
          includeInactive: z.boolean().default(false),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const whereClause: any = {};

      if (!input?.includeInactive) {
        whereClause.isActive = true;
      }

      return await ctx.db.shiftType.findMany({
        where: whereClause,
        orderBy: { createdAt: "asc" },
      });
    }),

  /**
   * Get single shift type
   * STAFF/LEAD/MANAGER: All can view
   */
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.shiftType.findUnique({
        where: { id: input.id },
      });
    }),

  /**
   * Create shift type
   * MANAGER only
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "名前は必須です"),
        code: z.string().min(1, "コードは必須です"),
        description: z.string().optional(),
        startTime: z.string().regex(/^\d{2}:\d{2}$/, "HH:MM形式で入力してください"),
        endTime: z.string().regex(/^\d{2}:\d{2}$/, "HH:MM形式で入力してください"),
        breakMinutes: z.number().int().min(0).default(0),
        crossesDay: z.boolean().default(false),
        standardWorkMinutes: z.number().int().min(0),
        color: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Permission check: MANAGER only
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { role: true },
      });

      if (currentUser?.role !== "MANAGER") {
        throw new Error("この操作は管理者のみ実行できます");
      }

      // Check if code already exists
      const existing = await ctx.db.shiftType.findUnique({
        where: { code: input.code },
      });

      if (existing) {
        throw new Error("このコードは既に使用されています");
      }

      return await ctx.db.shiftType.create({
        data: input,
      });
    }),

  /**
   * Update shift type
   * MANAGER only
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1, "名前は必須です").optional(),
        description: z.string().optional(),
        startTime: z
          .string()
          .regex(/^\d{2}:\d{2}$/, "HH:MM形式で入力してください")
          .optional(),
        endTime: z
          .string()
          .regex(/^\d{2}:\d{2}$/, "HH:MM形式で入力してください")
          .optional(),
        breakMinutes: z.number().int().min(0).optional(),
        crossesDay: z.boolean().optional(),
        standardWorkMinutes: z.number().int().min(0).optional(),
        color: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Permission check: MANAGER only
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { role: true },
      });

      if (currentUser?.role !== "MANAGER") {
        throw new Error("この操作は管理者のみ実行できます");
      }

      const { id, ...data } = input;

      // Check if exists
      const existing = await ctx.db.shiftType.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new Error("指定された勤務区分が見つかりません");
      }

      return await ctx.db.shiftType.update({
        where: { id },
        data,
      });
    }),

  /**
   * Deactivate shift type (soft delete)
   * MANAGER only
   */
  deactivate: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Permission check: MANAGER only
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { role: true },
      });

      if (currentUser?.role !== "MANAGER") {
        throw new Error("この操作は管理者のみ実行できます");
      }

      // Check if exists
      const existing = await ctx.db.shiftType.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new Error("指定された勤務区分が見つかりません");
      }

      return await ctx.db.shiftType.update({
        where: { id: input.id },
        data: { isActive: false },
      });
    }),

  /**
   * Reactivate shift type
   * MANAGER only
   */
  reactivate: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Permission check: MANAGER only
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { role: true },
      });

      if (currentUser?.role !== "MANAGER") {
        throw new Error("この操作は管理者のみ実行できます");
      }

      return await ctx.db.shiftType.update({
        where: { id: input.id },
        data: { isActive: true },
      });
    }),
});
