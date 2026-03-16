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

async function setupUnitDailyLog() {
  console.log('🚀 ユニット業務日誌のセットアップ開始...\n');

  try {
    // 既存のユニット、スタッフ、利用者を取得
    const staff1 = await prisma.user.findUnique({
      where: { email: 'staff1@test.com' },
    });
    const staff2 = await prisma.user.findUnique({
      where: { email: 'staff2@test.com' },
    });
    const manager = await prisma.user.findUnique({
      where: { email: 'manager@test.com' },
    });

    if (!staff1 || !staff2 || !manager) {
      throw new Error('必要なスタッフが見つかりません');
    }

    console.log('✅ スタッフ確認完了');

    // ユニットを作成または取得
    let unit = await prisma.unit.findFirst({
      where: { name: 'テストユニット' },
    });

    if (!unit) {
      unit = await prisma.unit.create({
        data: {
          name: 'テストユニット',
          serviceType: 'GH', // グループホーム
          description: '業務日誌テスト用ユニット',
        },
      });
      console.log('✅ ユニット作成: テストユニット');
    } else {
      console.log('✅ 既存ユニット使用: テストユニット');
    }

    // スタッフをユニットに追加
    const existingStaff = await prisma.unitStaff.findMany({
      where: { unitId: unit.id },
    });

    const staffIds = [staff1.id, staff2.id, manager.id];
    for (const staffId of staffIds) {
      const exists = existingStaff.find((us) => us.userId === staffId);
      if (!exists) {
        await prisma.unitStaff.create({
          data: {
            unitId: unit.id,
            userId: staffId,
            role: 'primary', // 固定担当
          },
        });
      }
    }

    console.log('✅ スタッフをユニットに追加完了');

    // 利用者を取得
    const yamada = await prisma.careRecipient.findUnique({
      where: { id: 'test-recipient-001' },
    });
    const sato = await prisma.careRecipient.findUnique({
      where: { id: 'test-recipient-002' },
    });

    if (!yamada || !sato) {
      throw new Error('必要な利用者が見つかりません');
    }

    // 利用者をユニットに追加
    const existingRecipients = await prisma.unitRecipient.findMany({
      where: { unitId: unit.id },
    });

    for (const recipient of [yamada, sato]) {
      const exists = existingRecipients.find((ur) => ur.recipientId === recipient.id);
      if (!exists) {
        await prisma.unitRecipient.create({
          data: {
            unitId: unit.id,
            recipientId: recipient.id,
          },
        });
        console.log(`✅ 利用者追加: ${recipient.name}`);
      } else {
        console.log(`✓ 既に登録済み: ${recipient.name}`);
      }
    }

    // 業務日誌のサンプルデータを作成（今日の日付で）
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const shiftStart = new Date(today);
    shiftStart.setHours(9, 0, 0, 0); // 9:00開始

    const shiftEnd = new Date(today);
    shiftEnd.setHours(18, 0, 0, 0); // 18:00終了

    const existingLog = await prisma.dailyLog.findFirst({
      where: {
        unitId: unit.id,
        logDate: today,
        shift: 'Day',
      },
    });

    if (existingLog) {
      console.log('\n✓ 本日の業務日誌（日勤）は既に存在します');
      console.log(`   ID: ${existingLog.id}`);
      console.log(`   日付: ${existingLog.logDate.toLocaleDateString('ja-JP')}`);
    } else {
      const dailyLog = await prisma.dailyLog.create({
        data: {
          unitId: unit.id,
          logDate: today,
          shift: 'Day',
          shiftStart: shiftStart,
          shiftEnd: shiftEnd,
          staffId: staff1.id,
          staffRole: 'リーダー',
          residentSummary: {
            inHouse: 2,
            outing: 0,
            overnight: 0,
            hospital: 0,
            homeLeave: 0,
          },
          majorEvent: false,
          handover: '本日の業務は順調に進行しました。特記事項なし。',
        },
      });

      console.log('\n✅ 業務日誌サンプル作成完了');
      console.log(`   ID: ${dailyLog.id}`);
      console.log(`   日付: ${dailyLog.logDate.toLocaleDateString('ja-JP')}`);
      console.log(`   シフト: ${dailyLog.shift}`);
    }

    console.log('\n📋 セットアップ完了情報:');
    console.log(`   ユニットID: ${unit.id}`);
    console.log(`   ユニット名: ${unit.name}`);
    console.log(`   所属スタッフ: 3名`);
    console.log(`   登録利用者: 2名`);

    console.log('\n✅ ユニット業務日誌のセットアップ完了！');
    console.log(`\n📝 次のステップ:`);
    console.log(`   1. ブラウザで https://localhost:3443/units/${unit.id} にアクセス`);
    console.log(`   2. 業務日誌タブをクリック`);
    console.log(`   3. 「新しい業務日誌を作成」ボタンをクリック`);
  } catch (error) {
    console.error('❌ エラー:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

setupUnitDailyLog().catch((e) => {
  console.error('❌ セットアップ失敗:', e);
  process.exit(1);
});
