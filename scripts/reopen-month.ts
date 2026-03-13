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

async function reopenMonth() {
  // Get unit and manager
  const unit = await prisma.unit.findFirst({ where: { name: 'テスト事業所A' } });
  const manager = await prisma.user.findFirst({ where: { email: 'manager@test.com' } });

  if (!unit || !manager) {
    console.log('❌ テスト事業所またはマネージャーが見つかりません');
    return;
  }

  // Find the closing record
  const closing = await prisma.monthlyClosing.findFirst({
    where: {
      unitId: unit.id,
      yearMonth: '2026-02',
      reopenedAt: null,
    },
  });

  if (!closing) {
    console.log('✅ 2026年2月は既に未締め状態です');
    return;
  }

  // Reopen the month
  await prisma.monthlyClosing.update({
    where: { id: closing.id },
    data: {
      reopenedAt: new Date(),
      reopenedBy: manager.id,
      reopenReason: '受け入れテストのための差戻し',
    },
  });

  console.log('✅ 2026年2月を差戻しました');
  console.log('差戻し理由: 受け入れテストのための差戻し');

  await prisma.$disconnect();
}

reopenMonth().catch((e) => {
  console.error('❌ エラー:', e);
  process.exit(1);
});
