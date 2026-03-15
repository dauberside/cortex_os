#!/usr/bin/env tsx
/**
 * breakMinutesカラム追加マイグレーションを実行
 * Neon Serverless Adapterを使用してdirect URL問題を回避
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { neon } from '@neondatabase/serverless';

async function applyMigration() {
  console.log('🔄 breakMinutesカラム追加マイグレーションを開始します...\n');

  const databaseUrl = process.env.DATABASE_URL || process.env.CORTEX_DATABASE_DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL が設定されていません');
    process.exit(1);
  }

  const sql = neon(databaseUrl);

  try {
    // 1. DailyLogにbreakMinutesを追加
    console.log('1️⃣  daily_logsテーブルにbreak_minutesカラムを追加中...');
    await sql`ALTER TABLE "daily_logs" ADD COLUMN IF NOT EXISTS "break_minutes" INTEGER NOT NULL DEFAULT 0`;
    console.log('✅ daily_logs.break_minutes 追加完了\n');

    // 2. ServiceRecordにbreakMinutesを追加
    console.log('2️⃣  service_recordsテーブルにbreak_minutesカラムを追加中...');
    await sql`ALTER TABLE "service_records" ADD COLUMN IF NOT EXISTS "break_minutes" INTEGER NOT NULL DEFAULT 0`;
    console.log('✅ service_records.break_minutes 追加完了\n');

    // 3. コメント追加
    console.log('3️⃣  カラムコメントを追加中...');
    await sql`COMMENT ON COLUMN "daily_logs"."break_minutes" IS '休憩時間（分）'`;
    await sql`COMMENT ON COLUMN "service_records"."break_minutes" IS '休憩時間（分）'`;
    await sql`COMMENT ON COLUMN "service_records"."duration" IS '実働時間（分）= 総時間 - 休憩時間'`;
    console.log('✅ コメント追加完了\n');

    // 4. 確認クエリ
    console.log('4️⃣  マイグレーション結果を確認中...');
    const dailyLogColumns = await sql`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'daily_logs' AND column_name = 'break_minutes'
    `;
    const serviceRecordColumns = await sql`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'service_records' AND column_name = 'break_minutes'
    `;

    console.log('📊 DailyLog:', dailyLogColumns);
    console.log('📊 ServiceRecord:', serviceRecordColumns);
    console.log('');

    console.log('🎉 マイグレーション完了！');
    console.log('');
    console.log('次のステップ:');
    console.log('  1. 開発サーバーを再起動してください: Ctrl+C → pnpm dev');
    console.log('  2. 業務日誌作成画面で休憩時間を入力できることを確認');
    console.log('  3. ServiceRecordのdurationが正しく計算されることを確認');

  } catch (error: any) {
    console.error('❌ マイグレーションエラー:', error.message);

    // カラムが既に存在する場合
    if (error.message?.includes('already exists')) {
      console.log('\n💡 カラムは既に存在しています。マイグレーションは不要です。');
    } else {
      throw error;
    }
  }
}

applyMigration().catch((error) => {
  console.error('致命的エラー:', error);
  process.exit(1);
});
