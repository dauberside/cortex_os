const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

async function runMigration() {
  const connectionString =
    process.env.CORTEX_DATABASE_DATABASE_URL_UNPOOLED ||
    process.env.DATABASE_URL;

  if (!connectionString) {
    console.error("❌ No database connection string found");
    process.exit(1);
  }

  console.log("🔗 Connecting to database...");
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log("✅ Connected successfully");

    const migrationPath = path.join(
      __dirname,
      "../prisma/migrations/20260228002306_add_phase1_fields/migration.sql"
    );
    const sql = fs.readFileSync(migrationPath, "utf8");

    console.log("📝 Executing migration...");
    await client.query(sql);
    console.log("✅ Migration completed successfully");

    // Record migration in _prisma_migrations table
    const migrationName = "20260228002306_add_phase1_fields";
    await client.query(
      `
      INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
      VALUES ($1, $2, NOW(), $3, NULL, NULL, NOW(), 1)
      ON CONFLICT (migration_name) DO NOTHING
    `,
      [migrationName, "0", migrationName]
    );

    console.log("✅ Migration recorded in _prisma_migrations table");
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
