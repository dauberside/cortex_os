import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import {
  recipientToCSVRow,
  csvRowToRecipient,
  generateCSV,
  parseCSV,
} from "@/lib/csv";

// バリデーションスキーマ
const createRecipientSchema = z.object({
  name: z.string().min(1, "氏名は必須です"),
  nameKana: z.string().optional(),
  birthDate: z.date(),
  gender: z.enum(["Male", "Female", "Other"]),
  disabilityType: z.array(z.enum(["Physical", "Intellectual", "Mental"])),
  supportLevel: z.number().int().min(1).max(6).optional(),
  emergencyContact: z.string().optional(),
  doctor: z.string().optional(),
  hospital: z.string().optional(),
  allergies: z.string().optional(),
  medicalHistory: z.string().optional(),
  notes: z.string().optional(),
  // サービス情報
  serviceTypes: z.array(z.string()).optional().default([]),
  utilizationStatus: z.string().optional(),
  receivedDate: z.date().optional(),
  validUntil: z.date().optional(),
  recipientNumber: z.string().optional(),
  behaviorSupportNeeded: z.boolean().optional().default(false),
  behaviorScore: z.number().int().optional(),
  allowances: z.array(z.string()).optional().default([]),
  // 障害者手帳
  physicalHandicapBook: z.boolean().optional().default(false),
  physicalHandicapGrade: z.string().optional(),
  intellectualHandicapBook: z.boolean().optional().default(false),
  intellectualHandicapGrade: z.string().optional(),
  mentalHandicapBook: z.boolean().optional().default(false),
  mentalHandicapGrade: z.string().optional(),
  // 手当・給付
  specialChildAllowance: z.boolean().optional().default(false),
  disabilityAllowance: z.boolean().optional().default(false),
  specialDisabilityAllowance: z.boolean().optional().default(false),
  nursingAllowance: z.boolean().optional().default(false),
  disabilityPension: z.boolean().optional().default(false),
  disabilityPensionGrade: z.string().optional(),
  disabilityPensionType: z.string().optional(),
  // 精神科・発達障害
  psychiatricDiagnosis: z.string().optional(),
  developmentalDiagnosis: z.string().optional(),
  autismSpectrumLevel: z.string().optional(),
  medicalProtectionAdmission: z.boolean().optional().default(false),
  outpatientMedication: z.boolean().optional().default(false),
  medicalFeeExemption: z.string().optional(),
  // 高齢障害者
  isElderly: z.boolean().optional().default(false),
  careInsuranceCertified: z.boolean().optional().default(false),
  careInsuranceLevel: z.string().optional(),
  careInsuranceExpiry: z.date().optional(),
  continuedDisabilityService: z.boolean().optional().default(false),
});

const updateRecipientSchema = createRecipientSchema.partial().extend({
  id: z.string(),
});

