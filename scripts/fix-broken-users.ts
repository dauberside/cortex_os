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

async function fixBrokenUsers() {
  console.log('=== 壊れたユーザーデータ修正 ===\n');

  try {
    // Find broken users
    const brokenUsers = await prisma.user.findMany({
      where: {
        OR: [
          { email: 'anager@test.com' },
          { email: 'manager@example.com' },
        ],
      },
    });

    console.log(`壊れたユーザー: ${brokenUsers.length}件\n`);

    for (const user of brokenUsers) {
      console.log(`修正前: ${user.email} - ${user.name}`);

      // Check if user has any data
      const guideRecordCount = await prisma.guideRecord.count({
        where: { userId: user.id },
      });
      const shiftCount = await prisma.shift.count({
        where: { staffId: user.id },
      });
      const attendanceCount = await prisma.attendanceRecord.count({
        where: { staffId: user.id },
      });

      console.log(
        `  関連データ: ガイド記録${guideRecordCount}件, シフト${shiftCount}件, 勤怠${attendanceCount}件`
      );

      // If user has no data, delete it
      if (guideRecordCount === 0 && shiftCount === 0 && attendanceCount === 0) {
        await prisma.user.delete({
          where: { id: user.id },
        });
        console.log(`  → 削除しました（関連データなし）\n`);
      } else {
        console.log(`  → 保持します（関連データあり）\n`);
      }
    }

    // Show remaining users
    console.log('=== 修正後のユーザー一覧 ===\n');
    const users = await prisma.user.findMany({
      select: {
        email: true,
        name: true,
        role: true,
      },
      orderBy: { email: 'asc' },
    });

    users.forEach((u) => {
      console.log(`  ${u.email} - ${u.name} (${u.role})`);
    });

    console.log('\n✅ 修正完了');
  } catch (error) {
    console.error('❌ エラー:', error);
  }

  await prisma.$disconnect();
}

fixBrokenUsers().catch((e) => {
  console.error('❌ 修正失敗:', e);
  process.exit(1);
});
