const fs = require('fs');
const { Client } = require('pg');
require('dotenv').config();

/**
 * Phase 2マイグレーション実行スクリプト
 * フェイスシート拡張フィールド（27フィールド）を本番DBに追加
 */
async function runPhase2Migration() {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ No DATABASE_URL or DIRECT_URL found');
    process.exit(1);
  }

  console.log('🔗 Connecting to Neon database...');

  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected successfully\n');

    // マイグレーション実行前の確認
    console.log('📊 Checking current care_recipients columns...');
    const beforeCount = await client.query(`
      SELECT COUNT(*) as count
      FROM information_schema.columns
      WHERE table_name = 'care_recipients'
    `);
    console.log(`Current column count: ${beforeCount.rows[0].count}`);

    // マイグレーションSQL読み込み
    const migrationPath = './prisma/migrations/20260302121008_add_face_sheet_fields/migration.sql';

    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Migration file not found: ${migrationPath}`);
      process.exit(1);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('\n🚀 Executing Phase 2 migration (27 fields)...');
    console.log('Fields to be added:');
    console.log('  - documentCreatedDate, organizationName, documentHeaderGroupHomeName');
    console.log('  - serviceManagerName, documentEnteredBy, documentEnteredAt');
    console.log('  - postalCode, livingArrangement, householdSeparation');
    console.log('  - emergencyContacts (JSON), familyMembers (JSON)');
    console.log('  - disabilityPensionAmount, publicMedicalCare, medicalInsuranceTypes (JSON)');
    console.log('  - medicalInsuranceDetail, disabilityCause, disabilityDetail');
    console.log('  - lifeHistory, finalEducation, workHistory');
    console.log('  - hospitalVisits, regularCheckups, medicalRemarks');
    console.log('  - currentServices (JSON), guardianshipType, welfareRightsAdvocacy');
    console.log('  - welfareRightsDetail, specialRemarks, contactPolicy (JSON)\n');

    // トランザクション開始
    console.log('🔒 Starting transaction...');
    await client.query('BEGIN');

    try {
      await client.query(sql);
      await client.query('COMMIT');
      console.log('✅ Migration SQL executed successfully (committed)\n');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Migration failed, transaction rolled back');
      throw error;
    }

    // マイグレーション後の確認
    const afterCount = await client.query(`
      SELECT COUNT(*) as count
      FROM information_schema.columns
      WHERE table_name = 'care_recipients'
    `);
    console.log(`New column count: ${afterCount.rows[0].count}`);
    console.log(`Added columns: ${afterCount.rows[0].count - beforeCount.rows[0].count}\n`);

    // 主要フィールドの存在確認
    console.log('🔍 Verifying key Phase 2 fields...');
    const verifyFields = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'care_recipients'
        AND column_name IN (
          'documentCreatedDate',
          'documentHeaderGroupHomeName',
          'emergencyContacts',
          'familyMembers',
          'medicalInsuranceTypes',
          'currentServices',
          'contactPolicy'
        )
      ORDER BY column_name
    `);

    verifyFields.rows.forEach(row => {
      console.log(`  ✅ ${row.column_name} (${row.data_type})`);
    });

    if (verifyFields.rows.length === 7) {
      console.log('\n✨ Phase 2 migration completed successfully!');
      console.log('All 27 fields have been added to care_recipients table.');
    } else {
      console.log(`\n⚠️  Warning: Expected 7 verification fields, found ${verifyFields.rows.length}`);
      console.log('Please check the migration manually.');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runPhase2Migration();
