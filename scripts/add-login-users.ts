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

async function addLoginUsers() {
  console.log('=== ログイン画面のテストアカウント追加 ===\n');

  const testUsers = [
    { email: 'staff@example.com', name: 'スタッフ', role: 'STAFF' as const },
    { email: 'lead@example.com', name: 'リーダー', role: 'LEAD' as const },
    {
      email: 'manager@example.com',
      name: 'マネージャー',
      role: 'MANAGER' as const,
    },
  ];

  try {
    for (const userData of testUsers) {
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existingUser) {
        console.log(`✅ ${userData.email} は既に存在します`);
      } else {
        const user = await prisma.user.create({
          data: userData,
        });
        console.log(`✅ ${userData.email} を作成しました (${user.role})`);
      }
    }

    console.log('\n=== 現在のユーザー一覧 ===\n');
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

    console.log('\n✅ 完了');
  } catch (error) {
    console.error('❌ エラー:', error);
  }

  await prisma.$disconnect();
}

addLoginUsers().catch((e) => {
  console.error('❌ 失敗:', e);
  process.exit(1);
});
