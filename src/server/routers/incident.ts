import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";

// Zodスキーマ定義
export const createIncidentSchema = z.object({
  title: z.string().min(1, "タイトルは必須です").max(255),
  severity: z.enum(["P0", "P1", "P2", "P3"]),
  affectedServices: z.array(z.string()),
  impactSummary: z.string().optional(),
  commsChannelUrl: z.string().url().optional().or(z.literal("")),
});

export const updateIncidentSchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(1).max(255).optional(),
  content: z.string().optional(),
  severity: z.enum(["P0", "P1", "P2", "P3"]).optional(),
  affectedServices: z.array(z.string()).optional(),
  impactSummary: z.string().optional(),
  commsChannelUrl: z.string().url().optional().or(z.literal("")),
});

export const updateStatusSchema = z.object({
  id: z.string().cuid(),
  status: z.enum([
    "Detected",
    "Investigating",
    "Mitigated",
    "Resolved",
    "Postmortem",
  ]),
});

export const getIncidentSchema = z.object({
  id: z.string().cuid(),
});

export const listIncidentsSchema = z.object({
  status: z
    .enum([
      "Detected",
      "Investigating",
      "Mitigated",
      "Resolved",
      "Postmortem",
      "all",
    ])
    .optional()
    .default("all"),
  severity: z.enum(["P0", "P1", "P2", "P3", "all"]).optional().default("all"),
});

// Incident Router
export const incidentRouter = router({
  // インシデントを作成
  create: protectedProcedure
    .input(createIncidentSchema)
    .mutation(async ({ ctx, input }) => {
      const now = new Date();

      const incident = await (ctx.prisma as any).note.create({
        data: {
          userId: ctx.session.user.id,
          title: input.title,
          content: `# ${input.title}

## 概要
- **重大度**: ${input.severity}
- **検出時刻**: ${now.toISOString()}
- **影響を受けるサービス**: ${input.affectedServices.join(", ")}

## 影響の概要
${input.impactSummary || ""}

## コミュニケーション
${input.commsChannelUrl ? `チャンネル: ${input.commsChannelUrl}` : ""}

## タイムライン
検出時刻に自動作成されました。

## 対応状況
現在調査中です。
`,
          isIncident: true,
          severity: input.severity,
          incidentStatus: "Detected",
          detectedAt: now,
          affectedServices: input.affectedServices,
          impactSummary: input.impactSummary || null,
          commsChannelUrl: input.commsChannelUrl || null,
        },
        include: {
          incidentEvents: true,
          incidentRoles: true,
          incidentActions: true,
        },
      });

      // 初期イベントを作成
      await (ctx.prisma as any).incidentEvent.create({
        data: {
          noteId: incident.id,
          eventType: "Update",
          content: `インシデント検出: ${input.title} (${input.severity})`,
          createdBy: ctx.session.user.name || ctx.session.user.email,
        },
      });

      return incident;
    }),

  // インシデントを取得
  get: protectedProcedure
    .input(getIncidentSchema)
    .query(async ({ ctx, input }) => {
      const incident = await (ctx.prisma as any).note.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
          isIncident: true,
          deletedAt: null,
        },
        include: {
          incidentEvents: {
            orderBy: { createdAt: "desc" },
          },
          incidentRoles: {
            orderBy: { assignedAt: "desc" },
          },
          incidentActions: {
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!incident) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "インシデントが見つかりません",
        });
      }

      return incident;
    }),

  // インシデント一覧を取得
  list: protectedProcedure
    .input(listIncidentsSchema)
    .query(async ({ ctx, input }) => {
      const where: any = {
        userId: ctx.session.user.id,
        isIncident: true,
        deletedAt: null,
      };

      if (input.status !== "all") {
        where.incidentStatus = input.status;
      }

      if (input.severity !== "all") {
        where.severity = input.severity;
      }

      const incidents = await (ctx.prisma as any).note.findMany({
        where,
        orderBy: { detectedAt: "desc" },
        include: {
          incidentRoles: {
            where: { endedAt: null },
            orderBy: { assignedAt: "desc" },
          },
        },
      });

      return incidents;
    }),

  // インシデントを更新
  update: protectedProcedure
    .input(updateIncidentSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const incident = await (ctx.prisma as any).note.findFirst({
        where: {
          id,
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

      const updated = await (ctx.prisma as any).note.update({
        where: { id },
        data,
        include: {
          incidentEvents: true,
          incidentRoles: true,
          incidentActions: true,
        },
      });

      return updated;
    }),

  // ステータスを更新
  updateStatus: protectedProcedure
    .input(updateStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const incident = await (ctx.prisma as any).note.findFirst({
        where: {
          id: input.id,
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

      const now = new Date();
      const updateData: any = {
        incidentStatus: input.status,
      };

      // ステータスに応じてタイムスタンプを更新
      if (input.status === "Mitigated" && !incident.mitigatedAt) {
        updateData.mitigatedAt = now;
      } else if (input.status === "Resolved" && !incident.resolvedAt) {
        updateData.resolvedAt = now;
      }

      const updated = await (ctx.prisma as any).note.update({
        where: { id: input.id },
        data: updateData,
      });

      // イベントを作成
      await (ctx.prisma as any).incidentEvent.create({
        data: {
          noteId: input.id,
          eventType: "Update",
          content: `ステータス変更: ${input.status}`,
          createdBy: ctx.session.user.name || ctx.session.user.email,
        },
      });

      return updated;
    }),
});
