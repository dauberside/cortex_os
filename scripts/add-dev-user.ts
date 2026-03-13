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

async function addDevUser() {
  console.log('=== dev@example.com ユーザー追加 ===\n');

  try {
    // Check if dev@example.com already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'dev@example.com' },
    });

    if (existingUser) {
      console.log('✅ dev@example.com は既に存在します');
      console.log(`   名前: ${existingUser.name}`);
      console.log(`   ロール: ${existingUser.role}`);
    } else {
      // Create dev user
      const devUser = await prisma.user.create({
        data: {
          email: 'dev@example.com',
          name: '開発者',
          role: 'MANAGER',
        },
      });

      console.log('✅ dev@example.com を作成しました');
      console.log(`   ID: ${devUser.id}`);
      console.log(`   名前: ${devUser.name}`);
      console.log(`   ロール: ${devUser.role}`);
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

addDevUser().catch((e) => {
  console.error('❌ 失敗:', e);
  process.exit(1);
});
