import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

/**
 * Phase 6: Support Record Router
 *
 * MVP1 Implementation:
 * - CRUD operations for support records
 * - Category-specific content validation
 * - Permission-based access control
 * - Daily summary generation
 */

// ============================================
// Category-specific content schemas
// ============================================

const mealContentSchema = z.object({
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  intakeAmount: z.enum(["all", "most", "half", "little", "none"]),
  foodTexture: z.enum(["normal", "soft", "minced", "pureed", "liquid"]),
  assistanceLevel: z.enum(["independent", "verbal", "partial", "full"]),
  duration: z.number().optional(),
  leftoverReason: z.string().optional(),
});

const excretionContentSchema = z.object({
  type: z.enum(["urination", "defecation", "both"]),
  method: z.enum(["toilet", "portable_toilet", "diaper", "urinal"]),
  assistanceLevel: z.enum(["independent", "verbal", "partial", "full"]),
  amount: z.enum(["large", "medium", "small"]),
  condition: z.enum(["normal", "diarrhea", "constipation", "other"]),
  time: z.string().optional(), // HH:mm
});

const bathContentSchema = z.object({
  bathType: z.enum(["general", "mechanical", "shower", "partial"]),
  assistanceLevel: z.enum(["independent", "verbal", "partial", "full"]),
  duration: z.number().optional(),
  waterTemperature: z.number().optional(),
  skinCondition: z.string().optional(),
});

const mobilityContentSchema = z.object({
  activityType: z.enum(["indoor", "outdoor", "outing"]),
  destination: z.string().optional(),
  purpose: z.string().optional(),
  assistanceLevel: z.enum(["independent", "verbal", "partial", "full"]),
  mobilityAid: z.string().optional(),
  duration: z.number().optional(),
});

const communicationContentSchema = z.object({
  communicationType: z.enum([
    "verbal",
    "gesture",
    "writing",
    "device",
    "other",
  ]),
  topic: z.string().optional(),
  mood: z.enum(["good", "normal", "anxious", "irritated", "depressed"]),
  responseQuality: z.enum(["clear", "unclear", "difficult"]),
});

const healthContentSchema = z.object({
  vitalSigns: z
    .object({
      bodyTemperature: z.number().optional(),
      bloodPressureSystolic: z.number().optional(),
      bloodPressureDiastolic: z.number().optional(),
      pulse: z.number().optional(),
      spO2: z.number().optional(),
    })
    .optional(),
  symptoms: z.array(z.string()).optional(),
  painLevel: z.number().min(0).max(10).optional(),
  painLocation: z.string().optional(),
  consciousness: z.enum(["clear", "drowsy", "confused", "unconscious"]),
});

