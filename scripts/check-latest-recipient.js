import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not found');
  process.exit(1);
}

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function checkLatest() {
  try {
    console.log('=== Checking Latest Imported Recipient ===\n');

    // Get the most recent recipient (ordered by createdAt desc)
    const recipient = await prisma.careRecipient.findFirst({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' }
    });

    if (!recipient) {
      console.log('No recipients found in database');
      return;
    }

    console.log('=== Basic Info ===');
    console.log('ID:', recipient.id);
    console.log('Name:', recipient.name);
    console.log('Name Kana:', recipient.nameKana);
    console.log('Birth Date:', recipient.birthDate);
    console.log('Home Address:', recipient.homeAddress);
    console.log('Has Mobile Phone:', recipient.hasMobilePhone);
    console.log('Mobile Phone:', recipient.mobilePhone);
    console.log('Created At:', recipient.createdAt);

    console.log('\n=== Support Profile - Health Info ===');
    console.log('Disability Name (障害名):', recipient.disabilityName);
    console.log('Disease Status (疾病状況):', recipient.diseaseStatus);
    console.log('Has Seizures (発作あり):', recipient.hasSeizures);
    console.log('Medication (服薬):', recipient.medication);
    console.log('Health Note (健康留意点):', recipient.healthNote);

    console.log('\n=== Support Profile - Food Info ===');
    console.log('Favorite Foods (好きな食べ物):', recipient.favoriteFoods);
    console.log('Disliked Foods (嫌いな食べ物):', recipient.dislikedFoods);
    console.log('Has Allergy (アレルギー有無):', recipient.hasAllergy);
    console.log('Allergy Note (アレルギー詳細):', recipient.allergyNote);

    console.log('\n=== Support Profile - Mobility Info ===');
    console.log('Mobility Method (移動手段):', recipient.mobilityMethod);
    console.log('Mobility Assist (移動介助):', recipient.mobilityAssist);
    console.log('Mobility Note (移動留意点):', recipient.mobilityNote);

    console.log('\n=== Support Profile - Communication Info ===');
    console.log('Comm Verbal (会話表現):', recipient.commVerbal);
    console.log('Comm Gesture (ジェスチャー):', recipient.commGesture);
    console.log('Comm Note (留意点):', recipient.commNote);

    console.log('\n=== Field Status Summary ===');
    const supportProfileFields = {
      'disabilityName': recipient.disabilityName,
      'diseaseStatus': recipient.diseaseStatus,
      'hasSeizures': recipient.hasSeizures,
      'medication': recipient.medication,
      'healthNote': recipient.healthNote,
      'favoriteFoods': recipient.favoriteFoods,
      'dislikedFoods': recipient.dislikedFoods,
      'hasAllergy': recipient.hasAllergy,
      'allergyNote': recipient.allergyNote,
      'mobilityMethod': recipient.mobilityMethod,
      'mobilityAssist': recipient.mobilityAssist,
      'mobilityNote': recipient.mobilityNote,
      'commVerbal': recipient.commVerbal,
      'commGesture': recipient.commGesture,
      'commNote': recipient.commNote,
    };

    let filledCount = 0;
    let emptyCount = 0;

    Object.entries(supportProfileFields).forEach(([field, value]) => {
      let status = '❌ EMPTY';
      let isFilled = false;

      if (value !== null && value !== undefined) {
        if (Array.isArray(value)) {
          isFilled = value.length > 0;
          status = isFilled ? `✅ ${JSON.stringify(value)}` : '⚠️  EMPTY ARRAY';
        } else if (typeof value === 'boolean') {
          isFilled = true; // Booleans are always considered filled
          status = `✅ ${value}`;
        } else if (typeof value === 'string') {
          isFilled = value !== '';
          status = isFilled ? `✅ "${value}"` : '⚠️  EMPTY STRING';
        } else {
          isFilled = true;
          status = `✅ ${value}`;
        }
      }

      if (isFilled) filledCount++;
      else emptyCount++;

      console.log(`  ${field}: ${status}`);
    });

    console.log(`\nTotal Support Profile Fields: ${Object.keys(supportProfileFields).length}`);
    console.log(`Filled: ${filledCount}`);
    console.log(`Empty: ${emptyCount}`);

    if (filledCount === 0) {
      console.log('\n⚠️  WARNING: ALL support profile fields are empty!');
      console.log('This indicates the CSV import did NOT save support profile data.');
    } else if (filledCount < Object.keys(supportProfileFields).length / 2) {
      console.log('\n⚠️  WARNING: Most support profile fields are empty.');
    } else {
      console.log('\n✅ SUCCESS: Support profile data was imported correctly!');
    }

  } catch (error) {
    console.error('Error:', error);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

checkLatest();
