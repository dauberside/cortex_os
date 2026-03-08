-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "notes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "note_tags" (
    "noteId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "note_tags_pkey" PRIMARY KEY ("noteId","tagId")
);

-- CreateTable
CREATE TABLE "links" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fromNoteId" TEXT NOT NULL,
    "toNoteId" TEXT NOT NULL,
    "type" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_messages" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "conversationId" TEXT,
    "noteId" TEXT,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "care_recipients" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameKana" TEXT,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "gender" TEXT NOT NULL,
    "disabilityType" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "supportLevel" INTEGER,
    "serviceTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "utilizationStatus" TEXT,
    "receivedDate" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "recipientNumber" TEXT,
    "behaviorSupportNeeded" BOOLEAN NOT NULL DEFAULT false,
    "behaviorScore" INTEGER,
    "allowances" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "physicalHandicapBook" BOOLEAN NOT NULL DEFAULT false,
    "physicalHandicapGrade" TEXT,
    "intellectualHandicapBook" BOOLEAN NOT NULL DEFAULT false,
    "intellectualHandicapGrade" TEXT,
    "mentalHandicapBook" BOOLEAN NOT NULL DEFAULT false,
    "mentalHandicapGrade" TEXT,
    "specialChildAllowance" BOOLEAN NOT NULL DEFAULT false,
    "disabilityAllowance" BOOLEAN NOT NULL DEFAULT false,
    "specialDisabilityAllowance" BOOLEAN NOT NULL DEFAULT false,
    "nursingAllowance" BOOLEAN NOT NULL DEFAULT false,
    "disabilityPension" BOOLEAN NOT NULL DEFAULT false,
    "disabilityPensionGrade" TEXT,
    "disabilityPensionType" TEXT,
    "psychiatricDiagnosis" TEXT,
    "developmentalDiagnosis" TEXT,
    "autismSpectrumLevel" TEXT,
    "medicalProtectionAdmission" BOOLEAN NOT NULL DEFAULT false,
    "outpatientMedication" BOOLEAN NOT NULL DEFAULT false,
    "medicalFeeExemption" TEXT,
    "isElderly" BOOLEAN NOT NULL DEFAULT false,
    "careInsuranceCertified" BOOLEAN NOT NULL DEFAULT false,
    "careInsuranceLevel" TEXT,
    "careInsuranceExpiry" TIMESTAMP(3),
    "continuedDisabilityService" BOOLEAN NOT NULL DEFAULT false,
    "emergencyContact" TEXT,
    "doctor" TEXT,
    "hospital" TEXT,
    "allergies" TEXT,
    "medicalHistory" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "care_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessments" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "adlMovement" TEXT,
    "adlEating" TEXT,
    "adlToilet" TEXT,
    "adlBathing" TEXT,
    "adlDressing" TEXT,
    "adlGrooming" TEXT,
    "commMethod" TEXT,
    "commVision" TEXT,
    "commHearing" TEXT,
    "commSpeech" TEXT,
    "lifeRhythm" TEXT,
    "hobbies" TEXT,
    "personality" TEXT,
    "cautions" TEXT,
    "emergencyNote" TEXT,
    "medicationDetails" TEXT,
    "familyStructure" TEXT,
    "supportSystem" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "care_records" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recordDate" TIMESTAMP(3) NOT NULL,
    "category" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "notes" TEXT,
    "mealAmount" TEXT,
    "mealTexture" TEXT,
    "excretionType" TEXT,
    "excretionForm" TEXT,
    "bathType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "care_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vital_signs" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "measuredAt" TIMESTAMP(3) NOT NULL,
    "temperature" DOUBLE PRECISION,
    "systolic" INTEGER,
    "diastolic" INTEGER,
    "pulse" INTEGER,
    "spo2" INTEGER,
    "weight" DOUBLE PRECISION,
    "consciousness" TEXT,
    "mobility" TEXT,
    "skinCondition" TEXT,
    "excretion" TEXT,
    "mealIntake" TEXT,
    "waterIntake" TEXT,
    "nutritionNote" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vital_signs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medications" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "medicatedAt" TIMESTAMP(3) NOT NULL,
    "medicationName" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "method" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Completed',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "handovers" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'Normal',
    "dueDate" TIMESTAMP(3),
    "confirmedBy" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "handovers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "care_incidents" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "discoveredBy" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "incidentType" TEXT NOT NULL,
    "severityLevel" INTEGER NOT NULL,
    "situation" TEXT NOT NULL,
    "cause" TEXT,
    "response" TEXT,
    "prevention" TEXT,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "care_incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_records" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "serviceDate" TIMESTAMP(3) NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "destination" TEXT,
    "purpose" TEXT,
    "serviceDetail" TEXT NOT NULL,
    "userCondition" TEXT,
    "incidents" TEXT,
    "appliedAllowances" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "staff1" TEXT,
    "staff2" TEXT,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "units" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unit_staffs" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "assignedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "unit_staffs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unit_recipients" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "unit_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guide_records" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "destination" TEXT,
    "purpose" TEXT,
    "transport" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "supportContent" TEXT,
    "userCondition" TEXT,
    "cashHandled" BOOLEAN NOT NULL DEFAULT false,
    "handedAmount" INTEGER,
    "returnedAmount" INTEGER,
    "cashNote" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guide_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "accounts_userId_idx" ON "accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE INDEX "notes_userId_idx" ON "notes"("userId");

