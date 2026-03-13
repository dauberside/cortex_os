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

async function testBeforeClosing() {
  console.log('=== テスト1: 締め前の編集可能性確認 ===\n');

  // Get test data
  const unit = await prisma.unit.findFirst({ where: { name: 'テスト事業所A' } });
  const manager = await prisma.user.findFirst({ where: { email: 'manager@test.com' } });
  const staff1 = await prisma.user.findFirst({ where: { email: 'staff1@test.com' } });

  if (!unit || !manager || !staff1) {
    console.log('❌ テストデータが見つかりません');
    return;
  }

  // Test 1-1: シフト更新
  console.log('テスト 1-1: シフト更新');
  try {
    const existingShift = await prisma.shift.findFirst({
      where: {
        unitId: unit.id,
        date: {
          gte: new Date('2026-02-01'),
          lt: new Date('2026-03-01'),
        },
      },
    });

    if (existingShift) {
      const updated = await prisma.shift.update({
        where: { id: existingShift.id },
        data: {
          breakMinutes: 60,
          updatedAt: new Date(),
        },
      });
      console.log('✅ シフト更新: 成功\n');
    } else {
      console.log('⚠️  テストシフトが見つかりません\n');
    }
  } catch (error: any) {
    console.log('❌ シフト更新: 失敗');
    console.log('   エラー:', error.message, '\n');
  }

  // Test 1-2: 打刻修正
  console.log('テスト 1-2: 打刻修正');
  try {
    const existingEvent = await prisma.timeClockEvent.findFirst({
      where: {
        staffId: { in: [staff1.id] },
        occurredAt: {
          gte: new Date('2026-02-01'),
          lt: new Date('2026-03-01'),
        },
      },
    });

    if (existingEvent) {
      const updated = await prisma.timeClockEvent.update({
        where: { id: existingEvent.id },
        data: {
          isModified: true,
          modifiedBy: manager.id,
          modifiedAt: new Date(),
          modifiedReason: 'テスト用の修正',
          originalOccurredAt: existingEvent.occurredAt,
        },
      });
      console.log('✅ 打刻修正: 成功\n');
    } else {
      console.log('⚠️  テスト打刻が見つかりません\n');
    }
  } catch (error: any) {
    console.log('❌ 打刻修正: 失敗');
    console.log('   エラー:', error.message, '\n');
  }

  console.log('=== テスト1完了 ===');

  await prisma.$disconnect();
}

testBeforeClosing().catch((e) => {
  console.error('❌ テスト失敗:', e);
  process.exit(1);
});
