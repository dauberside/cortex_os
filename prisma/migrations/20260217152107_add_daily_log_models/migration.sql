-- CreateTable
CREATE TABLE "medication_schedules" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "timing" TEXT NOT NULL,
    "medicationName" TEXT NOT NULL,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medication_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_logs" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "logDate" DATE NOT NULL,
    "shift" TEXT NOT NULL,
    "shiftStart" TIMESTAMP(3) NOT NULL,
    "shiftEnd" TIMESTAMP(3) NOT NULL,
    "staffId" TEXT NOT NULL,
    "staffRole" TEXT,
    "residentSummary" JSONB,
    "majorEvent" BOOLEAN NOT NULL DEFAULT false,
    "handover" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_log_entries" (
    "id" TEXT NOT NULL,
    "dailyLogId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "temperature" DOUBLE PRECISION,
    "bloodPressure" TEXT,
    "spo2" INTEGER,
    "vitalAlert" BOOLEAN NOT NULL DEFAULT false,
    "sleepTime" TIMESTAMP(3),
    "wakeTime" TIMESTAMP(3),
    "nightWaking" TEXT,
    "behaviorNote" TEXT,
    "mealAmount" TEXT,
    "mealTexture" TEXT,
    "swallowNote" TEXT,
    "waterIntake" TEXT,
    "dehydrationRisk" BOOLEAN NOT NULL DEFAULT false,
    "toiletRecords" JSONB,
    "bathDone" BOOLEAN NOT NULL DEFAULT false,
    "bathRefusal" TEXT,
    "oralCareDone" BOOLEAN NOT NULL DEFAULT false,
    "dressingDone" BOOLEAN NOT NULL DEFAULT false,
    "medicationChecks" JSONB,
    "prnMedications" JSONB,
    "outingDestination" TEXT,
    "outingCompanion" TEXT,
    "plannedReturnTime" TIMESTAMP(3),
    "returnTime" TIMESTAMP(3),
    "returnCondition" TEXT,
    "overnightStay" BOOLEAN NOT NULL DEFAULT false,
    "overnightDest" TEXT,
    "refusalRecords" JSONB,
    "supportTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "planItemRefs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_log_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "medication_schedules_recipientId_idx" ON "medication_schedules"("recipientId");

-- CreateIndex
CREATE INDEX "medication_schedules_recipientId_isActive_idx" ON "medication_schedules"("recipientId", "isActive");

-- CreateIndex
CREATE INDEX "daily_logs_unitId_logDate_idx" ON "daily_logs"("unitId", "logDate");

-- CreateIndex
CREATE INDEX "daily_logs_staffId_idx" ON "daily_logs"("staffId");

-- CreateIndex
CREATE INDEX "daily_log_entries_dailyLogId_idx" ON "daily_log_entries"("dailyLogId");

-- CreateIndex
CREATE INDEX "daily_log_entries_recipientId_idx" ON "daily_log_entries"("recipientId");

-- CreateIndex
CREATE UNIQUE INDEX "daily_log_entries_dailyLogId_recipientId_key" ON "daily_log_entries"("dailyLogId", "recipientId");

-- AddForeignKey
ALTER TABLE "medication_schedules" ADD CONSTRAINT "medication_schedules_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "care_recipients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_logs" ADD CONSTRAINT "daily_logs_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_logs" ADD CONSTRAINT "daily_logs_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_log_entries" ADD CONSTRAINT "daily_log_entries_dailyLogId_fkey" FOREIGN KEY ("dailyLogId") REFERENCES "daily_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_log_entries" ADD CONSTRAINT "daily_log_entries_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "care_recipients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
