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

async function generateServiceRecords() {
  console.log('🚀 業務日誌からサービス実績を生成中...\n');

  try {
    // 全ての業務日誌エントリを取得（ServiceRecordがまだ生成されていないもの）
    const entries = await prisma.dailyLogEntry.findMany({
      where: {
        serviceRecord: null,
      },
      include: {
        dailyLog: {
          include: {
            unit: { select: { serviceType: true } },
          },
        },
      },
    });

    if (entries.length === 0) {
      console.log('✓ ServiceRecord未生成の利用者別記録はありません');
      return;
    }

    console.log(`📝 対象: ${entries.length}件の利用者別記録\n`);

    let created = 0;

    for (const entry of entries) {
      const { dailyLog } = entry;

      // サービス種別がGH/KAIGO/JUSHOの場合のみ生成
      const shouldGenerate = ['GH', 'KAIGO', 'JUSHO'].includes(
        dailyLog.unit.serviceType
      );

      if (!shouldGenerate) {
        console.log(
          `⊘ スキップ: サービス種別が ${dailyLog.unit.serviceType} (対象外)`
        );
        continue;
      }

      // サービス詳細の生成
      const serviceDetailParts: string[] = [];
      if (entry.mealAmount) serviceDetailParts.push(`食事: ${entry.mealAmount}`);
      if (entry.waterIntake)
        serviceDetailParts.push(`水分: ${entry.waterIntake}`);
      if (entry.bathDone) serviceDetailParts.push('入浴: 実施');
      if (entry.oralCareDone) serviceDetailParts.push('口腔ケア: 実施');
      if (entry.medicationChecks)
        serviceDetailParts.push('服薬: 実施');
      if (entry.behaviorNote)
        serviceDetailParts.push(`様子: ${entry.behaviorNote}`);
      if (entry.notes) serviceDetailParts.push(`特記: ${entry.notes}`);

      const serviceDetail =
        serviceDetailParts.length > 0
          ? serviceDetailParts.join('\n')
          : '業務日誌による日常生活支援';

      // 所要時間の計算（分）
      const duration = Math.round(
        (dailyLog.shiftEnd.getTime() - dailyLog.shiftStart.getTime()) /
          (1000 * 60)
      );

      // 時間帯を計算
      const { timeBand, ruleVersion } = await calculateTimeBand(
        prisma,
        dailyLog.shiftStart,
        dailyLog.shiftEnd
      );

      // ServiceTypeのマッピング
      let serviceType: string;
      if (dailyLog.unit.serviceType === 'GH') {
        serviceType = 'GroupHome';
      } else if (dailyLog.unit.serviceType === 'KAIGO') {
        serviceType = 'DayCare';
      } else {
        serviceType = 'HomeHelp';
      }

      // ServiceRecordを作成
      const serviceRecord = await prisma.serviceRecord.create({
        data: {
          recipientId: entry.recipientId,
          userId: dailyLog.staffId,
          serviceType,
          serviceDate: dailyLog.logDate,
          startTime: dailyLog.shiftStart,
          endTime: dailyLog.shiftEnd,
          duration,
          serviceDetail,
          userCondition: entry.behaviorNote || null,
          incidents: entry.notes || null,
          timeBand,
          appliedRuleVersion: ruleVersion,
          dailyLogEntryId: entry.id,
        },
      });

      console.log(`✅ ServiceRecord作成: ${serviceRecord.id}`);
      created++;
    }

    console.log(`\n✅ 完了: ${created}件のServiceRecordを生成しました`);
  } catch (error) {
    console.error('❌ エラー:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

generateServiceRecords().catch((e) => {
  console.error('❌ 生成失敗:', e);
  process.exit(1);
});
