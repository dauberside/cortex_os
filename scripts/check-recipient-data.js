import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables before initializing Prisma
dotenv.config({ path: join(__dirname, '..', '.env') });

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not found in environment variables');
  console.error('Loaded from:', join(__dirname, '..', '.env'));
  process.exit(1);
}

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function check() {
  try {
    const recipient = await prisma.careRecipient.findUnique({
      where: { id: 'cmm48c1ba0002x08o4f2qrrt9' }
    });

    if (recipient) {
      console.log('=== 基本情報 ===');
      console.log('ID:', recipient.id);
      console.log('名前:', recipient.name);
      console.log('通所先:', recipient.school);
      console.log('自宅住所:', recipient.homeAddress);
      console.log('本人携帯あり:', recipient.hasMobilePhone);
      console.log('本人携帯番号:', recipient.mobilePhone);

      console.log('\n=== 健康情報 ===');
      console.log('障害名:', recipient.disabilityName);
      console.log('疾病状況:', recipient.diseaseStatus);
      console.log('発作あり:', recipient.hasSeizures);
      console.log('服薬:', recipient.medication);
      console.log('健康留意点:', recipient.healthNote);

      console.log('\n=== 食事情報 ===');
      console.log('好きな食べ物:', recipient.favoriteFoods);
      console.log('嫌いな食べ物:', recipient.dislikedFoods);
      console.log('アレルギー有無:', recipient.hasAllergy);
      console.log('アレルギー詳細:', recipient.allergyNote);

      console.log('\n=== 移動情報 ===');
      console.log('移動手段:', recipient.mobilityMethod);
      console.log('移動介助:', recipient.mobilityAssist);
      console.log('移動留意点:', recipient.mobilityNote);

      console.log('\n=== コミュニケーション ===');
      console.log('会話表現:', recipient.commVerbal);
      console.log('ジェスチャー:', recipient.commGesture);
      console.log('留意点:', recipient.commNote);

      console.log('\n=== 総フィールド数 ===');
      const nonNullFields = Object.entries(recipient).filter(([key, value]) => value !== null && value !== undefined && key !== 'id' && key !== 'createdAt' && key !== 'updatedAt' && key !== 'deletedAt').length;
      console.log('null以外のフィールド数:', nonNullFields);

      console.log('\n=== 全データ（JSON） ===');
      console.log(JSON.stringify(recipient, null, 2));
    } else {
      console.log('指定されたIDの利用者が見つかりません: cmm48c1ba0002x08o4f2qrrt9');
    }
  } catch (error) {
    console.error('エラー:', error);
  } finally {
    await prisma.$disconnect();
  }
}

check();
