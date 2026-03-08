require("dotenv").config();
const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

async function main() {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

  if (!connectionString) {
    console.error("ERROR: DATABASE_URL or DIRECT_URL not found in .env");
    process.exit(1);
  }

  console.log("📊 Running seed SQL...");

  const client = new Client({ connectionString });

  try {
    await client.connect();

    // SQLファイルを読み込む
    const sqlPath = path.join(__dirname, "seed-test-data.sql");
    const sql = fs.readFileSync(sqlPath, "utf-8");

    // SQLを実行
    await client.query(sql);

    console.log("");
    console.log("✅ Test data seeded successfully!");
    console.log("");
    console.log("🔐 Access Control Test:");
    console.log(
      "- STAFF (staff@example.com): ユニットA所属 → 利用者1,2を閲覧可、利用者1のみ編集可"
    );
    console.log(
      "- LEAD (lead@example.com): ユニットA所属 → 利用者1,2を閲覧・編集可"
    );
    console.log(
      "- MANAGER (manager@example.com): 全ユニット → 全利用者を閲覧・編集可"
    );
  } catch (error) {
    console.error("Error seeding data:", error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
