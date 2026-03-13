import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { config } from 'dotenv';

config();

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DIRECT_URL or DATABASE_URL is not defined');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function checkDatabaseStatus() {
  console.log('=== データベース状態確認 ===\n');

  try {
    // Check if tables exist
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;

    console.log(`テーブル数: ${tables.length}`);
    console.log('テーブル一覧:');
    tables.forEach((t) => console.log(`  - ${t.tablename}`));
    console.log('');

    if (tables.length === 0) {
      console.log('❌ テーブルが存在しません。データベースが初期化されています。');
      console.log('');
      console.log('復旧方法:');
      console.log('1. pnpm prisma db push --force-reset (全データ削除・スキーマ再作成)');
      console.log('2. pnpm tsx prisma/seed.ts (テストデータ再作成)');
      await prisma.$disconnect();
      return;
    }

    // Check User count
    const userCount = await prisma.user.count();
    console.log(`User レコード数: ${userCount}`);

    // Check CareRecipient count
    const recipientCount = await prisma.careRecipient.count();
    console.log(`CareRecipient レコード数: ${recipientCount}`);

    // Check Unit count
    const unitCount = await prisma.unit.count();
    console.log(`Unit レコード数: ${unitCount}`);

    // Check AttendanceRecord count
    try {
      const attendanceCount = await prisma.attendanceRecord.count();
      console.log(`AttendanceRecord レコード数: ${attendanceCount}`);
    } catch (e) {
      console.log('AttendanceRecord テーブル: 存在しない');
    }

    // Check MonthlyClosing count
    try {
      const closingCount = await prisma.monthlyClosing.count();
      console.log(`MonthlyClosing レコード数: ${closingCount}`);
    } catch (e) {
      console.log('MonthlyClosing テーブル: 存在しない');
    }

    console.log('');

    if (userCount === 0) {
      console.log('⚠️ データが空です。seed を実行してください:');
      console.log('  pnpm tsx prisma/seed.ts');
    } else {
      console.log('✅ データベースは正常です');
    }
  } catch (error) {
    console.error('❌ エラー:', error);
  }

  await prisma.$disconnect();
}

checkDatabaseStatus().catch((e) => {
  console.error('❌ チェック失敗:', e);
  process.exit(1);
});
