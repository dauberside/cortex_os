import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

export const unitRouter = router({
  // ユニット一覧
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.unit.findMany({
      orderBy: { name: "asc" },
      include: {
        staffs: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        recipients: {
          where: { leftAt: null },
          include: {
            recipient: {
              select: { id: true, name: true, nameKana: true, deletedAt: true },
            },
          },
        },
        _count: { select: { dailyLogs: true } },
      },
    });
  }),

  // ユニット詳細
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.unit.findUniqueOrThrow({
        where: { id: input.id },
        include: {
          staffs: {
            include: { user: { select: { id: true, name: true, email: true } } },
            orderBy: [{ role: "asc" }, { createdAt: "asc" }],
          },
          recipients: {
            where: { leftAt: null },
            include: {
              recipient: {
                select: {
                  id: true,
                  name: true,
                  nameKana: true,
                  supportLevel: true,
                  deletedAt: true,
                },
              },
            },
            orderBy: { joinedAt: "asc" },
          },
        },
      });
    }),

  // ユニット作成
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "ユニット名は必須です"),
        serviceType: z.string().min(1, "サービス種別は必須です"),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.unit.create({ data: input });
    }),

  // ユニット更新
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        serviceType: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.unit.update({ where: { id }, data });
    }),

  // ユニット削除
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.unit.delete({ where: { id: input.id } });
    }),

  // 職員をユニットに追加
  addStaff: protectedProcedure
    .input(
      z.object({
        unitId: z.string(),
        userId: z.string(),
        role: z.enum(["primary", "temporary"]),
        assignedDate: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 職員は複数ユニットに所属可能（日によって異なるユニットで勤務）
      return ctx.db.unitStaff.create({ data: input });
    }),

  // 職員をユニットから削除
  removeStaff: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.unitStaff.delete({ where: { id: input.id } });
    }),

  // 利用者をユニットに追加
  addRecipient: protectedProcedure
    .input(
      z.object({
        unitId: z.string(),
        recipientId: z.string(),
        joinedAt: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 現在所属中（leftAt が null）の別ユニットがあるかチェック
      const existingAssignment = await ctx.db.unitRecipient.findFirst({
        where: {
          recipientId: input.recipientId,
          leftAt: null, // 現在所属中
        },
        include: { unit: { select: { name: true } } },
      });

      if (existingAssignment) {
        throw new Error(
          `この利用者は既に「${existingAssignment.unit.name}」に所属しています。1人の利用者は1つのユニットにのみ所属できます。`
        );
      }

      return ctx.db.unitRecipient.create({ data: input });
    }),

  // 利用者をユニットから退所
  removeRecipient: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        leftAt: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.unitRecipient.update({
        where: { id: input.id },
        data: { leftAt: input.leftAt ?? new Date() },
      });
    }),

  // ユーザー一覧（職員選択用）
  listUsers: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.user.findMany({
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    });
  }),
});
