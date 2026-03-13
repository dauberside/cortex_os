import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import {
  recipientToCSVRow,
  csvRowToRecipient,
  generateCSV,
  parseCSV,
} from "@/lib/csv";
import type { PrismaClient } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { formatChanges } from "@/lib/fieldLabels";

// バリデーションスキーマ
// フロントエンドのrecipientSchemaをベースに、tRPC用にDate型に変更
// Note: recipientSchemaにはrefinementが含まれているため、omit()は使えない
// 代わりに、passthrough()を使用してdate型フィールドだけをオーバーライド
const createRecipientSchema = z.object({
  name: z.string().min(1, "氏名は必須です"),
  nameKana: z.string().optional(),
  birthDate: z.date(),
  gender: z.enum(["Male", "Female", "Other"]),
  disabilityType: z
    .union([z.array(z.string()), z.string()])
    .transform((val) =>
      typeof val === "string"
        ? val
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t)
        : val
    )
    .default([]),
  supportLevel: z.number().int().min(0).max(6).nullable().optional(),
  serviceTypes: z
    .union([z.array(z.string()), z.string()])
    .transform((val) =>
      typeof val === "string"
        ? val
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t)
        : val
    )
    .default([]),
  emergencyContact: z.string().optional(),
  emergencyRelation: z.string().optional(),
  doctor: z.string().optional(),
  hospital: z.string().optional(),
  allergies: z.string().optional(),
  medicalHistory: z.string().optional(),
  notes: z.string().optional(),

  // サポート基本情報票の全フィールド
  school: z.string().optional(),
  photoUrl: z.string().optional(),
  handbookType: z.string().optional(),
  handbookGrade: z.string().optional(),
  homeAddress: z.string().optional(),
  homePhone: z.string().optional(),
  nearestStation: z.string().optional(),
  walkingMinutes: z.string().optional(),
  livingType: z.string().optional(),
  ghName: z.string().optional(),
  ghAddress: z.string().optional(),
  ghPhone: z.string().optional(),
  ghCorporation: z.string().optional(),
  ghAccess: z.string().optional(),
  hasMobilePhone: z.boolean().optional(),
  mobilePhone: z.string().optional(),
  priorConfirmationNote: z.string().optional(),
  hasRecordNote: z.boolean().optional(),
  walletNote: z.string().optional(),
  cafeBreak: z.boolean().optional(),
  cafeCondition: z.string().optional(),
  trainDiscountType: z.string().optional(),
  hasToeiPass: z.boolean().optional(),
  hasRestrictionConsent: z.boolean().optional(),
  planConsultationOffice: z.string().optional(),
  planConsultant: z.string().optional(),

  // 健康・医療情報
  disabilityName: z.string().optional(),
  diseaseStatus: z.string().optional(),
  hasSeizures: z.boolean().optional(),
  seizureFrequency: z.string().optional(),
  seizureResponse: z.string().optional(),
  medication: z
    .union([z.array(z.string()), z.string()], {
      message: "服薬情報は文字列または配列で指定してください",
    })
    .transform((val) =>
      typeof val === "string"
        ? val
            .split(/[\n,]/)
            .map((m) => m.trim())
            .filter((m) => m)
        : val
    )
    .default([]),
  hasPrnMedication: z.boolean().optional(),
  prnMedicationMethod: z.string().optional(),
  hasSeasonalMedication: z.boolean().optional(),
  seasonalMedicationContent: z.string().optional(),
  healthNote: z.string().optional(),

  // 食事情報
  favoriteFoods: z.string().optional(),
  dislikedFoods: z.string().optional(),
  hasAllergy: z.boolean().optional(),
  allergyNote: z.string().optional(),
  menuSelectionMethod: z.string().optional(),
  eatingStyle: z.string().optional(),

  // 排泄情報
  toiletSign: z.string().optional(),
  toiletFrequency: z.string().optional(),
  toiletAssistMethod: z.string().optional(),
  toiletNote: z.string().optional(),

  // 移動情報
  mobilityMethod: z.string().optional(),
  mobilityAssist: z.string().optional(),
  mobilityNote: z.string().optional(),

  // コミュニケーション情報
  commVerbal: z.string().optional(),
  commGesture: z.string().optional(),
  commExpression: z.string().optional(),
  commRequest: z.string().optional(),
  commRefusal: z.string().optional(),
  commNote: z.string().optional(),

  // 行動特性情報
  hasObsession: z.boolean().optional(),
  obsessionSituation: z.string().optional(),
  obsessionResponse: z.string().optional(),
  hasSelfHarm: z.boolean().optional(),
  hasHarmToOthers: z.boolean().optional(),
  safetyNote: z.string().optional(),
  hobbies: z.string().optional(),
  otherNotes: z.string().optional(),
  hasPastIncidents: z.boolean().optional(),
  pastIncidentsNote: z.string().optional(),
  personalityNote: z.string().optional(),
  interactionNote: z.string().optional(),

  // 外出支援情報
  outingRequestPattern: z.string().optional(),
  outingGroupPlanDeparture: z.string().optional(),
  outingGroupPlanNote: z.string().optional(),
  outingSpecificRequest1: z.string().optional(),
  outingSpecificRequest2: z.string().optional(),
  outingCasualDestination: z.string().optional(),
  outingIrregularNote: z.string().optional(),
  outingOtherNote: z.string().optional(),

  // ============================================
  // Phase 1追加フィールド
  // ============================================

  // 緊急連絡先FAX
  emergencyContactFax: z.string().optional(),

  // 感覚過敏・鈍麻
  sensorySound: z.string().optional(),
  sensoryLight: z.string().optional(),
  sensoryTaste: z.string().optional(),
  sensoryTouch: z.string().optional(),
  sensorySmell: z.string().optional(),
  sensoryOther: z.string().optional(),

  // こだわり
  obsessionPast: z.string().optional(),
  obsessionCurrent: z.string().optional(),

  // 自傷・他害・パニック
  selfHarmContent: z.string().optional(),
  aggressionContent: z.string().optional(),
  panicContent: z.string().optional(),

  // 趣味・関心・余暇・嗜好（8カテゴリー）
  hobbyOuting: z.string().optional(),
  hobbyTv: z.string().optional(),
  hobbyMusic: z.string().optional(),
  hobbyBook: z.string().optional(),
  hobbyInterpersonal: z.string().optional(),
  hobbyInterestScope: z.string().optional(),
  hobbyFoodPreference: z.string().optional(),
  hobbyOther: z.string().optional(),

  // 服薬詳細
  medicationMorning: z.string().optional(),
  medicationNoon: z.string().optional(),
  medicationEvening: z.string().optional(),
  medicationBedtime: z.string().optional(),
  medicationOtherTime: z.string().optional(),
  medicationTimeSpecific: z.string().optional(),
  medicationNote: z.string().optional(),

  // 臨時薬（頓服・季節薬）
  prnMedicationContent: z.string().optional(),
  prnMedicationTiming: z.string().optional(),
  prnMedicationMemo: z.string().optional(),

  // 発作詳細
  seizureTimePattern: z.string().optional(),
  seizureHistoryNote: z.string().optional(),

  // 塗薬等
  hasTopicalMedication: z.boolean().optional(),
  topicalMedicationNote: z.string().optional(),

  // 人柄
  personality: z.string().optional(),

  // サービス情報
  utilizationStatus: z.string().optional(),
  recipientNumber: z.string().optional(),
  receivedDate: z.date().optional(),
  validUntil: z.date().optional(),
  behaviorSupportNeeded: z.boolean().optional(),
  behaviorScore: z.number().int().min(0).optional(),

  // 障害者手帳情報
  physicalHandicapBook: z.boolean().optional(),
  physicalHandicapGrade: z.string().optional(),
  intellectualHandicapBook: z.boolean().optional(),
  intellectualHandicapGrade: z.string().optional(),
  mentalHandicapBook: z.boolean().optional(),
  mentalHandicapGrade: z.string().optional(),

  // 手当・給付情報
  allowances: z
    .union([z.array(z.string()), z.string()])
    .transform((val) =>
      typeof val === "string"
        ? val
            .split(",")
            .map((a) => a.trim())
            .filter((a) => a)
        : val
    )
    .default([]),
  specialChildAllowance: z.boolean().optional(),
  disabilityAllowance: z.boolean().optional(),
  specialDisabilityAllowance: z.boolean().optional(),
  nursingAllowance: z.boolean().optional(),
  disabilityPension: z.boolean().optional(),
  disabilityPensionType: z.string().optional(),
  disabilityPensionGrade: z.string().optional(),

  // 診断・障害情報
  psychiatricDiagnosis: z.string().optional(),
  developmentalDiagnosis: z.string().optional(),
  autismSpectrumLevel: z.string().optional(),
  medicalProtectionAdmission: z.boolean().optional(),
  outpatientMedication: z.boolean().optional(),
  medicalFeeExemption: z.string().optional(),

  // 介護保険情報
  isElderly: z.boolean().optional(),
  careInsuranceCertified: z.boolean().optional(),
  careInsuranceLevel: z.string().optional(),
  careInsuranceExpiry: z.date().optional(),
  continuedDisabilityService: z.boolean().optional(),

  // ============================================
  // Phase 2: フェイスシート拡張フィールド
  // ============================================

  // 書類ヘッダー情報
  documentCreatedDate: z
    .union([z.date(), z.string()])
    .transform((val) => (typeof val === "string" ? new Date(val) : val))
    .optional(),
  organizationName: z.string().optional(),
  documentHeaderGroupHomeName: z.string().optional(),
  serviceManagerName: z.string().optional(),
  documentEnteredBy: z.string().optional(),
  documentEnteredAt: z
    .union([z.date(), z.string()])
    .transform((val) => (typeof val === "string" ? new Date(val) : val))
    .optional(),

  // 基本情報拡張
  postalCode: z.string().optional(),
  livingArrangement: z.string().optional(),
  householdSeparation: z.boolean().optional(),

  // 緊急連絡先（JSON型）- any型で受けてPrismaのJson型へ渡す
  emergencyContacts: z.any().optional(),

  // 家族構成（JSON型）
  familyMembers: z.any().optional(),

  // 経済的状況
  disabilityPensionAmount: z
    .union([z.number().int().min(0), z.literal("")])
    .optional(),
  publicMedicalCare: z.string().optional(),
  medicalInsuranceTypes: z.any().optional(), // JSON配列
  medicalInsuranceDetail: z.string().optional(),

  // 障害の状況詳細
  disabilityCause: z.string().optional(),
  disabilityDetail: z.string().optional(),

  // 生活歴（Text型）
  lifeHistory: z.string().optional(),
  finalEducation: z.string().optional(),
  workHistory: z.string().optional(),

  // 医療情報拡張
  hospitalVisits: z.string().optional(),
  regularCheckups: z.string().optional(),
  medicalRemarks: z.string().optional(),

  // サービス利用状況（JSON型）
  currentServices: z.any().optional(),
  guardianshipType: z.string().optional(),
  welfareRightsAdvocacy: z.boolean().optional(),
  welfareRightsDetail: z.string().optional(),

  // 特記事項
  specialRemarks: z.string().optional(),

  // 連絡ルール（JSON型）
  contactPolicy: z.any().optional(),
});

