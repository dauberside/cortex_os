-- AlterTable: DailyLog に breakMinutes 追加
ALTER TABLE "daily_logs" ADD COLUMN "break_minutes" INTEGER NOT NULL DEFAULT 0;

-- AlterTable: ServiceRecord に breakMinutes 追加
ALTER TABLE "service_records" ADD COLUMN "break_minutes" INTEGER NOT NULL DEFAULT 0;

-- コメント追加（ドキュメント用）
COMMENT ON COLUMN "daily_logs"."break_minutes" IS '休憩時間（分）';
COMMENT ON COLUMN "service_records"."break_minutes" IS '休憩時間（分）';
COMMENT ON COLUMN "service_records"."duration" IS '実働時間（分）= 総時間 - 休憩時間';