export const recipientRouter = router({
  // 利用者一覧取得
  list: protectedProcedure
    .input(
      z.object({
        includeDeleted: z.boolean().optional().default(false),
        serviceType: z.string().optional(), // サービス種別でフィルタ
        supportLevel: z.number().optional(), // 障害支援区分でフィルタ
        utilizationStatus: z.string().optional(), // 利用状況でフィルタ
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {
        userId: ctx.session.user.id,
        ...(input.includeDeleted ? {} : { deletedAt: null }),
      };

      // サービス種別でフィルタ
      if (input.serviceType) {
        where.serviceTypes = {
          has: input.serviceType,
        };
      }

      // 障害支援区分でフィルタ
      if (input.supportLevel !== undefined) {
        where.supportLevel = input.supportLevel;
      }

      // 利用状況でフィルタ
      if (input.utilizationStatus) {
        where.utilizationStatus = input.utilizationStatus;
      }

      return ctx.db.careRecipient.findMany({
        where,
        orderBy: { createdAt: "desc" },
      });
    }),

  // 利用者詳細取得
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const recipient = await ctx.db.careRecipient.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
        include: {
          careRecords: {
            orderBy: { recordDate: "desc" },
            take: 10,
          },
          vitalSigns: {
            orderBy: { measuredAt: "desc" },
            take: 10,
          },
          medications: {
            orderBy: { medicatedAt: "desc" },
            take: 10,
          },
          handovers: {
            where: { confirmedAt: null },
            orderBy: { createdAt: "desc" },
          },
          incidents: {
            orderBy: { occurredAt: "desc" },
            take: 5,
          },
        },
      });

      if (!recipient) {
        throw new Error("利用者が見つかりません");
      }

      return recipient;
    }),

  // 利用者作成
  create: protectedProcedure
    .input(createRecipientSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.careRecipient.create({
        data: {
          ...input,
          userId: ctx.session.user.id,
        },
      });
    }),

  // 利用者更新
  update: protectedProcedure
    .input(updateRecipientSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // 権限チェック
      const existing = await ctx.db.careRecipient.findFirst({
        where: {
          id,
          userId: ctx.session.user.id,
        },
      });

      if (!existing) {
        throw new Error("利用者が見つかりません");
      }

      return ctx.db.careRecipient.update({
        where: { id },
        data,
      });
    }),

  // 利用者削除（論理削除）
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // 権限チェック
      const existing = await ctx.db.careRecipient.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
      });

      if (!existing) {
        throw new Error("利用者が見つかりません");
      }

      return ctx.db.careRecipient.update({
        where: { id: input.id },
        data: { deletedAt: new Date() },
      });
    }),

  // 統計情報取得
  stats: protectedProcedure.query(async ({ ctx }) => {
    const total = await ctx.db.careRecipient.count({
      where: {
        userId: ctx.session.user.id,
        deletedAt: null,
      },
    });

    const bySupportLevel = await ctx.db.careRecipient.groupBy({
      by: ["supportLevel"],
      where: {
        userId: ctx.session.user.id,
        deletedAt: null,
        supportLevel: { not: null },
      },
      _count: true,
    });

    return {
      total,
      bySupportLevel,
    };
  }),

  // CSV エクスポート（全利用者）
  exportCSV: protectedProcedure.query(async ({ ctx }) => {
    const recipients = await ctx.db.careRecipient.findMany({
      where: {
        userId: ctx.session.user.id,
        deletedAt: null,
      },
      include: {
        assessment: true,
      },
      orderBy: { name: "asc" },
    });

    const csvRows = recipients.map((r) => recipientToCSVRow(r));
    const csvContent = generateCSV(csvRows);

    return {
      content: csvContent,
      filename: `利用者アセスメント_${new Date().toISOString().split("T")[0]}.csv`,
    };
  }),

  // CSV エクスポート（個別利用者）
  exportSingleCSV: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const recipient = await ctx.db.careRecipient.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
        include: {
          assessment: true,
        },
      });

      if (!recipient) {
        throw new Error("利用者が見つかりません");
      }

      const csvRows = [recipientToCSVRow(recipient)];
      const csvContent = generateCSV(csvRows);

      return {
        content: csvContent,
        filename: `${recipient.name}_アセスメント_${new Date().toISOString().split("T")[0]}.csv`,
      };
    }),

  // CSV インポート
  importCSV: protectedProcedure
    .input(
      z.object({
        csvContent: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const csvRows = parseCSV(input.csvContent);
        const recipients = csvRows.map((row) => csvRowToRecipient(row));

        // バリデーション
        const validRecipients: any[] = [];
        const errors: any[] = [];

        for (let i = 0; i < recipients.length; i++) {
          try {
            const validated = createRecipientSchema.parse(recipients[i]);
            validRecipients.push(validated);
          } catch (error) {
            errors.push({
              row: i + 2, // +2 for header and 0-index
              error: error instanceof Error ? error.message : "バリデーションエラー",
            });
          }
        }

        // データベースに保存（アセスメント情報も含む）
        const created = await ctx.db.$transaction(async (tx) => {
          const createdRecipients = [];

          for (const recipientData of validRecipients) {
            const { assessment, ...recipientFields } = recipientData as any;

            // 利用者を作成
            const recipient = await tx.careRecipient.create({
              data: {
                ...recipientFields,
                userId: ctx.session.user.id,
              },
            });

            // アセスメント情報がある場合は作成
            if (assessment) {
              await tx.assessment.create({
                data: {
                  recipientId: recipient.id,
                  userId: ctx.session.user.id,
                  ...assessment,
                },
              });
            }

            createdRecipients.push(recipient);
          }

          return createdRecipients;
        });

        return {
          success: true,
          imported: created.length,
          errors: errors.length > 0 ? errors : undefined,
        };
      } catch (error) {
        throw new Error(
          error instanceof Error ? error.message : "CSVインポートに失敗しました"
        );
      }
    }),
});
