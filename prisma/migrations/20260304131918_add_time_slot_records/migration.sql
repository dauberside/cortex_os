-- AlterTable
ALTER TABLE "daily_log_entries" ADD COLUMN "timeSlotRecords" JSONB;

-- コメント追加
COMMENT ON COLUMN "daily_log_entries"."timeSlotRecords" IS '時間帯別記録（30分刻み）: [{time, water, meal, leisure, oral, bath, condition, toilet, sleep, notes}]';
