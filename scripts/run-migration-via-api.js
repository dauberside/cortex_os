const fs = require("fs");
const path = require("path");

async function runMigrationViaAPI() {
  const apiKey = process.env.neon_api || process.env.NEON_API_KEY;
  const projectId = "ep-broad-haze-ai5806b4";

  if (!apiKey) {
    console.error("❌ NEON_API_KEY not found");
    process.exit(1);
  }

  console.log("🔑 Using Neon API...");

  // Get all migration files in order
  const migrationsDir = path.join(__dirname, "../prisma/migrations");
  const migrationFolders = fs
    .readdirSync(migrationsDir)
    .filter(
      (f) =>
        f !== "migration_lock.toml" &&
        fs.statSync(path.join(migrationsDir, f)).isDirectory()
    )
    .sort();

  console.log(`📂 Found ${migrationFolders.length} migrations:`);
  migrationFolders.forEach((f) => console.log(`  - ${f}`));

  for (const folder of migrationFolders) {
    const sqlPath = path.join(migrationsDir, folder, "migration.sql");

    if (!fs.existsSync(sqlPath)) {
      console.log(`⏭️  Skipping ${folder} (no migration.sql)`);
      continue;
    }

    const sql = fs.readFileSync(sqlPath, "utf8");
    console.log(`\n📝 Executing migration: ${folder}...`);

    try {
      const response = await fetch(
        `https://console.neon.tech/api/v2/projects/${projectId}/query`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            query: sql,
            db_name: "neondb",
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error(`❌ Failed: ${response.status} ${response.statusText}`);
        console.error(error);
        process.exit(1);
      }

      const result = await response.json();
      console.log(`✅ Success: ${folder}`);
      if (result.rows) {
        console.log(`   Rows affected: ${result.rows.length}`);
      }
    } catch (error) {
      console.error(`❌ Error executing ${folder}:`, error.message);
      process.exit(1);
    }
  }

  console.log("\n✨ All migrations completed successfully!");
}

runMigrationViaAPI();