-- CreateIndex
CREATE INDEX "notes_userId_deletedAt_idx" ON "notes"("userId", "deletedAt");

-- CreateIndex
CREATE INDEX "notes_userId_sortOrder_idx" ON "notes"("userId", "sortOrder");

-- CreateIndex
CREATE INDEX "notes_createdAt_idx" ON "notes"("createdAt");

-- CreateIndex
CREATE INDEX "tags_userId_idx" ON "tags"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "tags_userId_name_key" ON "tags"("userId", "name");

-- CreateIndex
CREATE INDEX "note_tags_noteId_idx" ON "note_tags"("noteId");

-- CreateIndex
CREATE INDEX "note_tags_tagId_idx" ON "note_tags"("tagId");

-- CreateIndex
CREATE INDEX "links_userId_idx" ON "links"("userId");

-- CreateIndex
CREATE INDEX "links_fromNoteId_idx" ON "links"("fromNoteId");

-- CreateIndex
CREATE INDEX "links_toNoteId_idx" ON "links"("toNoteId");

-- CreateIndex
CREATE INDEX "links_userId_fromNoteId_idx" ON "links"("userId", "fromNoteId");

-- CreateIndex
CREATE INDEX "ai_messages_userId_idx" ON "ai_messages"("userId");

-- CreateIndex
CREATE INDEX "ai_messages_conversationId_idx" ON "ai_messages"("conversationId");

-- CreateIndex
CREATE INDEX "ai_messages_userId_conversationId_idx" ON "ai_messages"("userId", "conversationId");

-- CreateIndex
CREATE INDEX "ai_messages_noteId_idx" ON "ai_messages"("noteId");

-- CreateIndex
CREATE INDEX "ai_messages_createdAt_idx" ON "ai_messages"("createdAt");

-- CreateIndex
CREATE INDEX "care_recipients_userId_idx" ON "care_recipients"("userId");

-- CreateIndex
CREATE INDEX "care_recipients_userId_deletedAt_idx" ON "care_recipients"("userId", "deletedAt");

-- CreateIndex
CREATE INDEX "care_recipients_userId_serviceTypes_idx" ON "care_recipients"("userId", "serviceTypes");

-- CreateIndex
CREATE UNIQUE INDEX "assessments_recipientId_key" ON "assessments"("recipientId");

-- CreateIndex
CREATE INDEX "assessments_recipientId_idx" ON "assessments"("recipientId");

-- CreateIndex
CREATE INDEX "assessments_userId_idx" ON "assessments"("userId");

-- CreateIndex
CREATE INDEX "care_records_recipientId_recordDate_idx" ON "care_records"("recipientId", "recordDate");

-- CreateIndex
CREATE INDEX "care_records_userId_idx" ON "care_records"("userId");

