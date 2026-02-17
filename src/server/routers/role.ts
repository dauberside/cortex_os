import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";

// Zodスキーマ定義
export const assignRoleSchema = z.object({
  noteId: z.string().cuid(),
  role: z.enum(["IC", "Comms", "SME"]),
  assignedTo: z.string().min(1, "担当者名は必須です"),
});

export const endRoleSchema = z.object({
  id: z.string().cuid(),
});

export const listRolesSchema = z.object({
  noteId: z.string().cuid(),
  activeOnly: z.boolean().optional().default(false),
});

// Role Router
export const roleRouter = router({
  // 役割を割り当て
  assign: protectedProcedure
    .input(assignRoleSchema)
    .mutation(async ({ ctx, input }) => {
      // インシデントの存在と権限を確認
      const incident = await (ctx.prisma as any).note.findFirst({
        where: {
          id: input.noteId,
          userId: ctx.session.user.id,
          isIncident: true,
          deletedAt: null,
        },
      });

      if (!incident) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "インシデントが見つかりません",
        });
      }

      // 既存のアクティブな同じ役割があれば終了させる
      await (ctx.prisma as any).incidentRoleAssignment.updateMany({
        where: {
          noteId: input.noteId,
          role: input.role,
          endedAt: null,
        },
        data: {
          endedAt: new Date(),
        },
      });

      const roleAssignment = await (ctx.prisma as any).incidentRoleAssignment.create({
        data: {
          noteId: input.noteId,
          role: input.role,
          assignedTo: input.assignedTo,
        },
      });

      // イベントを作成
      await (ctx.prisma as any).incidentEvent.create({
        data: {
          noteId: input.noteId,
          eventType: "Update",
          content: `役割割り当て: ${input.role} → ${input.assignedTo}`,
          createdBy: ctx.session.user.name || ctx.session.user.email,
        },
      });

      return roleAssignment;
    }),

  // 役割を終了（ハンドオフ）
  end: protectedProcedure
    .input(endRoleSchema)
    .mutation(async ({ ctx, input }) => {
      const roleAssignment = await (ctx.prisma as any).incidentRoleAssignment.findUnique(
        {
          where: { id: input.id },
          include: { note: true },
        }
      );

      if (!roleAssignment || roleAssignment.note.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "役割割り当てが見つかりません",
        });
      }

      const updated = await (ctx.prisma as any).incidentRoleAssignment.update({
        where: { id: input.id },
        data: { endedAt: new Date() },
      });

      // イベントを作成
      await (ctx.prisma as any).incidentEvent.create({
        data: {
          noteId: roleAssignment.noteId,
          eventType: "Update",
          content: `役割終了: ${roleAssignment.role} (${roleAssignment.assignedTo})`,
          createdBy: ctx.session.user.name || ctx.session.user.email,
        },
      });

      return updated;
    }),

  // 役割一覧を取得
  list: protectedProcedure
    .input(listRolesSchema)
    .query(async ({ ctx, input }) => {
      // インシデントの存在と権限を確認
      const incident = await (ctx.prisma as any).note.findFirst({
        where: {
          id: input.noteId,
          userId: ctx.session.user.id,
          isIncident: true,
          deletedAt: null,
        },
      });

      if (!incident) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "インシデントが見つかりません",
        });
      }

      const where: any = { noteId: input.noteId };
      if (input.activeOnly) {
        where.endedAt = null;
      }

      const roles = await (ctx.prisma as any).incidentRoleAssignment.findMany({
        where,
        orderBy: { assignedAt: "desc" },
      });

      return roles;
    }),
});