const updateRecipientSchema = createRecipientSchema.partial().extend({
  id: z.string(),
});

// ヘルパー: null/undefined/空文字列を正規化
function normalizeValue(value: any): any {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  return value;
}

// ヘルパー: 差分計算（実際に変更されたフィールドのみを抽出）
function calculateDiff(existing: any, updates: any) {
  const changedFields: string[] = [];
  const patch: any = {};
  const changes: Record<string, { from: any; to: any }> = {};

  Object.entries(updates).forEach(([key, newValue]) => {
    const oldValue = existing[key];

    // 値の比較
    let hasChanged = false;

    if (newValue instanceof Date && oldValue instanceof Date) {
      // Date型: getTime()で比較
      hasChanged = newValue.getTime() !== oldValue.getTime();
    } else if (newValue instanceof Date || oldValue instanceof Date) {
      // 一方だけがDate型（null/undefinedの場合は除く）
      const normalizedOld = normalizeValue(oldValue);
      const normalizedNew = normalizeValue(newValue);
      if (normalizedOld === null && normalizedNew instanceof Date) {
        hasChanged = true;
      } else if (normalizedOld instanceof Date && normalizedNew === null) {
        hasChanged = true;
      }
    } else if (Array.isArray(newValue) && Array.isArray(oldValue)) {
      // 配列: JSON.stringifyで比較
      hasChanged = JSON.stringify(newValue) !== JSON.stringify(oldValue);
    } else if (Array.isArray(newValue) || Array.isArray(oldValue)) {
      // 一方だけが配列（空配列とnullは同一視）
      const normalizedOld = normalizeValue(oldValue);
      const normalizedNew = normalizeValue(newValue);
      if (
        Array.isArray(normalizedNew) &&
        normalizedNew.length === 0 &&
        normalizedOld === null
      ) {
        hasChanged = false;
      } else if (
        Array.isArray(normalizedOld) &&
        normalizedOld.length === 0 &&
        normalizedNew === null
      ) {
        hasChanged = false;
      } else {
        hasChanged = true;
      }
    } else if (
      typeof newValue === "object" &&
      newValue !== null &&
      typeof oldValue === "object" &&
      oldValue !== null
    ) {
      // オブジェクト型（familyMembers, emergencyContacts, contactPolicyなど）: JSON.stringifyで比較
      hasChanged = JSON.stringify(newValue) !== JSON.stringify(oldValue);
    } else if (
      (typeof newValue === "object" && newValue !== null) ||
      (typeof oldValue === "object" && oldValue !== null)
    ) {
      // 一方だけがオブジェクト（nullオブジェクトとnull/undefinedは同一視）
      const normalizedOld = normalizeValue(oldValue);
      const normalizedNew = normalizeValue(newValue);
      hasChanged = normalizedNew !== normalizedOld;
    } else {
      // プリミティブ型: null/undefined/空文字列を正規化して比較
      const normalizedOld = normalizeValue(oldValue);
      const normalizedNew = normalizeValue(newValue);
      hasChanged = normalizedNew !== normalizedOld;
    }

    if (hasChanged) {
      changedFields.push(key);
      patch[key] = newValue;
      changes[key] = { from: oldValue, to: newValue };
    }
  });

  return { changedFields, patch, changes };
}