-- CreateIndex
CREATE INDEX "vital_signs_recipientId_measuredAt_idx" ON "vital_signs"("recipientId", "measuredAt");

-- CreateIndex
CREATE INDEX "vital_signs_userId_idx" ON "vital_signs"("userId");

-- CreateIndex
CREATE INDEX "medications_recipientId_medicatedAt_idx" ON "medications"("recipientId", "medicatedAt");

-- CreateIndex
CREATE INDEX "medications_userId_idx" ON "medications"("userId");

-- CreateIndex
CREATE INDEX "handovers_recipientId_idx" ON "handovers"("recipientId");

-- CreateIndex
CREATE INDEX "handovers_userId_idx" ON "handovers"("userId");

-- CreateIndex
CREATE INDEX "handovers_confirmedBy_confirmedAt_idx" ON "handovers"("confirmedBy", "confirmedAt");

-- CreateIndex
CREATE INDEX "care_incidents_recipientId_occurredAt_idx" ON "care_incidents"("recipientId", "occurredAt");

-- CreateIndex
CREATE INDEX "care_incidents_userId_idx" ON "care_incidents"("userId");

-- CreateIndex
CREATE INDEX "care_incidents_severityLevel_idx" ON "care_incidents"("severityLevel");

-- CreateIndex
CREATE INDEX "service_records_recipientId_serviceDate_idx" ON "service_records"("recipientId", "serviceDate");

-- CreateIndex
CREATE INDEX "service_records_userId_idx" ON "service_records"("userId");

-- CreateIndex
CREATE INDEX "service_records_serviceType_idx" ON "service_records"("serviceType");

-- CreateIndex
CREATE INDEX "unit_staffs_unitId_idx" ON "unit_staffs"("unitId");

-- CreateIndex
CREATE INDEX "unit_staffs_userId_idx" ON "unit_staffs"("userId");

-- CreateIndex
CREATE INDEX "unit_staffs_unitId_assignedDate_idx" ON "unit_staffs"("unitId", "assignedDate");

-- CreateIndex
CREATE INDEX "unit_recipients_unitId_idx" ON "unit_recipients"("unitId");

-- CreateIndex
CREATE INDEX "unit_recipients_recipientId_idx" ON "unit_recipients"("recipientId");

-- CreateIndex
CREATE INDEX "guide_records_recipientId_startedAt_idx" ON "guide_records"("recipientId", "startedAt");

-- CreateIndex
CREATE INDEX "guide_records_userId_idx" ON "guide_records"("userId");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_tags" ADD CONSTRAINT "note_tags_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_tags" ADD CONSTRAINT "note_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "links" ADD CONSTRAINT "links_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "links" ADD CONSTRAINT "links_fromNoteId_fkey" FOREIGN KEY ("fromNoteId") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "links" ADD CONSTRAINT "links_toNoteId_fkey" FOREIGN KEY ("toNoteId") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "notes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_recipients" ADD CONSTRAINT "care_recipients_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "care_recipients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_records" ADD CONSTRAINT "care_records_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "care_recipients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_records" ADD CONSTRAINT "care_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vital_signs" ADD CONSTRAINT "vital_signs_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "care_recipients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vital_signs" ADD CONSTRAINT "vital_signs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medications" ADD CONSTRAINT "medications_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "care_recipients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medications" ADD CONSTRAINT "medications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handovers" ADD CONSTRAINT "handovers_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "care_recipients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handovers" ADD CONSTRAINT "handovers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_incidents" ADD CONSTRAINT "care_incidents_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "care_recipients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_incidents" ADD CONSTRAINT "care_incidents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_records" ADD CONSTRAINT "service_records_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "care_recipients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_records" ADD CONSTRAINT "service_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_staffs" ADD CONSTRAINT "unit_staffs_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_staffs" ADD CONSTRAINT "unit_staffs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_recipients" ADD CONSTRAINT "unit_recipients_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_recipients" ADD CONSTRAINT "unit_recipients_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "care_recipients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guide_records" ADD CONSTRAINT "guide_records_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "care_recipients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guide_records" ADD CONSTRAINT "guide_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
