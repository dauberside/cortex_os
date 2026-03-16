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

async function createTimeBandRule() {
  console.log('⏰ 時間帯ルールを作成中...\n');

  try {
    // 既存のルールを確認
    const existing = await prisma.timeBandRule.findFirst({
      where: { isActive: true },
    });

    if (existing) {
      console.log('✓ 既に有効な時間帯ルールが存在します');
      console.log(`  バージョン: ${existing.version}`);
      console.log(`  有効期間: ${existing.effectiveFrom.toLocaleDateString('ja-JP')} ～`);
      return;
    }

    // 新しいルールを作成
    const rule = await prisma.timeBandRule.create({
      data: {
        name: '標準時間帯ルール',
        version: 'v1.0',
        effectiveFrom: new Date('2026-01-01T00:00:00+09:00'),
        effectiveTo: null, // 無期限
        isActive: true,
        timeBands: {
          // 日中時間帯: 08:00-18:00
          daytime: {
            start: '08:00',
            end: '18:00',
          },
          // 早朝・夜間時間帯: 18:00-08:00
          earlyLate: [
            {
              start: '18:00',
              end: '23:59',
            },
            {
              start: '00:00',
              end: '08:00',
            },
          ],
        },
        description:
          '標準時間帯ルール: 日中(8:00-18:00)、早朝・夜間(18:00-8:00)',
      },
    });

    console.log('✅ 時間帯ルール作成完了');
    console.log(`  バージョン: ${rule.version}`);
    console.log('  日中時間帯: 08:00-18:00');
    console.log('  早朝・夜間: 18:00-08:00');
    console.log('\n📌 この設定により:');
    console.log('  - 日勤(09:00-18:00) → DAYTIME');
    console.log('  - 遅番(13:00-22:00) → CROSSES_BANDS (時間帯跨ぎ)');
    console.log('  - 夜勤(16:00-10:00) → CROSSES_BANDS (時間帯跨ぎ)');
    console.log('\n💡 注意: 夜勤は開始が18時前、終了が8時以降のため、');
    console.log('   日中と早朝・夜間の両方にまたがり CROSSES_BANDS となります。');
  } catch (error) {
    console.error('❌ エラー:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createTimeBandRule().catch((e) => {
  console.error('❌ 作成失敗:', e);
  process.exit(1);
});
