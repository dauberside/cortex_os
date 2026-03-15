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

async function clearGuideRecords() {
  console.log('🗑️  ガイド記録を削除中...\n');

  try {
    // 関連するServiceRecordを先に削除
    const deletedServiceRecords = await prisma.serviceRecord.deleteMany({
      where: {
        guideRecordId: { not: null },
      },
    });

    console.log(`✅ ServiceRecord削除: ${deletedServiceRecords.count}件`);

    // GuideRecordを削除
    const deletedGuideRecords = await prisma.guideRecord.deleteMany({});

    console.log(`✅ GuideRecord削除: ${deletedGuideRecords.count}件`);
    console.log('\n✅ 削除完了！');
  } catch (error) {
    console.error('❌ エラー:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

clearGuideRecords().catch((e) => {
  console.error('❌ 削除失敗:', e);
  process.exit(1);
});
