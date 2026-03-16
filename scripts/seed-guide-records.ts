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

async function seedGuideRecords() {
  console.log('🚀 ガイド記録のサンプルデータ投入開始...\n');

  try {
    // 既存のユーザーと利用者を取得
    const staff1 = await prisma.user.findUnique({
      where: { email: 'staff1@test.com' },
    });
    const staff2 = await prisma.user.findUnique({
      where: { email: 'staff2@test.com' },
    });
    const yamada = await prisma.careRecipient.findUnique({
      where: { id: 'test-recipient-001' },
    });
    const sato = await prisma.careRecipient.findUnique({
      where: { id: 'test-recipient-002' },
    });

    if (!staff1 || !staff2 || !yamada || !sato) {
      throw new Error('必要なユーザーまたは利用者が見つかりません');
    }

    // ガイド記録サンプル1: 山田太郎 - 映画鑑賞（提出済み・レビュー済み）
    const guide1 = await prisma.guideRecord.create({
      data: {
        recipientId: yamada.id,
        userId: staff1.id,
        startedAt: new Date('2026-03-10T13:00:00+09:00'),
        endedAt: new Date('2026-03-10T17:30:00+09:00'),
        status: 'SUBMITTED',
        submittedAt: new Date('2026-03-10T18:00:00+09:00'),
        submittedBy: staff1.id,
        reviewedAt: new Date('2026-03-11T09:00:00+09:00'),
        reviewedBy: staff2.id,
        destination: '新宿ピカデリー（映画館）',
        purpose: '映画鑑賞（アクション映画）',
        assemblyLocation: '自宅前',
        dismissalLocation: '自宅前',
        route: [
          '自宅→新宿駅(電車)',
          '新宿駅→新宿ピカデリー(徒歩)',
        ],
        transport: ['電車', '徒歩'],
        supportContent:
          '映画館への移動支援。チケット購入の支援。上映中は隣で待機。途中トイレ休憩1回あり。',
        userCondition:
          '映画を楽しみにしており、積極的に行動。上映中も集中して鑑賞できていた。帰りも満足そうな様子。',
        cashHandled: true,
        handedAmount: 5000,
        returnedAmount: 1800,
        cashNote: '映画チケット代、飲み物代、電車往復代を使用',
        transportExpenses: [
          { item: '電車往復', amount: 800 },
        ],
        foodExpenses: [
          { item: '映画館の飲み物', amount: 400 },
        ],
        otherExpenses: [
          { item: '映画チケット', amount: 2000 },
        ],
        staffMealExpense: 0,
        mealContent: undefined,
        mealAmount: undefined,
        incidents: undefined,
        notes: '次回も映画鑑賞を希望されている。',
      },
    });

    // 自動生成されたServiceRecordを確認
    console.log('✅ ガイド記録1作成: 山田太郎 - 映画鑑賞');

    // ガイド記録サンプル2: 佐藤花子 - ショッピング（提出済み）
    const guide2 = await prisma.guideRecord.create({
      data: {
        recipientId: sato.id,
        userId: staff2.id,
        startedAt: new Date('2026-03-11T10:00:00+09:00'),
        endedAt: new Date('2026-03-11T14:30:00+09:00'),
        status: 'SUBMITTED',
        submittedAt: new Date('2026-03-11T15:00:00+09:00'),
        submittedBy: staff2.id,
        destination: '渋谷マルイ（ショッピングモール）',
        purpose: '衣料品購入、昼食',
        assemblyLocation: '事業所前',
        dismissalLocation: '事業所前',
        route: [
          '事業所→渋谷駅(バス)',
          '渋谷駅→渋谷マルイ(徒歩)',
        ],
        transport: ['バス', '徒歩'],
        supportContent:
          '服の選択・試着の支援。レジでの支払い支援。昼食場所の選択支援。',
        userCondition:
          '服選びに時間をかけ、自分で気に入ったものを選択できていた。昼食も美味しそうに食べていた。',
        cashHandled: true,
        handedAmount: 8000,
        returnedAmount: 2300,
        cashNote: '衣料品代、昼食代、バス往復代を使用',
        transportExpenses: [
          { item: 'バス往復', amount: 440 },
        ],
        foodExpenses: [
          { item: 'レストランでの昼食', amount: 1800 },
        ],
        otherExpenses: [
          { item: 'Tシャツ購入', amount: 3460 },
        ],
        staffMealExpense: 1000,
        mealContent: 'パスタランチ',
        mealAmount: '全量',
        incidents: undefined,
        notes: '次回は靴を見に行きたいとのこと。',
      },
    });

    console.log('✅ ガイド記録2作成: 佐藤花子 - ショッピング');

    // ガイド記録サンプル3: 山田太郎 - 図書館（下書き）
    const guide3 = await prisma.guideRecord.create({
      data: {
        recipientId: yamada.id,
        userId: staff1.id,
        startedAt: new Date('2026-03-12T14:00:00+09:00'),
        endedAt: new Date('2026-03-12T16:00:00+09:00'),
        status: 'DRAFT',
        destination: '区立図書館',
        purpose: '本の閲覧・借り出し',
        assemblyLocation: '自宅前',
        dismissalLocation: '自宅前',
        route: [
          '自宅→図書館(徒歩)',
        ],
        transport: ['徒歩'],
        supportContent: '図書館までの移動支援。本の選択支援。',
        userCondition: '落ち着いて本を選んでいた。',
        cashHandled: false,
        handedAmount: undefined,
        returnedAmount: undefined,
        cashNote: undefined,
        transportExpenses: undefined,
        foodExpenses: undefined,
        otherExpenses: undefined,
        staffMealExpense: undefined,
        mealContent: undefined,
        mealAmount: undefined,
        incidents: undefined,
        notes: '漫画を3冊借りた。',
      },
    });

    console.log('✅ ガイド記録3作成: 山田太郎 - 図書館（下書き）');

    // ガイド記録サンプル4: 佐藤花子 - 公園散歩（提出済み）
    const guide4 = await prisma.guideRecord.create({
      data: {
        recipientId: sato.id,
        userId: staff1.id,
        startedAt: new Date('2026-03-13T10:30:00+09:00'),
        endedAt: new Date('2026-03-13T12:00:00+09:00'),
        status: 'SUBMITTED',
        submittedAt: new Date('2026-03-13T12:30:00+09:00'),
        submittedBy: staff1.id,
        destination: '代々木公園',
        purpose: '散歩・気分転換',
        assemblyLocation: '事業所前',
        dismissalLocation: '事業所前',
        route: [
          '事業所→代々木公園(徒歩)',
        ],
        transport: ['徒歩'],
        supportContent: '公園での散歩支援。ベンチで休憩。',
        userCondition:
          '天気が良く、リラックスした様子。花を見て喜んでいた。',
        cashHandled: true,
        handedAmount: 500,
        returnedAmount: 300,
        cashNote: '自動販売機で飲み物購入',
        transportExpenses: undefined,
        foodExpenses: [
          { item: 'ペットボトル飲料', amount: 200 },
        ],
        otherExpenses: undefined,
        staffMealExpense: undefined,
        mealContent: undefined,
        mealAmount: undefined,
        incidents: undefined,
        notes: '定期的な散歩が良い影響を与えている。',
      },
    });

    console.log('✅ ガイド記録4作成: 佐藤花子 - 公園散歩');

    // ServiceRecordを手動で作成（submit処理と同等の処理）
    console.log('\n📝 ServiceRecordを生成中...');

    const guideRecordsToProcess = [
      { guide: guide1, name: '山田太郎 - 映画鑑賞' },
      { guide: guide2, name: '佐藤花子 - ショッピング' },
      { guide: guide4, name: '佐藤花子 - 公園散歩' },
    ];

    for (const { guide, name } of guideRecordsToProcess) {
      if (guide.endedAt) {
        const durationMinutes = Math.round(
          (guide.endedAt.getTime() - guide.startedAt.getTime()) / (1000 * 60)
        );

        await prisma.serviceRecord.create({
          data: {
            recipientId: guide.recipientId,
            userId: guide.userId,
            serviceType: 'BehaviorSupport',
            serviceDate: guide.startedAt,
            startTime: guide.startedAt,
            endTime: guide.endedAt,
            duration: durationMinutes,
            destination: guide.destination,
            purpose: guide.purpose,
            serviceDetail: guide.supportContent || '',
            userCondition: guide.userCondition,
            incidents: guide.notes,
            timeBand: 'DAYTIME',
            appliedRuleVersion: null,
            guideRecordId: guide.id,
          },
        });

        console.log(`  ✅ ${name}: ${durationMinutes}分`);
      }
    }

    // 自動生成されたServiceRecordを確認
    const serviceRecords = await prisma.serviceRecord.findMany({
      where: {
        guideRecordId: {
          in: [guide1.id, guide2.id, guide3.id, guide4.id],
        },
      },
      include: {
        recipient: {
          select: { name: true },
        },
        user: {
          select: { name: true },
        },
      },
    });

    console.log('\n📋 自動生成されたサービス提供実績:');
    serviceRecords.forEach((sr) => {
      console.log(
        `  - ${sr.recipient.name} / ${sr.serviceType} / ${new Date(sr.serviceDate).toLocaleDateString('ja-JP')} / ${sr.duration}分`
      );
    });

    console.log('\n✅ ガイド記録のサンプルデータ投入完了！');
    console.log(`\n📝 作成データ:`);
    console.log(`   - ガイド記録: 4件`);
    console.log(`   - サービス提供実績: ${serviceRecords.length}件（自動生成）`);
    console.log(`   - 状態: DRAFT 1件、SUBMITTED 3件（うちレビュー済み1件）`);
  } catch (error) {
    console.error('❌ エラー:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedGuideRecords().catch((e) => {
  console.error('❌ シード失敗:', e);
  process.exit(1);
});