// Validation function for category-specific content
function validateContent(category: string, content: unknown): unknown {
  switch (category) {
    case "MEAL":
      return mealContentSchema.parse(content);
    case "EXCRETION":
      return excretionContentSchema.parse(content);
    case "BATH":
      return bathContentSchema.parse(content);
    case "MOBILITY":
      return mobilityContentSchema.parse(content);
    case "COMMUNICATION":
      return communicationContentSchema.parse(content);
    case "HEALTH":
      return healthContentSchema.parse(content);
    default:
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Unknown category: ${category}`,
      });
  }
}

// ============================================
// Permission helpers
// ============================================

/**
 * Check if user has permission to view recipient's records
 */
async function assertCanViewRecipient(
  ctx: any,
  recipientId: string
): Promise<void> {
  const userRole = ctx.session.user.role;

  // LEAD/MANAGER can view all recipients
  if (["LEAD", "MANAGER"].includes(userRole)) {
    return;
  }

  // STAFF can only view recipients in their assigned units
  const recipient = await ctx.db.careRecipient.findUnique({
    where: { id: recipientId },
    include: {
      unitRecipients: {
        include: {
          unit: {
            include: {
              unitMembers: {
                where: {
                  userId: ctx.session.user.id,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!recipient) {
    throw new TRPCError({ code: "NOT_FOUND", message: "利用者が見つかりません" });
  }

  const hasAccess = recipient.unitRecipients.some(
    (ur) => ur.unit.unitMembers.length > 0
  );

  if (!hasAccess) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "この利用者の記録を閲覧する権限がありません",
    });
  }
}

/**
 * Check if user can edit a specific record
 */
async function assertCanEditRecord(ctx: any, recordId: string): Promise<void> {
  const userRole = ctx.session.user.role;
  const userId = ctx.session.user.id;

  const record = await ctx.db.supportRecord.findUnique({
    where: { id: recordId },
  });

  if (!record) {
    throw new TRPCError({ code: "NOT_FOUND", message: "記録が見つかりません" });
  }

  // LEAD/MANAGER can edit all records
  if (["LEAD", "MANAGER"].includes(userRole)) {
    return;
  }

  // STAFF can only edit their own records within 24 hours
  if (record.staffId !== userId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "自分が作成した記録のみ編集できます",
    });
  }

  const hoursSinceCreation =
    (Date.now() - record.createdAt.getTime()) / (1000 * 60 * 60);
  if (hoursSinceCreation > 24) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "記録作成から24時間以上経過しているため編集できません",
    });
  }
}

/**
 * Check if user can delete a specific record
 */
async function assertCanDeleteRecord(
  ctx: any,
  recordId: string
): Promise<void> {
  // Same logic as edit
  await assertCanEditRecord(ctx, recordId);
}

// ============================================
// Router
// ============================================

export const supportRecordRouter = router({
  /**
   * List support records
   */
  list: protectedProcedure
    .input(
      z.object({
        recipientId: z.string(),
        category: z
          .enum([
            "MEAL",
            "EXCRETION",
            "BATH",
            "MOBILITY",
            "COMMUNICATION",
            "HEALTH",
          ])
          .optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      // Check permission
      await assertCanViewRecipient(ctx, input.recipientId);

      const records = await ctx.db.supportRecord.findMany({
        where: {
          recipientId: input.recipientId,
          category: input.category,
          recordDate: {
            gte: input.startDate,
            lte: input.endDate,
          },
        },
        include: {
          staff: {
            select: { id: true, name: true },
          },
        },
        orderBy: { recordDate: "desc" },
        take: input.limit,
      });

      return records;
    }),

  /**
   * Get support record by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const record = await ctx.db.supportRecord.findUnique({
        where: { id: input.id },
        include: {
          recipient: {
            select: {
              id: true,
              name: true,
            },
          },
          staff: {
            select: { id: true, name: true },
          },
        },
      });

      if (!record) {
        throw new TRPCError({ code: "NOT_FOUND", message: "記録が見つかりません" });
      }

      // Check permission
      await assertCanViewRecipient(ctx, record.recipientId);

      return record;
    }),

  /**
   * Create support record
   */
  create: protectedProcedure
    .input(
      z.object({
        recipientId: z.string(),
        recordDate: z.date(),
        category: z.enum([
          "MEAL",
          "EXCRETION",
          "BATH",
          "MOBILITY",
          "COMMUNICATION",
          "HEALTH",
        ]),
        content: z.any(), // Will be validated by category
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check permission
      await assertCanViewRecipient(ctx, input.recipientId);

      // Validate content by category
      const validatedContent = validateContent(input.category, input.content);

      const record = await ctx.db.supportRecord.create({
        data: {
          recipientId: input.recipientId,
          recordDate: input.recordDate,
          category: input.category,
          content: validatedContent as any,
          notes: input.notes,
          staffId: ctx.session.user.id,
        },
        include: {
          staff: {
            select: { id: true, name: true },
          },
        },
      });

      return record;
    }),

  /**
   * Update support record
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        recordDate: z.date().optional(),
        content: z.any().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check permission
      await assertCanEditRecord(ctx, input.id);

      // Get existing record to validate content with correct category
      const existingRecord = await ctx.db.supportRecord.findUnique({
        where: { id: input.id },
      });

      if (!existingRecord) {
        throw new TRPCError({ code: "NOT_FOUND", message: "記録が見つかりません" });
      }

      let validatedContent;
      if (input.content !== undefined) {
        validatedContent = validateContent(
          existingRecord.category,
          input.content
        );
      }

      const record = await ctx.db.supportRecord.update({
        where: { id: input.id },
        data: {
          recordDate: input.recordDate,
          content: validatedContent !== undefined ? (validatedContent as any) : undefined,
          notes: input.notes,
        },
        include: {
          staff: {
            select: { id: true, name: true },
          },
        },
      });

      return record;
    }),

  /**
   * Delete support record
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check permission
      await assertCanDeleteRecord(ctx, input.id);

      await ctx.db.supportRecord.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  /**
   * Get daily summary
   */
  getDailySummary: protectedProcedure
    .input(
      z.object({
        recipientId: z.string(),
        date: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Check permission
      await assertCanViewRecipient(ctx, input.recipientId);

      const startOfDay = new Date(input.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(input.date);
      endOfDay.setHours(23, 59, 59, 999);

      const records = await ctx.db.supportRecord.findMany({
        where: {
          recipientId: input.recipientId,
          recordDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        include: {
          staff: {
            select: { id: true, name: true },
          },
        },
        orderBy: { recordDate: "asc" },
      });

      return records;
    }),
});
