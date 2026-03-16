import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { config } from 'dotenv';
import { calculateTimeBand } from '../src/server/lib/timeBand';

config();

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DIRECT_URL or DATABASE_URL is not defined');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function updateTimeBands() {
  console.log('🚀 サービス実績の時間帯情報を更新中...\n');

  try {
    // 時間帯が未設定のServiceRecordを取得
    const records = await prisma.serviceRecord.findMany({
      where: {
        OR: [{ timeBand: null }, { timeBand: '' }],
      },
    });

    if (records.length === 0) {
      console.log('✓ 時間帯未設定のサービス実績はありません');
      return;
    }

    console.log(`📝 対象: ${records.length}件のサービス実績\n`);

    let updated = 0;

    for (const record of records) {
      // 時間帯を計算
      const { timeBand, ruleVersion } = await calculateTimeBand(
        prisma,
        record.startTime,
        record.endTime
      );

      // ServiceRecordを更新
      await prisma.serviceRecord.update({
        where: { id: record.id },
        data: {
          timeBand,
          appliedRuleVersion: ruleVersion,
        },
      });

      console.log(
        `✅ ${record.id}: ${record.serviceDate.toLocaleDateString('ja-JP')} ${record.startTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}-${record.endTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })} → ${timeBand}`
      );
      updated++;
    }

    console.log(`\n✅ 完了: ${updated}件の時間帯情報を更新しました`);
  } catch (error) {
    console.error('❌ エラー:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateTimeBands().catch((e) => {
  console.error('❌ 更新失敗:', e);
  process.exit(1);
});
