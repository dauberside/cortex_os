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

async function seedDailyLogEntries() {
  console.log('🚀 業務日誌の利用者別記録サンプル投入開始...\n');

  try {
    // 最新の業務日誌を取得
    const dailyLog = await prisma.dailyLog.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (!dailyLog) {
      throw new Error('業務日誌が見つかりません。先にsetup-unit-daily-log.tsを実行してください。');
    }

    console.log(`✅ 業務日誌取得: ${dailyLog.logDate.toLocaleDateString('ja-JP')}`);

    // 利用者を取得
    const yamada = await prisma.careRecipient.findUnique({
      where: { id: 'test-recipient-001' },
    });
    const sato = await prisma.careRecipient.findUnique({
      where: { id: 'test-recipient-002' },
    });

    if (!yamada || !sato) {
      throw new Error('利用者が見つかりません');
    }

    // 山田太郎の記録を作成
    const existingYamada = await prisma.dailyLogEntry.findFirst({
      where: {
        dailyLogId: dailyLog.id,
        recipientId: yamada.id,
      },
    });

    if (existingYamada) {
      console.log(`✓ ${yamada.name}の記録は既に存在します`);
    } else {
      await prisma.dailyLogEntry.create({
        data: {
          dailyLogId: dailyLog.id,
          recipientId: yamada.id,

          // A. バイタル・状態
          temperature: 36.5,
          bloodPressure: '120/80',
          spo2: 98,
          vitalAlert: false,
          sleepTime: new Date('2026-03-11T22:30:00+09:00'),
          wakeTime: new Date('2026-03-12T07:00:00+09:00'),
          nightWaking: undefined,
          behaviorNote: '穏やかに過ごされていました。笑顔が多く見られました。',

          // B. 生活支援
          mealAmount: '全量',
          mealTexture: '普通食',
          swallowNote: undefined,
          waterIntake: '十分',
          dehydrationRisk: false,
          toiletRecords: [
            { time: '07:30', type: 'Urine', note: '自立' },
            { time: '10:00', type: 'Urine', note: '自立' },
            { time: '12:30', type: 'Feces', note: '自立' },
            { time: '15:00', type: 'Urine', note: '自立' },
          ],
          bathDone: true,
          bathRefusal: undefined,
          oralCareDone: true,
          dressingDone: true,

          // C. 服薬（空配列で初期化）
          medicationChecks: [],
          prnMedications: undefined,

          // D. 外出・外泊
          outingDestination: '近所の公園',
          outingCompanion: 'スタッフ1名',
          plannedReturnTime: new Date('2026-03-12T16:00:00+09:00'),
          returnTime: new Date('2026-03-12T16:00:00+09:00'),
          returnCondition: '機嫌良く帰宅',
          overnightStay: false,
          overnightDest: undefined,

          // E. 拒否記録
          refusalRecords: undefined,

          // F. 支援区分タグ
          supportTags: ['外出', '生活支援', 'レクリエーション'],
          planItemRefs: [],

          // G. 特記事項
          notes: '本日は穏やかに過ごされました。外出も楽しまれていました。午前中は折り紙作成のレクリエーションに参加。',

          // H. 時間帯別記録（30分刻み）
          timeSlotRecords: [
            { time: '09:00', water: '', meal: '', leisure: '起床', oral: false, bath: false, condition: '良好', toilet: '', sleep: '', notes: '' },
            { time: '09:30', water: '100ml', meal: '', leisure: '', oral: false, bath: false, condition: '良好', toilet: '', sleep: '', notes: '' },
            { time: '10:00', water: '', meal: '', leisure: '折り紙作成', oral: false, bath: false, condition: '良好', toilet: '排尿', sleep: '', notes: '' },
            { time: '10:30', water: '', meal: '', leisure: '折り紙作成', oral: false, bath: false, condition: '良好', toilet: '', sleep: '', notes: '' },
            { time: '11:00', water: '', meal: '', leisure: '', oral: false, bath: false, condition: '良好', toilet: '', sleep: '', notes: '' },
            { time: '11:30', water: '', meal: '', leisure: '', oral: false, bath: false, condition: '良好', toilet: '', sleep: '', notes: '' },
            { time: '12:00', water: '150ml', meal: '全量', leisure: '', oral: false, bath: false, condition: '良好', toilet: '', sleep: '', notes: '昼食' },
            { time: '12:30', water: '', meal: '', leisure: '', oral: false, bath: false, condition: '良好', toilet: '排便', sleep: '', notes: '' },
            { time: '13:00', water: '', meal: '', leisure: '休憩', oral: false, bath: false, condition: '良好', toilet: '', sleep: '', notes: '' },
            { time: '13:30', water: '', meal: '', leisure: '休憩', oral: false, bath: false, condition: '良好', toilet: '', sleep: '', notes: '' },
            { time: '14:00', water: '', meal: '', leisure: '外出準備', oral: false, bath: false, condition: '良好', toilet: '', sleep: '', notes: '公園へ' },
            { time: '14:30', water: '', meal: '', leisure: '散歩', oral: false, bath: false, condition: '良好', toilet: '', sleep: '', notes: '' },
            { time: '15:00', water: '', meal: '', leisure: '散歩', oral: false, bath: false, condition: '良好', toilet: '排尿', sleep: '', notes: '' },
            { time: '15:30', water: '100ml', meal: '', leisure: '散歩', oral: false, bath: false, condition: '良好', toilet: '', sleep: '', notes: '' },
            { time: '16:00', water: '', meal: '', leisure: '帰宅', oral: false, bath: false, condition: '良好', toilet: '', sleep: '', notes: '' },
            { time: '16:30', water: '', meal: '', leisure: 'TV視聴', oral: false, bath: false, condition: '良好', toilet: '', sleep: '', notes: '' },
            { time: '17:00', water: '', meal: '', leisure: 'TV視聴', oral: false, bath: false, condition: '良好', toilet: '', sleep: '', notes: '' },
            { time: '17:30', water: '', meal: '', leisure: '', oral: true, bath: true, condition: '良好', toilet: '', sleep: '', notes: '入浴' },
          ],
        },
      });

      console.log(`✅ ${yamada.name}の記録を作成しました`);
    }

    // 佐藤花子の記録を作成
    const existingSato = await prisma.dailyLogEntry.findFirst({
      where: {
        dailyLogId: dailyLog.id,
        recipientId: sato.id,
      },
    });

    if (existingSato) {
      console.log(`✓ ${sato.name}の記録は既に存在します`);
    } else {
      await prisma.dailyLogEntry.create({
        data: {
          dailyLogId: dailyLog.id,
          recipientId: sato.id,

          // A. バイタル・状態
          temperature: 36.8,
          bloodPressure: '118/75',
          spo2: 99,
          vitalAlert: false,
          sleepTime: new Date('2026-03-11T23:00:00+09:00'),
          wakeTime: new Date('2026-03-12T06:30:00+09:00'),
          nightWaking: undefined,
          behaviorNote: 'いつも通り明るく元気に過ごされていました。',

          // B. 生活支援
          mealAmount: '全量',
          mealTexture: '普通食',
          swallowNote: undefined,
          waterIntake: '十分',
          dehydrationRisk: false,
          toiletRecords: [
            { time: '06:45', type: 'Urine', note: '自立' },
            { time: '09:30', type: 'Urine', note: '自立' },
            { time: '11:00', type: 'Feces', note: '自立' },
            { time: '14:30', type: 'Urine', note: '自立' },
            { time: '17:00', type: 'Urine', note: '自立' },
          ],
          bathDone: true,
          bathRefusal: undefined,
          oralCareDone: true,
          dressingDone: true,

          // C. 服薬
          medicationChecks: [],
          prnMedications: undefined,

          // D. 外出・外泊
          outingDestination: 'ショッピングモール',
          outingCompanion: 'スタッフ1名',
          plannedReturnTime: new Date('2026-03-12T15:30:00+09:00'),
          returnTime: new Date('2026-03-12T15:30:00+09:00'),
          returnCondition: '満足そうな様子で帰宅',
          overnightStay: false,
          overnightDest: undefined,

          // E. 拒否記録
          refusalRecords: undefined,

          // F. 支援区分タグ
          supportTags: ['外出', '買い物支援', '趣味活動'],
          planItemRefs: [],

          // G. 特記事項
          notes: '外出を楽しまれており、満足そうな様子でした。自分で服を選ぶことができました。帰宅後は塗り絵に集中して取り組みました。',

          // H. 時間帯別記録（30分刻み）
          timeSlotRecords: [
            { time: '09:00', water: '100ml', meal: '', leisure: '起床', oral: false, bath: false, condition: '良好', toilet: '排尿', sleep: '', notes: '' },
            { time: '09:30', water: '', meal: '', leisure: '', oral: true, bath: false, condition: '良好', toilet: '', sleep: '', notes: '口腔ケア' },
            { time: '10:00', water: '', meal: '', leisure: '', oral: false, bath: false, condition: '良好', toilet: '', sleep: '', notes: '' },
            { time: '10:30', water: '150ml', meal: '', leisure: 'TV視聴', oral: false, bath: false, condition: '良好', toilet: '', sleep: '', notes: '' },
            { time: '11:00', water: '', meal: '', leisure: 'TV視聴', oral: false, bath: false, condition: '良好', toilet: '排便', sleep: '', notes: '' },
            { time: '11:30', water: '', meal: '', leisure: '', oral: false, bath: false, condition: '良好', toilet: '', sleep: '', notes: '' },
            { time: '12:00', water: '150ml', meal: '全量', leisure: '', oral: false, bath: false, condition: '良好', toilet: '', sleep: '', notes: '昼食' },
            { time: '12:30', water: '', meal: '', leisure: '休憩', oral: false, bath: false, condition: '良好', toilet: '', sleep: '', notes: '' },
            { time: '13:00', water: '', meal: '', leisure: '外出準備', oral: false, bath: false, condition: '良好', toilet: '', sleep: '', notes: 'ショッピング' },
            { time: '13:30', water: '', meal: '', leisure: '買い物', oral: false, bath: false, condition: '良好', toilet: '', sleep: '', notes: '' },
            { time: '14:00', water: '', meal: '', leisure: '買い物', oral: false, bath: false, condition: '良好', toilet: '', sleep: '', notes: '' },
            { time: '14:30', water: '100ml', meal: '', leisure: '買い物', oral: false, bath: false, condition: '良好', toilet: '排尿', sleep: '', notes: '' },
            { time: '15:00', water: '', meal: '', leisure: '買い物', oral: false, bath: false, condition: '良好', toilet: '', sleep: '', notes: '' },
            { time: '15:30', water: '', meal: '', leisure: '帰宅', oral: false, bath: false, condition: '良好', toilet: '', sleep: '', notes: '' },
            { time: '16:00', water: '', meal: '', leisure: '塗り絵', oral: false, bath: false, condition: '良好', toilet: '', sleep: '', notes: '' },
            { time: '16:30', water: '', meal: '', leisure: '塗り絵', oral: false, bath: false, condition: '良好', toilet: '', sleep: '', notes: '' },
            { time: '17:00', water: '100ml', meal: '', leisure: '', oral: false, bath: false, condition: '良好', toilet: '排尿', sleep: '', notes: '' },
            { time: '17:30', water: '', meal: '', leisure: '', oral: true, bath: true, condition: '良好', toilet: '', sleep: '', notes: '入浴・口腔ケア' },
          ],
        },
      });

      console.log(`✅ ${sato.name}の記録を作成しました`);
    }

    console.log('\n✅ 業務日誌の利用者別記録サンプル投入完了！');
    console.log('\n📝 次のステップ:');
    console.log('   ブラウザをリロードして、利用者別記録を確認してください。');
  } catch (error) {
    console.error('❌ エラー:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedDailyLogEntries().catch((e) => {
  console.error('❌ シード失敗:', e);
  process.exit(1);
});
