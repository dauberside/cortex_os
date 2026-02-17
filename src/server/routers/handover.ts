import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

// バリデーションスキーマ
const createHandoverSchema = z.object({
  recipientId: z.string().optional(),
  content: z.string().min(1, "申し送り内容は必須です"),
  priority: z.enum(["High", "Normal", "Low"]).default("Normal"),
  dueDate: z.date().optional(),
});

const updateHandoverSchema = createHandoverSchema.partial().extend({
  id: z.string(),
});

export const handoverRouter = router({
  // 申し送り一覧取得
  list: protectedProcedure
    .input(
      z.object({
        recipientId: z.string().optional(),
        priority: z.enum(["High", "Normal", "Low"]).optional(),
        confirmed: z.boolean().optional(),
        limit: z.number().optional().default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {
        user: {
          id: ctx.session.user.id,
        },
      };

      if (input.recipientId) {
        where.recipientId = input.recipientId;
      }

      if (input.priority) {
        where.priority = input.priority;
      }

      if (input.confirmed !== undefined) {
        if (input.confirmed) {
          where.confirmedAt = { not: null };
        } else {
          where.confirmedAt = null;
        }
      }

      return ctx.db.handover.findMany({
        where,
        include: {
          recipient: {
            select: {
              id: true,
              name: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [
          { confirmedAt: "asc" }, // 未確認を上に
          { createdAt: "desc" },
        ],
        take: input.limit,
      });
    }),

  // 申し送り詳細取得
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const handover = await ctx.db.handover.findFirst({
        where: {
          id: input.id,
          user: {
            id: ctx.session.user.id,
          },
        },
        include: {
          recipient: true,
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!handover) {
        throw new Error("申し送りが見つかりません");
      }

      return handover;
    }),

  // 申し送り作成
  create: protectedProcedure
    .input(createHandoverSchema)
    .mutation(async ({ ctx, input }) => {
      // 利用者IDが指定されている場合は存在確認
      if (input.recipientId) {
        const recipient = await ctx.db.careRecipient.findFirst({
          where: {
            id: input.recipientId,
            userId: ctx.session.user.id,
            deletedAt: null,
          },
        });

        if (!recipient) {
          throw new Error("利用者が見つかりません");
        }
      }

      return ctx.db.handover.create({
        data: {
          ...input,
          userId: ctx.session.user.id,
        },
      });
    }),

  // 申し送り更新
  update: protectedProcedure
    .input(updateHandoverSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // 権限チェック
      const existing = await ctx.db.handover.findFirst({
        where: {
          id,
          user: {
            id: ctx.session.user.id,
          },
        },
      });

      if (!existing) {
        throw new Error("申し送りが見つかりません");
      }

      return ctx.db.handover.update({
        where: { id },
        data,
      });
    }),

  // 申し送り確認
  confirm: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.handover.update({
        where: { id: input.id },
        data: {
          confirmedBy: ctx.session.user.id,
          confirmedAt: new Date(),
        },
      });
    }),

  // 申し送り削除
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // 権限チェック
      const existing = await ctx.db.handover.findFirst({
        where: {
          id: input.id,
          user: {
            id: ctx.session.user.id,
          },
        },
      });

      if (!existing) {
        throw new Error("申し送りが見つかりません");
      }

      return ctx.db.handover.delete({
        where: { id: input.id },
      });
    }),

  // 未確認件数取得
  unconfirmedCount: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.handover.count({
      where: {
        user: {
          id: ctx.session.user.id,
        },
        confirmedAt: null,
      },
    });
  }),

  // 期限切れ申し送り取得
  overdue: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.handover.findMany({
      where: {
        user: {
          id: ctx.session.user.id,
        },
        confirmedAt: null,
        dueDate: {
          lt: new Date(),
        },
      },
      include: {
        recipient: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { dueDate: "asc" },
    });
  }),
});