// ヘルパー: 監査ログ作成
async function createRecipientAuditLog(
  ctx: any,
  recipientId: string,
  recipientName: string,
  changedFields: string[],
  changes: Record<string, { from: any; to: any }>
) {
  // 人間が読める形式に変換
  const formattedChanges = formatChanges(changes);

  await ctx.db.auditLog.create({
    data: {
      userId: ctx.session.user.id,
      action: "Edit",
      resourceType: "CareRecipient",
      resourceId: recipientId,
      path: `/recipients/${recipientId}/edit`,
      metadata: {
        recipientName,
        updatedFields: changedFields,
        changes, // 元の生データも保持
        formattedChanges, // 人間が読める形式
      },
    },
  });
}

export const recipientRouter = router({
  // 利用者一覧取得 - 全ユーザーが閲覧可能
  list: protectedProcedure
    .input(
      z.object({
        includeDeleted: z.boolean().optional().default(false),
        serviceType: z.string().optional(), // サービス種別でフィルタ
        supportLevel: z.number().optional(), // 障害支援区分でフィルタ
        utilizationStatus: z.string().optional(), // 利用状況でフィルタ
        search: z.string().optional(), // 氏名・フリガナ検索
      })
    )
    .query(async ({ ctx, input }) => {
      // 全ユーザーが全利用者を閲覧可能
      const where: any = {
        ...(input.includeDeleted ? {} : { deletedAt: null }),
      };

      // 氏名・フリガナ検索
      if (input.search && input.search.trim()) {
        const term = input.search.trim();
        where.OR = [
          { name: { contains: term, mode: "insensitive" } },
          { nameKana: { contains: term, mode: "insensitive" } },
        ];
      }

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
        // パフォーマンス最適化: リスト表示に必要なフィールドのみ取得
        select: {
          id: true,
          name: true,
          nameKana: true,
          birthDate: true,
          gender: true,
          photoUrl: true,
          disabilityType: true,
          supportLevel: true,
          serviceTypes: true,
          utilizationStatus: true,
          behaviorSupportNeeded: true,
          allowances: true,
          allergies: true,
          deletedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    }),

  // 利用者詳細取得 - 全ユーザーが閲覧可能
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const recipient = await ctx.db.careRecipient.findFirst({
        where: {
          id: input.id,
          deletedAt: null, // 削除済みを除外
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
          createdBy: ctx.session.user.id, // 利用者作成者を記録
        },
      });
    }),

  // 利用者更新
  update: protectedProcedure
    .input(updateRecipientSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const role = ctx.session.user.role;

      // MANAGERは全レコード編集可能
      if (role === "MANAGER") {
        const existing = await ctx.db.careRecipient.findFirst({
          where: { id },
        });

        if (!existing) {
          throw new Error("利用者が見つかりません");
        }

        // 差分計算
        const { changedFields, patch, changes } = calculateDiff(existing, data);

        // デバッグ: フェイスシート関連フィールドをログ出力
        console.log("Update debug - organizationName:", {
          existing: existing.organizationName,
          input: data.organizationName,
          inPatch: "organizationName" in patch,
        });
        console.log("Update debug - documentHeaderGroupHomeName:", {
          existing: existing.documentHeaderGroupHomeName,
          input: data.documentHeaderGroupHomeName,
          inPatch: "documentHeaderGroupHomeName" in patch,
        });
        console.log("Update debug - serviceManagerName:", {
          existing: existing.serviceManagerName,
          input: data.serviceManagerName,
          inPatch: "serviceManagerName" in patch,
        });

        // 変更がない場合はNoop（監査ログも作らない）
        if (changedFields.length === 0) {
          return existing;
        }

        // patch（変更があったフィールドのみ）でupdate
        const updated = await ctx.db.careRecipient.update({
          where: { id },
          data: patch,
        });

        // 監査ログ記録（変更されたフィールドのみ）
        await createRecipientAuditLog(
          ctx,
          id,
          updated.name,
          changedFields,
          changes
        );

        return updated;
      }

      // LEADは同じユニットの全レコード編集可能
      if (role === "LEAD") {
        const userUnits = await ctx.db.unitStaff.findMany({
          where: { userId: ctx.session.user.id },
          select: { unitId: true },
        });

        const unitIds = userUnits.map((u: { unitId: string }) => u.unitId);

        const existing = await ctx.db.careRecipient.findFirst({
          where: {
            id,
            unitRecipients: {
              some: {
                unitId: { in: unitIds },
                leftAt: null,
              },
            },
          },
        });

        if (!existing) {
          throw new Error("利用者が見つかりません");
        }

        // 差分計算
        const { changedFields, patch, changes } = calculateDiff(existing, data);

        // 変更がない場合はNoop
        if (changedFields.length === 0) {
          return existing;
        }

        // patch（変更があったフィールドのみ）でupdate
        const updated = await ctx.db.careRecipient.update({
          where: { id },
          data: patch,
        });

        // 監査ログ記録
        await createRecipientAuditLog(
          ctx,
          id,
          updated.name,
          changedFields,
          changes
        );

        return updated;
      }

      // STAFFは自分が作成したレコードのみ編集可能
      const existing = await ctx.db.careRecipient.findFirst({
        where: {
          id,
          userId: ctx.session.user.id,
        },
      });

      if (!existing) {
        throw new Error("利用者が見つかりません");
      }

      // 差分計算
      const { changedFields, patch, changes } = calculateDiff(existing, data);

      // 変更がない場合はNoop
      if (changedFields.length === 0) {
        return existing;
      }

      // patch（変更があったフィールドのみ）でupdate
      const updated = await ctx.db.careRecipient.update({
        where: { id },
        data: patch,
      });

      // 監査ログ記録
      await createRecipientAuditLog(
        ctx,
        id,
        updated.name,
        changedFields,
        changes
      );

      return updated;
    }),

  // 利用者削除（論理削除） - LEAD/MANAGERのみ可能
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const role = ctx.session.user.role;

      // STAFFは削除不可
      if (role === "STAFF") {
        throw new Error("削除権限がありません");
      }

      // MANAGERは全レコード削除可能
      if (role === "MANAGER") {
        const existing = await ctx.db.careRecipient.findFirst({
          where: { id: input.id },
        });

        if (!existing) {
          throw new Error("利用者が見つかりません");
        }

        return ctx.db.careRecipient.update({
          where: { id: input.id },
          data: { deletedAt: new Date() },
        });
      }

      // LEADは同じユニットの全レコード削除可能
      if (role === "LEAD") {
        const userUnits = await ctx.db.unitStaff.findMany({
          where: { userId: ctx.session.user.id },
          select: { unitId: true },
        });

        const unitIds = userUnits.map((u: any) => u.unitId);

        const existing = await ctx.db.careRecipient.findFirst({
          where: {
            id: input.id,
            unitRecipients: {
              some: {
                unitId: { in: unitIds },
                leftAt: null,
              },
            },
          },
        });

        if (!existing) {
          throw new Error("利用者が見つかりません");
        }

        return ctx.db.careRecipient.update({
          where: { id: input.id },
          data: { deletedAt: new Date() },
        });
      }

      throw new Error("削除権限がありません");
    }),

  // 利用者一括削除（論理削除） - LEAD/MANAGERのみ可能
  deleteMany: protectedProcedure
    .input(z.object({ ids: z.array(z.string()).min(1) }))
    .mutation(async ({ ctx, input }) => {
      const role = ctx.session.user.role;

      // STAFFは削除不可
      if (role === "STAFF") {
        throw new Error("削除権限がありません");
      }

      // MANAGERは全レコード削除可能
      if (role === "MANAGER") {
        return ctx.db.careRecipient.updateMany({
          where: {
            id: { in: input.ids },
            deletedAt: null,
          },
          data: { deletedAt: new Date() },
        });
      }

      // LEADは同じユニットの全レコード削除可能
      if (role === "LEAD") {
        const userUnits = await ctx.db.unitStaff.findMany({
          where: { userId: ctx.session.user.id },
          select: { unitId: true },
        });

        const unitIds = userUnits.map((u: any) => u.unitId);

        // 各レコードがユニットに属しているか確認
        const validRecipients = await ctx.db.careRecipient.findMany({
          where: {
            id: { in: input.ids },
            unitRecipients: {
              some: {
                unitId: { in: unitIds },
                leftAt: null,
              },
            },
          },
          select: { id: true },
        });

        const validIds = validRecipients.map((r: any) => r.id);

        return ctx.db.careRecipient.updateMany({
          where: {
            id: { in: validIds },
            deletedAt: null,
          },
          data: { deletedAt: new Date() },
        });
      }

      throw new Error("削除権限がありません");
    }),

  // 統計情報取得 - 全ユーザーが閲覧可能
  stats: protectedProcedure.query(async ({ ctx }) => {
    const total = await ctx.db.careRecipient.count({
      where: { deletedAt: null },
    });

    const bySupportLevel = await ctx.db.careRecipient.groupBy({
      by: ["supportLevel"],
      where: {
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

  // CSV エクスポート（全利用者） - 全ユーザーが実行可能
  exportCSV: protectedProcedure.query(async ({ ctx }) => {
    const recipients = await ctx.db.careRecipient.findMany({
      where: { deletedAt: null },
      include: {
        assessment: true,
      },
      orderBy: { name: "asc" },
    });

    const csvRows = recipients.map((r: any) => recipientToCSVRow(r));
    const csvContent = generateCSV(csvRows);

    return {
      content: csvContent,
      filename: `利用者アセスメント_${new Date().toISOString().split("T")[0]}.csv`,
    };
  }),

  // CSV エクスポート（個別利用者） - 全ユーザーが実行可能
  exportSingleCSV: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const recipient = await ctx.db.careRecipient.findFirst({
        where: { id: input.id },
        include: {
          assessment: true,
        },
      });

      if (!recipient) {
        throw new Error("利用者が見つかりません");
      }

      const csvRows = [recipientToCSVRow(recipient as any)];
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
        // ログインユーザーの確認
        const currentUserId = ctx.session.user.id;
        console.log("=== CSV Import Debug ===");
        console.log("Current user ID:", currentUserId);
        console.log("User email:", ctx.session.user.email);

        const csvRows = parseCSV(input.csvContent);
        const recipients = csvRows.map((row) => csvRowToRecipient(row));
        console.log("Parsed recipients count:", recipients.length);

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
              error:
                error instanceof Error ? error.message : "バリデーションエラー",
            });
          }
        }

        // データベースに保存（アセスメント情報も含む）
        // タイムアウト対策: 1件ずつ個別のトランザクションで保存
        const createdRecipients: any[] = [];
        const creationErrors: any[] = [];

        for (const recipientData of validRecipients) {
          try {
            // CSVから不要なフィールドを除外
            const {
              assessment,
              userId: _userId,
              createdBy: _createdBy,
              id: _id,
              createdAt: _createdAt,
              updatedAt: _updatedAt,
              deletedAt: _deletedAt,
              ...recipientFields
            } = recipientData as any;

            const dataToCreate = {
              ...recipientFields,
              userId: currentUserId,
              createdBy: currentUserId,
            };

            console.log("=== CSV Import: Creating recipient ===");
            console.log("Basic Info:", {
              name: dataToCreate.name,
              userId: dataToCreate.userId,
              createdBy: dataToCreate.createdBy,
              hasMobilePhone: dataToCreate.hasMobilePhone,
              mobilePhone: dataToCreate.mobilePhone,
              homeAddress: dataToCreate.homeAddress,
            });
            console.log("Support Profile Fields:", {
              disabilityName: dataToCreate.disabilityName,
              diseaseStatus: dataToCreate.diseaseStatus,
              hasSeizures: dataToCreate.hasSeizures,
              medication: dataToCreate.medication,
              healthNote: dataToCreate.healthNote,
              favoriteFoods: dataToCreate.favoriteFoods,
              dislikedFoods: dataToCreate.dislikedFoods,
              hasAllergy: dataToCreate.hasAllergy,
              allergyNote: dataToCreate.allergyNote,
              mobilityMethod: dataToCreate.mobilityMethod,
              mobilityAssist: dataToCreate.mobilityAssist,
              mobilityNote: dataToCreate.mobilityNote,
            });
            console.log("Total fields:", Object.keys(dataToCreate).length);
            console.log(
              "All field names:",
              Object.keys(dataToCreate).sort().join(", ")
            );

            // 各利用者を個別のトランザクションで作成
            const recipient = await ctx.db.$transaction(
              async (
                tx: Omit<
                  PrismaClient,
                  | "$connect"
                  | "$disconnect"
                  | "$on"
                  | "$transaction"
                  | "$use"
                  | "$extends"
                >
              ) => {
                // 利用者を作成
                const newRecipient = await tx.careRecipient.create({
                  data: dataToCreate,
                });

                // アセスメント情報がある場合は作成
                if (assessment) {
                  await tx.assessment.create({
                    data: {
                      recipientId: newRecipient.id,
                      userId: currentUserId,
                      adlMovement: assessment.adlMovement || null,
                      adlEating: assessment.adlEating || null,
                      adlToilet: assessment.adlToilet || null,
                      adlBathing: assessment.adlBathing || null,
                      adlDressing: assessment.adlDressing || null,
                      adlGrooming: assessment.adlGrooming || null,
                      commMethod: assessment.commMethod || null,
                      commVision: assessment.commVision || null,
                      commHearing: assessment.commHearing || null,
                      commSpeech: assessment.commSpeech || null,
                      lifeRhythm: assessment.lifeRhythm || null,
                      hobbies: assessment.hobbies || null,
                      personality: assessment.personality || null,
                      medicationDetails: assessment.medicationDetails || null,
                      cautions: assessment.cautions || null,
                      emergencyNote: assessment.emergencyNote || null,
                      familyStructure: assessment.familyStructure || null,
                      supportSystem: assessment.supportSystem || null,
                    },
                  });
                }

                return newRecipient;
              }
            );

            createdRecipients.push(recipient);
          } catch (error) {
            console.error(
              "Failed to create recipient:",
              recipientData.name,
              error
            );
            creationErrors.push({
              name: recipientData.name,
              error: error instanceof Error ? error.message : "作成エラー",
            });
          }
        }

        const created = createdRecipients;

        // バリデーションエラーと作成エラーを統合
        const allErrors = [...errors, ...creationErrors];

        return {
          success: true,
          imported: created.length,
          errors: allErrors.length > 0 ? allErrors : undefined,
        };
      } catch (error) {
        throw new Error(
          error instanceof Error ? error.message : "CSVインポートに失敗しました"
        );
      }
    }),
});
