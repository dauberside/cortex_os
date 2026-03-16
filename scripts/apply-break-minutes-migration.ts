#!/usr/bin/env tsx
/**
 * breakMinutesカラム追加マイグレーションを実行
 * Prisma CLIがdirect URLに接続できない場合の代替手段
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../src/lib/prisma';

async function applyMigration() {
  console.log('🔄 breakMinutesカラム追加マイグレーションを開始します...\n');

  try {
    // 1. DailyLogにbreakMinutesを追加
    console.log('1️⃣  daily_logsテーブルにbreak_minutesカラムを追加中...');
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "daily_logs" ADD COLUMN IF NOT EXISTS "break_minutes" INTEGER NOT NULL DEFAULT 0'
    );
    console.log('✅ daily_logs.break_minutes 追加完了\n');

    // 2. ServiceRecordにbreakMinutesを追加
    console.log('2️⃣  service_recordsテーブルにbreak_minutesカラムを追加中...');
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "service_records" ADD COLUMN IF NOT EXISTS "break_minutes" INTEGER NOT NULL DEFAULT 0'
    );
    console.log('✅ service_records.break_minutes 追加完了\n');

    // 3. コメント追加
    console.log('3️⃣  カラムコメントを追加中...');
    await prisma.$executeRawUnsafe(
      `COMMENT ON COLUMN "daily_logs"."break_minutes" IS '休憩時間（分）'`
    );
    await prisma.$executeRawUnsafe(
      `COMMENT ON COLUMN "service_records"."break_minutes" IS '休憩時間（分）'`
    );
    await prisma.$executeRawUnsafe(
      `COMMENT ON COLUMN "service_records"."duration" IS '実働時間（分）= 総時間 - 休憩時間'`
    );
    console.log('✅ コメント追加完了\n');

    // 4. 確認クエリ
    console.log('4️⃣  マイグレーション結果を確認中...');
    const dailyLogColumns = await prisma.$queryRawUnsafe(
      `SELECT column_name, data_type, column_default
       FROM information_schema.columns
       WHERE table_name = 'daily_logs' AND column_name = 'break_minutes'`
    ) as any[];
    const serviceRecordColumns = await prisma.$queryRawUnsafe(
      `SELECT column_name, data_type, column_default
       FROM information_schema.columns
       WHERE table_name = 'service_records' AND column_name = 'break_minutes'`
    ) as any[];

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
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration().catch((error) => {
  console.error('致命的エラー:', error);
  process.exit(1);
});
