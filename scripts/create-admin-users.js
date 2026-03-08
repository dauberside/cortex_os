const { PrismaClient } = require("@prisma/client");
const { Pool, neonConfig } = require("@neondatabase/serverless");
const { PrismaNeon } = require("@prisma/adapter-neon");
const ws = require("ws");

// WebSocket設定
neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaNeon(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("管理者とリーダーユーザーを作成します...\n");

  // 管理者ユーザー
  const manager = await prisma.user.upsert({
    where: { email: "manager@example.com" },
    update: { role: "MANAGER" },
    create: {
      email: "manager@example.com",
      name: "管理者",
      role: "MANAGER",
    },
  });
  console.log("✓ 管理者ユーザー作成完了:");
  console.log(`  Email: ${manager.email}`);
  console.log(`  Name: ${manager.name}`);
  console.log(`  Role: ${manager.role}\n`);

  // リーダーユーザー
  const lead = await prisma.user.upsert({
    where: { email: "lead@example.com" },
    update: { role: "LEAD" },
    create: {
      email: "lead@example.com",
      name: "リーダー",
      role: "LEAD",
    },
  });
  console.log("✓ リーダーユーザー作成完了:");
  console.log(`  Email: ${lead.email}`);
  console.log(`  Name: ${lead.name}`);
  console.log(`  Role: ${lead.role}\n`);

  // 一般職員ユーザー（参考用）
  const staff = await prisma.user.upsert({
    where: { email: "staff@example.com" },
    update: { role: "STAFF" },
    create: {
      email: "staff@example.com",
      name: "一般職員",
      role: "STAFF",
    },
  });
  console.log("✓ 一般職員ユーザー作成完了:");
  console.log(`  Email: ${staff.email}`);
  console.log(`  Name: ${staff.name}`);
  console.log(`  Role: ${staff.role}\n`);

  console.log("============================================");
  console.log("全てのユーザーが作成されました！");
  console.log("============================================");
  console.log("\nログイン方法:");
  console.log("1. /auth/signin にアクセス");
  console.log("2. 以下のメールアドレスのいずれかを入力:");
  console.log("   - manager@example.com (管理者)");
  console.log("   - lead@example.com (リーダー)");
  console.log("   - staff@example.com (一般職員)");
  console.log("3. パスワードは不要（開発環境）");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
