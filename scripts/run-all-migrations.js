const fs = require('fs');
const { Client } = require('pg');

async function runAllMigrations() {
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

    // Check current tables
    console.log('📊 Checking current tables...');
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    if (tablesResult.rows.length === 0) {
      console.log('⚠️  Database is empty - running full migration\n');

      // Run full migration
      const sql = fs.readFileSync('/tmp/all-migrations-fixed.sql', 'utf8');
      console.log('🚀 Executing all migrations (807 lines)...');

      await client.query(sql);

      console.log('✅ All migrations completed!\n');
    } else {
      console.log(`Found ${tablesResult.rows.length} existing tables:`);
      tablesResult.rows.forEach(row => console.log(`  - ${row.table_name}`));
      console.log();

      // Check if Phase 1 fields exist
      console.log('🔍 Checking Phase 1 fields...');
      const phase1Check = await client.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'care_recipients'
          AND column_name = 'emergencyContactFax'
      `);

      if (phase1Check.rows.length === 0) {
        console.log('⚠️  Phase 1 fields not found - adding them\n');

        const phase1Sql = fs.readFileSync(
          '/Volumes/Extreme Pro/cortex_os/prisma/migrations/20260228002306_add_phase1_fields/migration.sql',
          'utf8'
        );

        console.log('🚀 Executing Phase 1 migration...');
        await client.query(phase1Sql);

        console.log('✅ Phase 1 fields added!\n');
      } else {
        console.log('✅ Phase 1 fields already exist\n');
      }
    }

    // Verify final state
    console.log('📊 Final table list:');
    const finalResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    finalResult.rows.forEach(row => console.log(`  - ${row.table_name}`));
    console.log(`\nTotal: ${finalResult.rows.length} tables`);

    // Verify Phase 1 fields
    console.log('\n🔍 Verifying Phase 1 fields on care_recipients:');
    const verifyFields = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'care_recipients'
        AND column_name IN ('emergencyContactFax', 'sensorySound', 'hasTopicalMedication', 'personality')
      ORDER BY column_name
    `);
    verifyFields.rows.forEach(row => console.log(`  ✅ ${row.column_name}`));

    console.log('\n✨ Migration complete! Database is ready.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runAllMigrations();
