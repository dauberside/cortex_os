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

async function createNightShift() {
  console.log('🌙 2026/3/14 夜勤の業務日誌を作成中...\n');

  try {
    const unit = await prisma.unit.findFirst({
      where: { name: 'テストユニット' },
    });

    const staff = await prisma.user.findUnique({
      where: { email: 'staff1@test.com' },
    });

    if (!unit || !staff) {
      throw new Error('ユニットまたはスタッフが見つかりません');
    }

    const logDate = new Date('2026-03-14T00:00:00+09:00');
    const shiftStart = new Date('2026-03-14T16:00:00+09:00');
    const shiftEnd = new Date('2026-03-15T10:00:00+09:00');

    const existing = await prisma.dailyLog.findFirst({
      where: {
        unitId: unit.id,
        logDate,
        shift: 'Night',
      },
    });

    if (existing) {
      console.log('✓ 既に存在します ID:', existing.id);
      return;
    }

    const recipients = await prisma.careRecipient.findMany({
      where: {
        id: { in: ['test-recipient-001', 'test-recipient-002'] },
      },
    });

    const dailyLog = await prisma.dailyLog.create({
      data: {
        unitId: unit.id,
        logDate,
        shift: 'Night',
        shiftStart,
        shiftEnd,
        staffId: staff.id,
        staffRole: '夜勤担当',
        residentSummary: {
          inHouse: 2,
          outing: 0,
          overnight: 0,
          hospital: 0,
          homeLeave: 0,
        },
        majorEvent: false,
        handover: '夜間は落ち着いて過ごされました。',
        entries: {
          create: recipients.map((r) => ({ recipientId: r.id })),
        },
      },
    });

    console.log('✅ 作成完了');
    console.log('   ID:', dailyLog.id);
    console.log('   日付: 2026/3/14');
    console.log('   シフト: Night (16:00-翌10:00)');
  } catch (error) {
    console.error('❌ エラー:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createNightShift().catch((e) => {
  console.error('❌ 作成失敗:', e);
  process.exit(1);
});
