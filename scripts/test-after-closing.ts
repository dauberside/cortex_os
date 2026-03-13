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

// Mock context for assertMonthNotClosed
const createMockContext = () => ({
  db: prisma,
});

async function testAfterClosing() {
  console.log('=== テスト2: 締め後の操作制限確認 ===\n');

  // Get test data
  const unit = await prisma.unit.findFirst({ where: { name: 'テスト事業所A' } });
  const manager = await prisma.user.findFirst({ where: { email: 'manager@test.com' } });
  const staff1 = await prisma.user.findFirst({ where: { email: 'staff1@test.com' } });

  if (!unit || !manager || !staff1) {
    console.log('❌ テストデータが見つかりません');
    return;
  }

  // Step 1: Close the month
  console.log('ステップ 1: 月次締め実行');
  try {
    // Check if already closed (including reopened records)
    const allRecords = await prisma.monthlyClosing.findMany({
      where: {
        unitId: unit.id,
        yearMonth: '2026-02',
      },
      orderBy: {
        closedAt: 'desc',
      },
    });

    const activeClosure = allRecords.find((r) => r.reopenedAt === null);

    if (!activeClosure) {
      // Delete old reopened records before creating new one
      await prisma.monthlyClosing.deleteMany({
        where: {
          unitId: unit.id,
          yearMonth: '2026-02',
        },
      });
      await prisma.monthlyClosing.create({
        data: {
          yearMonth: '2026-02',
          unitId: unit.id,
          closedAt: new Date(),
          closedBy: manager.id,
          summary: {
            totalStaff: 2,
            totalWorkMinutes: 21600, // 27 days * 8 hours
            totalMidnightMinutes: 0,
            totalOvertimeMinutes: 0,
            totalHolidayMinutes: 0,
          },
        },
      });
      console.log('✅ 月次締め: 成功\n');
    } else {
      console.log('⚠️  既に締め済みです\n');
    }
  } catch (error: any) {
    console.log('❌ 月次締め: 失敗');
    console.log('   エラー:', error.message, '\n');
    return;
  }

  // Step 2: Import assertMonthNotClosed helper
  const { assertMonthNotClosed } = await import('../src/server/routers/monthlyClosing');

  // Test 2-1: シフト更新（締め後）
  console.log('テスト 2-1: シフト更新（締め後）');
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
      // Check if month is closed before updating
      const ctx = createMockContext();
      await assertMonthNotClosed(ctx, existingShift.date, unit.id);

      // If we reach here, the assertion failed
      console.log('❌ シフト更新: 本来拒否されるべきですが成功しました\n');
    } else {
      console.log('⚠️  テストシフトが見つかりません\n');
    }
  } catch (error: any) {
    if (error.message.includes('締め処理済み')) {
      console.log('✅ シフト更新: 正しく拒否されました');
      console.log('   エラーメッセージ:', error.message, '\n');
    } else {
      console.log('❌ シフト更新: 予期しないエラー');
      console.log('   エラー:', error.message, '\n');
    }
  }

  // Test 2-2: 打刻修正（締め後）
  console.log('テスト 2-2: 打刻修正（締め後）');
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
      // Check if month is closed before modifying
      const ctx = createMockContext();
      await assertMonthNotClosed(ctx, existingEvent.occurredAt, unit.id);

      // If we reach here, the assertion failed
      console.log('❌ 打刻修正: 本来拒否されるべきですが成功しました\n');
    } else {
      console.log('⚠️  テスト打刻が見つかりません\n');
    }
  } catch (error: any) {
    if (error.message.includes('締め処理済み')) {
      console.log('✅ 打刻修正: 正しく拒否されました');
      console.log('   エラーメッセージ:', error.message, '\n');
    } else {
      console.log('❌ 打刻修正: 予期しないエラー');
      console.log('   エラー:', error.message, '\n');
    }
  }

  console.log('=== テスト2完了 ===');

  await prisma.$disconnect();
}

testAfterClosing().catch((e) => {
  console.error('❌ テスト失敗:', e);
  process.exit(1);
});
