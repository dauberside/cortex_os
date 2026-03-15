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

async function recalculateTimeBands() {
  console.log('🔄 全サービス実績の時間帯を再計算中...\n');

  try {
    // 全てのServiceRecordを取得
    const records = await prisma.serviceRecord.findMany({
      include: {
        recipient: { select: { name: true } },
      },
      orderBy: { serviceDate: 'desc' },
    });

    if (records.length === 0) {
      console.log('✓ サービス実績がありません');
      return;
    }

    console.log(`📝 対象: ${records.length}件のサービス実績\n`);

    let updated = 0;

    for (const record of records) {
      // 時間帯を再計算
      const { timeBand, ruleVersion } = await calculateTimeBand(
        prisma,
        record.startTime,
        record.endTime
      );

      // 時間帯が変更された場合のみ更新
      if (record.timeBand !== timeBand || record.appliedRuleVersion !== ruleVersion) {
        await prisma.serviceRecord.update({
          where: { id: record.id },
          data: {
            timeBand,
            appliedRuleVersion: ruleVersion,
          },
        });

        console.log(
          `✅ ${record.recipient.name} ${record.serviceDate.toLocaleDateString('ja-JP')}: ${record.timeBand || '未設定'} → ${timeBand}`
        );
        updated++;
      }
    }

    if (updated === 0) {
      console.log('✓ 変更の必要なサービス実績はありませんでした');
    } else {
      console.log(`\n✅ 完了: ${updated}件の時間帯情報を更新しました`);
    }
  } catch (error) {
    console.error('❌ エラー:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

recalculateTimeBands().catch((e) => {
  console.error('❌ 再計算失敗:', e);
  process.exit(1);
});
