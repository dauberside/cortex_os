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

async function seedNightShiftEntries() {
  console.log('🌙 夜勤の利用者別記録サンプル投入開始...\n');

  try {
    // 2026/3/14 夜勤の業務日誌を取得
    const targetDate = new Date('2026-03-14T00:00:00+09:00');
    const dailyLog = await prisma.dailyLog.findFirst({
      where: {
        logDate: targetDate,
        shift: 'Night',
      },
    });

    if (!dailyLog) {
      throw new Error('2026/3/14 夜勤の業務日誌が見つかりません。先に create-march14-night-shift.ts を実行してください。');
    }

    console.log(`✅ 業務日誌取得: ${dailyLog.logDate.toLocaleDateString('ja-JP')} ${dailyLog.shift}`);

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

    // 山田太郎の夜勤記録を作成
    const existingYamada = await prisma.dailyLogEntry.findFirst({
      where: {
        dailyLogId: dailyLog.id,
        recipientId: yamada.id,
      },
    });

    if (existingYamada && existingYamada.notes) {
      console.log(`✓ ${yamada.name}の記録は既に入力済みです`);
    } else {
      await prisma.dailyLogEntry.update({
        where: { id: existingYamada!.id },
        data: {
          // A. バイタル・状態
          temperature: 36.3,
          bloodPressure: '118/76',
          spo2: 98,
          vitalAlert: false,
          sleepTime: new Date('2026-03-14T22:00:00+09:00'),
          wakeTime: new Date('2026-03-15T06:30:00+09:00'),
          nightWaking: '1回 (02:30頃、トイレ)',
          behaviorNote: '夜間は落ち着いて就寝されていました。',

          // B. 生活支援
          mealAmount: '全量',
          mealTexture: '普通食',
          swallowNote: undefined,
          waterIntake: '十分',
          dehydrationRisk: false,
          toiletRecords: [
            { time: '16:30', type: 'Urine', note: '自立' },
            { time: '19:00', type: 'Feces', note: '自立' },
            { time: '21:30', type: 'Urine', note: '自立' },
            { time: '02:30', type: 'Urine', note: '夜間覚醒' },
            { time: '07:00', type: 'Urine', note: '自立' },
            { time: '09:00', type: 'Feces', note: '自立' },
          ],
          bathDone: false,
          bathRefusal: undefined,
          oralCareDone: true,
          dressingDone: true,

          // C. 服薬
          medicationChecks: [],
          prnMedications: undefined,

          // D. 外出・外泊
          outingDestination: undefined,
          outingCompanion: undefined,
          plannedReturnTime: undefined,
          returnTime: undefined,
          returnCondition: undefined,
          overnightStay: false,
          overnightDest: undefined,

          // E. 拒否記録
          refusalRecords: undefined,

          // F. 支援区分タグ
          supportTags: ['生活支援', '夜間見守り'],
          planItemRefs: [],

          // G. 特記事項
          notes: '夜間は落ち着いて就寝。一度起床されましたが、すぐに再入眠されました。朝食も全量摂取されています。',

          // H. 時間帯別記録（30分刻み・夜勤は16:00-翌10:00）
          timeSlotRecords: [
            { time: '16:00', water: '', meal: '', leisure: '引継ぎ', oral: false, bath: false, condition: '良好', toilet: '', sleep: '', notes: '' },
            { time: '16:30', water: '100ml', meal: '', leisure: '', oral: false, bath: false, condition: '良好', toilet: '排尿', sleep: '', notes: '' },
            { time: '17:00', water: '', meal: '', leisure: 'TV視聴', oral: false, bath: false, condition: '良好', toilet: '', sleep: '', notes: '' },
            { time: '17:30', water: '', meal: '', leisure: 'TV視聴', oral: false, bath: false, condition: '良好', toilet: '', sleep: '', notes: '' },
            { time: '18:00', water: '150ml', meal: '全量', leisure: '', oral: false, bath: false, condition: '良好', toilet: '', sleep: '', notes: '夕食' },
            { time: '18:30', water: '', meal: '', leisure: '休憩', oral: false, bath: false, condition: '良好', toilet: '', sleep: '', notes: '' },
            { time: '19:00', water: '', meal: '', leisure: '', oral: false, bath: false, condition: '良好', toilet: '排便', sleep: '', notes: '' },
            { time: '19:30', water: '100ml', meal: '', leisure: 'TV視聴', oral: false, bath: false, condition: '良好', toilet: '', sleep: '', notes: '' },
            { time: '20:00', water: '', meal: '', leisure: 'TV視聴', oral: false, bath: false, condition: '良好', toilet: '', sleep: '', notes: '' },
            { time: '20:30', water: '', meal: '', leisure: '', oral: true, bath: false, condition: '良好', toilet: '', sleep: '', notes: '口腔ケア' },
            { time: '21:00', water: '', meal: '', leisure: '就寝準備', oral: false, bath: false, condition: '良好', toilet: '', sleep: '', notes: '' },
            { time: '21:30', water: '', meal: '', leisure: '', oral: false, bath: false, condition: '良好', toilet: '排尿', sleep: '', notes: '' },
            { time: '22:00', water: '', meal: '', leisure: '', oral: false, bath: false, condition: '良好', toilet: '', sleep: '就寝', notes: '' },
            { time: '22:30', water: '', meal: '', leisure: '', oral: false, bath: false, condition: '良好', toilet: '', sleep: '睡眠中', notes: '' },
            { time: '23:00', water: '', meal: '', leisure: '', oral: false, bath: false, condition: '良好', toilet: '', sleep: '睡眠中', notes: '' },
            { time: '23:30', water: '', meal: '', leisure: '', oral: false, bath: false, condition: '良好', toilet: '', sleep: '睡眠中', notes: '' },
            { time: '00:00', water: '', meal: '', leisure: '', oral: false, bath: false, condition: '良好', toilet: '', sleep: '睡眠中', notes: '巡回' },
            { time: '00:30', water: '', meal: '', leisure: '', oral: false, bath: false, condition: '良好', toilet: '', sleep: '睡眠中', notes: '' },
            { time: '01:00', water: '', meal: '', leisure: '', oral: false, bath: false, condition: '良好', toilet: '', sleep: '睡眠中', notes: '' },
            { time: '01:30', water: '', meal: '', leisure: '', oral: false, bath: false, condition: '良好', toilet: '', sleep: '睡眠中', notes: '' },
            { time: '02:00', water: '', meal: '', leisure: '', oral: false, bath: false, condition: '良好', toilet: '', sleep: '睡眠中', notes: '巡回' },
            { time: '02:30', water: '', meal: '', leisure: '', oral: false, bath: false, condition: '良好', toilet: '排尿', sleep: '覚醒', notes: 'トイレ' },
            { time: '03:00', water: '', meal: '', leisure: '', oral: false, bath: false, condition: '良好', toilet: '', sleep: '再入眠', notes: '' },
            { time: '03:30', water: '', meal: '', leisure: '', oral: false, bath: false, condition: '良好', toilet: '', sleep: '睡眠中', notes: '' },
            { time: '04:00', water: '', meal: '', leisure: '', oral: false, bath: false, condition: '良好', toilet: '', sleep: '睡眠中', notes: '巡回' },
            { time: '04:30', water: '', meal: '', leisure: '', oral: false, bath: false, condition: '良好', toilet: '', sleep: '睡眠中', notes: '' },
            { time: '05:00', water: '', meal: '', leisure: '', oral: false, bath: false, condition: '良好', toilet: '', sleep: '睡眠中', notes: '' },
            { time: '05:30', water: '', meal: '', leisure: '', oral: false, bath: false, condition: '良好', toilet: '', sleep: '睡眠中', notes: '' },
            { time: '06:00', water: '', meal: '', leisure: '', oral: false, bath: false, condition: '良好', toilet: '', sleep: '睡眠中', notes: '巡回' },
            { time: '06:30', water: '', meal: '', leisure: '起床', oral: false, bath: false, condition: '良好', toilet: '', sleep: '覚醒', notes: '' },
            { time: '07:00', water: '100ml', meal: '', leisure: '', oral: true, bath: false, condition: '良好', toilet: '排尿', sleep: '', notes: '口腔ケア' },
            { time: '07:30', water: '', meal: '', leisure: '', oral: false, bath: false, condition: '良好', toilet: '', sleep: '', notes: '' },
            { time: '08:00', water: '150ml', meal: '全量', leisure: '', oral: false, bath: false, condition: '良好', toilet: '', sleep: '', notes: '朝食' },
            { time: '08:30', water: '', meal: '', leisure: '休憩', oral: false, bath: false, condition: '良好', toilet: '', sleep: '', notes: '' },
            { time: '09:00', water: '', meal: '', leisure: '', oral: false, bath: false, condition: '良好', toilet: '排便', sleep: '', notes: '' },
            { time: '09:30', water: '100ml', meal: '', leisure: 'TV視聴', oral: false, bath: false, condition: '良好', toilet: '', sleep: '', notes: '' },
            { time: '10:00', water: '', meal: '', leisure: '', oral: false, bath: false, condition: '良好', toilet: '', sleep: '', notes: '引継ぎ' },
          ],
        },
      });

      console.log(`✅ ${yamada.name}の夜勤記録を作成しました`);
    }

    // 佐藤花子の夜勤記録を作成
    const existingSato = await prisma.dailyLogEntry.findFirst({
      where: {
        dailyLogId: dailyLog.id,
        recipientId: sato.id,
      },
    });

    if (existingSato && existingSato.notes) {
      console.log(`✓ ${sato.name}の記録は既に入力済みです`);
    } else {
      await prisma.dailyLogEntry.update({
        where: { id: existingSato!.id },
        data: {
          // A. バイタル・状態
          temperature: 36.6,
          bloodPressure: '120/78',
          spo2: 99,
          vitalAlert: false,
          sleepTime: new Date('2026-03-14T22:30:00+09:00'),
          wakeTime: new Date('2026-03-15T06:00:00+09:00'),
          nightWaking: undefined,
          behaviorNote: 'ぐっすり眠られていました。',

          // B. 生活支援
          mealAmount: '全量',
          mealTexture: '普通食',
          swallowNote: undefined,
          waterIntake: '十分',
          dehydrationRisk: false,
          toiletRecords: [
            { time: '17:00', type: 'Urine', note: '自立' },
            { time: '18:30', type: 'Feces', note: '自立' },
            { time: '21:00', type: 'Urine', note: '自立' },
            { time: '06:30', type: 'Urine', note: '自立' },
            { time: '08:30', type: 'Feces', note: '自立' },
          ],
          bathDone: false,
          bathRefusal: undefined,
          oralCareDone: true,
          dressingDone: true,

          // C. 服薬
          medicationChecks: [],
          prnMedications: undefined,

          // D. 外出・外泊
          outingDestination: undefined,
          outingCompanion: undefined,
          plannedReturnTime: undefined,
          returnTime: undefined,
          returnCondition: undefined,
          overnightStay: false,
          overnightDest: undefined,

          // E. 拒否記録
          refusalRecords: undefined,

          // F. 支援区分タグ
          supportTags: ['生活支援', '夜間見守り'],
          planItemRefs: [],

          // G. 特記事項
          notes: '夜間は一度も起きることなく、ぐっすり眠られていました。朝食も全量摂取され、笑顔が見られました。',

          // H. 時間帯別記録（30分刻み・夜勤は16:00-翌10:00）
          timeSlotRecords: [
            { time: '16:00', water: '', meal: '', leisure: '引継ぎ', oral: false, bath: false, condition: '良好', toilet: '', sleep: '', notes: '' },
            { time: '16:30', water: '100ml', meal: '', leisure: '', oral: false, bath: false, condition: '良好', toilet: '', sleep: '', notes: '' },
            { time: '17:00', water: '', meal: '', leisure: '読書', oral: false, bath: false, condition: '良好', toilet: '排尿', sleep: '', notes: '' },
            { time: '17:30', water: '', meal: '', leisure: '読書', oral: false, bath: false, condition: '良好', toilet: '', sleep: '', notes: '' },
            { time: '18:00', water: '150ml', meal: '全量', leisure: '', oral: false, bath: false, condition: '良好', toilet: '', sleep: '', notes: '夕食' },
            { time: '18:30', water: '', meal: '', leisure: '', oral: false, bath: false, condition: '良好', toilet: '排便', sleep: '', notes: '' },
            { time: '19:00', water: '', meal: '', leisure: 'TV視聴', oral: false, bath: false, condition: '良好', toilet: '', sleep: '', notes: '' },
            { time: '19:30', water: '100ml', meal: '', leisure: 'TV視聴', oral: false, bath: false, condition: '良好', toilet: '', sleep: '', notes: '' },
            { time: '20:00', water: '', meal: '', leisure: 'TV視聴', oral: false, bath: false, condition: '良好', toilet: '', sleep: '', notes: '' },
            { time: '20:30', water: '', meal: '', leisure: '', oral: true, bath: false, condition: '良好', toilet: '', sleep: '', notes: '口腔ケア' },
            { time: '21:00', water: '', meal: '', leisure: '就寝準備', oral: false, bath: false, condition: '良好', toilet: '排尿', sleep: '', notes: '' },
            { time: '21:30', water: '', meal: '', leisure: '', oral: false, bath: false, condition: '良好', toilet: '', sleep: '', notes: '' },
            { time: '22:00', water: '', meal: '', leisure: '', oral: false, bath: false, condition: '良好', toilet: '', sleep: '', notes: '' },
            { time: '22:30', water: '', meal: '', leisure: '', oral: false, bath: false, condition: '良好', toilet: '', sleep: '就寝', notes: '' },
            { time: '23:00', water: '', meal: '', leisure: '', oral: false, bath: false, condition: '良好', toilet: '', sleep: '睡眠中', notes: '' },
            { time: '23:30', water: '', meal: '', leisure: '', oral: false, bath: false, condition: '良好', toilet: '', sleep: '睡眠中', notes: '' },
            { time: '00:00', water: '', meal: '', leisure: '', oral: false, bath: false, condition: '良好', toilet: '', sleep: '睡眠中', notes: '巡回' },
            { time: '00:30', water: '', meal: '', leisure: '', oral: false, bath: false, condition: '良好', toilet: '', sleep: '睡眠中', notes: '' },
            { time: '01:00', water: '', meal: '', leisure: '', oral: false, bath: false, condition: '良好', toilet: '', sleep: '睡眠中', notes: '' },
            { time: '01:30', water: '', meal: '', leisure: '', oral: false, bath: false, condition: '良好', toilet: '', sleep: '睡眠中', notes: '' },
            { time: '02:00', water: '', meal: '', leisure: '', oral: false, bath: false, condition: '良好', toilet: '', sleep: '睡眠中', notes: '巡回' },
            { time: '02:30', water: '', meal: '', leisure: '', oral: false, bath: false, condition: '良好', toilet: '', sleep: '睡眠中', notes: '' },
            { time: '03:00', water: '', meal: '', leisure: '', oral: false, bath: false, condition: '良好', toilet: '', sleep: '睡眠中', notes: '' },
            { time: '03:30', water: '', meal: '', leisure: '', oral: false, bath: false, condition: '良好', toilet: '', sleep: '睡眠中', notes: '' },
            { time: '04:00', water: '', meal: '', leisure: '', oral: false, bath: false, condition: '良好', toilet: '', sleep: '睡眠中', notes: '巡回' },
            { time: '04:30', water: '', meal: '', leisure: '', oral: false, bath: false, condition: '良好', toilet: '', sleep: '睡眠中', notes: '' },
            { time: '05:00', water: '', meal: '', leisure: '', oral: false, bath: false, condition: '良好', toilet: '', sleep: '睡眠中', notes: '' },
            { time: '05:30', water: '', meal: '', leisure: '', oral: false, bath: false, condition: '良好', toilet: '', sleep: '睡眠中', notes: '' },
            { time: '06:00', water: '', meal: '', leisure: '起床', oral: false, bath: false, condition: '良好', toilet: '', sleep: '覚醒', notes: '' },
            { time: '06:30', water: '100ml', meal: '', leisure: '', oral: true, bath: false, condition: '良好', toilet: '排尿', sleep: '', notes: '口腔ケア' },
            { time: '07:00', water: '', meal: '', leisure: '', oral: false, bath: false, condition: '良好', toilet: '', sleep: '', notes: '' },
            { time: '07:30', water: '', meal: '', leisure: 'TV視聴', oral: false, bath: false, condition: '良好', toilet: '', sleep: '', notes: '' },
            { time: '08:00', water: '150ml', meal: '全量', leisure: '', oral: false, bath: false, condition: '良好', toilet: '', sleep: '', notes: '朝食' },
            { time: '08:30', water: '', meal: '', leisure: '', oral: false, bath: false, condition: '良好', toilet: '排便', sleep: '', notes: '' },
            { time: '09:00', water: '', meal: '', leisure: '休憩', oral: false, bath: false, condition: '良好', toilet: '', sleep: '', notes: '' },
            { time: '09:30', water: '100ml', meal: '', leisure: 'TV視聴', oral: false, bath: false, condition: '良好', toilet: '', sleep: '', notes: '' },
            { time: '10:00', water: '', meal: '', leisure: '', oral: false, bath: false, condition: '良好', toilet: '', sleep: '', notes: '引継ぎ' },
          ],
        },
      });

      console.log(`✅ ${sato.name}の夜勤記録を作成しました`);
    }

    console.log('\n✅ 夜勤の利用者別記録サンプル投入完了！');
  } catch (error) {
    console.error('❌ エラー:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedNightShiftEntries().catch((e) => {
  console.error('❌ シード失敗:', e);
  process.exit(1);
});
