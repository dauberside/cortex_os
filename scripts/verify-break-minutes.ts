#!/usr/bin/env tsx
import * as dotenv from 'dotenv';
dotenv.config();

import { neon } from '@neondatabase/serverless';

async function verify() {
  const databaseUrl = process.env.DATABASE_URL || process.env.CORTEX_DATABASE_DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL が設定されていません');
    process.exit(1);
  }

  const sql = neon(databaseUrl);

  console.log('🔍 データベースのカラム状態を確認中...\n');

  // DailyLogのカラム一覧
  const dailyLogColumns = await sql`
    SELECT column_name, data_type, column_default, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'daily_logs'
    ORDER BY ordinal_position
  `;

  console.log('📊 daily_logsテーブルのカラム:');
  dailyLogColumns.forEach((col: any) => {
    console.log(`  - ${col.column_name}: ${col.data_type}${col.column_default ? ` (default: ${col.column_default})` : ''}`);
  });
  console.log('');

  // ServiceRecordのカラム一覧
  const serviceRecordColumns = await sql`
    SELECT column_name, data_type, column_default, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'service_records'
    ORDER BY ordinal_position
  `;

  console.log('📊 service_recordsテーブルのカラム:');
  serviceRecordColumns.forEach((col: any) => {
    console.log(`  - ${col.column_name}: ${col.data_type}${col.column_default ? ` (default: ${col.column_default})` : ''}`);
  });
  console.log('');

  // break_minutesの存在確認
  const dailyLogBreak = dailyLogColumns.find((c: any) => c.column_name === 'break_minutes');
  const serviceRecordBreak = serviceRecordColumns.find((c: any) => c.column_name === 'break_minutes');

  if (dailyLogBreak && serviceRecordBreak) {
    console.log('✅ 両方のテーブルにbreak_minutesカラムが存在します');
  } else {
    console.log('❌ break_minutesカラムが見つかりません:');
    if (!dailyLogBreak) console.log('  - daily_logsに存在しない');
    if (!serviceRecordBreak) console.log('  - service_recordsに存在しない');
  }
}

verify().catch((error) => {
  console.error('エラー:', error);
  process.exit(1);
});
