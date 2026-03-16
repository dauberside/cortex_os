#!/bin/bash
# breakMinutesマイグレーションを手動で適用するスクリプト

source .env 2>/dev/null || true

echo "🔄 breakMinutesカラム追加マイグレーションを開始..."
echo ""

# PostgreSQL接続情報を取得（DATABSE_URLまたはDIRECT_URL）
if [ -n "$DATABASE_URL" ]; then
  DB_URL="$DATABASE_URL"
elif [ -n "$DIRECT_URL" ]; then
  DB_URL="$DIRECT_URL"
else
  echo "❌ DATABASE_URLまたはDIRECT_URLが設定されていません"
  exit 1
fi

echo "データベースに接続中..."

# psqlを使ってSQLを実行
psql "$DB_URL" << 'SQL'
-- 1. DailyLogにbreakMinutesを追加
ALTER TABLE "daily_logs" ADD COLUMN IF NOT EXISTS "break_minutes" INTEGER NOT NULL DEFAULT 0;

-- 2. ServiceRecordにbreakMinutesを追加
ALTER TABLE "service_records" ADD COLUMN IF NOT EXISTS "break_minutes" INTEGER NOT NULL DEFAULT 0;

-- 3. コメント追加
COMMENT ON COLUMN "daily_logs"."break_minutes" IS '休憩時間（分）';
COMMENT ON COLUMN "service_records"."break_minutes" IS '休憩時間（分）';
COMMENT ON COLUMN "service_records"."duration" IS '実働時間（分）= 総時間 - 休憩時間';

-- 確認
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name IN ('daily_logs', 'service_records')
  AND column_name = 'break_minutes';
SQL

echo ""
echo "🎉 マイグレーション完了！"
