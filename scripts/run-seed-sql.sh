#!/bin/bash

# .envファイルから環境変数を読み込む
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# DIRECT_URLまたはDATABASE_URLを使用
DB_URL="${DIRECT_URL:-$DATABASE_URL}"

if [ -z "$DB_URL" ]; then
  echo "ERROR: DATABASE_URL or DIRECT_URL not found in .env"
  exit 1
fi

echo "📊 Running seed SQL..."
psql "$DB_URL" -f scripts/seed-test-data.sql

echo ""
echo "✅ Test data seeded successfully!"
echo ""
echo "🔐 Access Control Test:"
echo "- STAFF (staff@example.com): ユニットA所属 → 利用者1,2を閲覧可、利用者1のみ編集可"
echo "- LEAD (lead@example.com): ユニットA所属 → 利用者1,2を閲覧・編集可"
echo "- MANAGER (manager@example.com): 全ユニット → 全利用者を閲覧・編集可"
