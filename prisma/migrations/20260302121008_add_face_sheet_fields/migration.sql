-- Phase 2: フェイスシート拡張フィールド追加
-- CareRecipientモデルに27フィールド追加（帳票レンダリング用）

-- AlterTable: care_recipients
-- 書類ヘッダー情報（6フィールド）
ALTER TABLE "care_recipients" ADD COLUMN IF NOT EXISTS "documentCreatedDate" TIMESTAMP(3);
ALTER TABLE "care_recipients" ADD COLUMN IF NOT EXISTS "organizationName" TEXT;
ALTER TABLE "care_recipients" ADD COLUMN IF NOT EXISTS "documentHeaderGroupHomeName" TEXT;
ALTER TABLE "care_recipients" ADD COLUMN IF NOT EXISTS "serviceManagerName" TEXT;
ALTER TABLE "care_recipients" ADD COLUMN IF NOT EXISTS "documentEnteredBy" TEXT;
ALTER TABLE "care_recipients" ADD COLUMN IF NOT EXISTS "documentEnteredAt" TIMESTAMP(3);

-- 基本情報拡張（3フィールド）
ALTER TABLE "care_recipients" ADD COLUMN IF NOT EXISTS "postalCode" TEXT;
ALTER TABLE "care_recipients" ADD COLUMN IF NOT EXISTS "livingArrangement" TEXT;
ALTER TABLE "care_recipients" ADD COLUMN IF NOT EXISTS "householdSeparation" BOOLEAN;

-- 緊急連絡先（JSON型・1フィールド）
ALTER TABLE "care_recipients" ADD COLUMN IF NOT EXISTS "emergencyContacts" JSONB;

-- 家族構成（JSON型・1フィールド）
ALTER TABLE "care_recipients" ADD COLUMN IF NOT EXISTS "familyMembers" JSONB;

-- 経済的状況（4フィールド）
ALTER TABLE "care_recipients" ADD COLUMN IF NOT EXISTS "disabilityPensionAmount" INTEGER;
ALTER TABLE "care_recipients" ADD COLUMN IF NOT EXISTS "publicMedicalCare" TEXT;
ALTER TABLE "care_recipients" ADD COLUMN IF NOT EXISTS "medicalInsuranceTypes" JSONB;
ALTER TABLE "care_recipients" ADD COLUMN IF NOT EXISTS "medicalInsuranceDetail" TEXT;

-- 障害の状況詳細（2フィールド）
ALTER TABLE "care_recipients" ADD COLUMN IF NOT EXISTS "disabilityCause" TEXT;
ALTER TABLE "care_recipients" ADD COLUMN IF NOT EXISTS "disabilityDetail" TEXT;

-- 生活歴（3フィールド）
ALTER TABLE "care_recipients" ADD COLUMN IF NOT EXISTS "lifeHistory" TEXT;
ALTER TABLE "care_recipients" ADD COLUMN IF NOT EXISTS "finalEducation" TEXT;
ALTER TABLE "care_recipients" ADD COLUMN IF NOT EXISTS "workHistory" TEXT;

-- 医療情報拡張（3フィールド）
ALTER TABLE "care_recipients" ADD COLUMN IF NOT EXISTS "hospitalVisits" TEXT;
ALTER TABLE "care_recipients" ADD COLUMN IF NOT EXISTS "regularCheckups" TEXT;
ALTER TABLE "care_recipients" ADD COLUMN IF NOT EXISTS "medicalRemarks" TEXT;

-- サービス利用状況（4フィールド）
ALTER TABLE "care_recipients" ADD COLUMN IF NOT EXISTS "currentServices" JSONB;
ALTER TABLE "care_recipients" ADD COLUMN IF NOT EXISTS "guardianshipType" TEXT;
ALTER TABLE "care_recipients" ADD COLUMN IF NOT EXISTS "welfareRightsAdvocacy" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "care_recipients" ADD COLUMN IF NOT EXISTS "welfareRightsDetail" TEXT;

-- 特記事項（1フィールド）
ALTER TABLE "care_recipients" ADD COLUMN IF NOT EXISTS "specialRemarks" TEXT;

-- 連絡ルール（1フィールド）
ALTER TABLE "care_recipients" ADD COLUMN IF NOT EXISTS "contactPolicy" JSONB;
