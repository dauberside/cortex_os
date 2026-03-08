import { PrismaClient } from "@prisma/client";
import "dotenv/config";

// Prisma CLIではschema.prismaのDATABASE_URLを使用する
// スクリプトではDIRECT_URLを環境変数として設定
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding test data...");

  // 1. ユーザー作成
  const staffUser = await prisma.user.upsert({
    where: { email: "staff@example.com" },
    update: {},
    create: {
      email: "staff@example.com",
      name: "田中 太郎（スタッフ）",
      role: "STAFF",
    },
  });

  const leadUser = await prisma.user.upsert({
    where: { email: "lead@example.com" },
    update: {},
    create: {
      email: "lead@example.com",
      name: "佐藤 花子（リーダー）",
      role: "LEAD",
    },
  });

  const managerUser = await prisma.user.upsert({
    where: { email: "manager@example.com" },
    update: {},
    create: {
      email: "manager@example.com",
      name: "鈴木 一郎（管理者）",
      role: "MANAGER",
    },
  });

  console.log("✅ Users created");

  // 2. ユニット作成
  const unitA = await prisma.unit.upsert({
    where: { id: "unit-a" },
    update: {},
    create: {
      id: "unit-a",
      name: "ハウスてんじん",
      serviceType: "GH",
      description: "グループホームA",
    },
  });

  const unitB = await prisma.unit.upsert({
    where: { id: "unit-b" },
    update: {},
    create: {
      id: "unit-b",
      name: "ハウスなかす",
      serviceType: "GH",
      description: "グループホームB",
    },
  });

  console.log("✅ Units created");

  // 3. UnitStaff（職員とユニットの紐付け）
  // スタッフはユニットAに所属
  await prisma.unitStaff.upsert({
    where: { id: "unitstaff-staff-a" },
    update: {},
    create: {
      id: "unitstaff-staff-a",
      unitId: unitA.id,
      userId: staffUser.id,
      role: "primary",
    },
  });

  // リーダーはユニットAに所属
  await prisma.unitStaff.upsert({
    where: { id: "unitstaff-lead-a" },
    update: {},
    create: {
      id: "unitstaff-lead-a",
      unitId: unitA.id,
      userId: leadUser.id,
      role: "primary",
    },
  });

  // マネージャーはどのユニットにも所属しない（全体管理者）

  console.log("✅ UnitStaff relationships created");

  // 4. 利用者作成（ユニットAに2名、ユニットBに1名）
  const recipient1 = await prisma.careRecipient.upsert({
    where: { id: "recipient-1" },
    update: {},
    create: {
      id: "recipient-1",
      name: "山田 太郎",
      nameKana: "ヤマダ タロウ",
      birthDate: new Date("1990-05-15"),
      gender: "Male",
      disabilityType: ["Intellectual"],
      supportLevel: 3,
      userId: staffUser.id,
      createdBy: staffUser.id, // 作成者
    },
  });

  const recipient2 = await prisma.careRecipient.upsert({
    where: { id: "recipient-2" },
    update: {},
    create: {
      id: "recipient-2",
      name: "佐々木 花子",
      nameKana: "ササキ ハナコ",
      birthDate: new Date("1985-08-20"),
      gender: "Female",
      disabilityType: ["Mental"],
      supportLevel: 4,
      userId: leadUser.id,
      createdBy: leadUser.id, // 作成者
    },
  });

  const recipient3 = await prisma.careRecipient.upsert({
    where: { id: "recipient-3" },
    update: {},
    create: {
      id: "recipient-3",
      name: "高橋 次郎",
      nameKana: "タカハシ ジロウ",
      birthDate: new Date("1992-12-10"),
      gender: "Male",
      disabilityType: ["Physical"],
      supportLevel: 2,
      userId: managerUser.id,
      createdBy: managerUser.id, // 作成者
    },
  });

  console.log("✅ Recipients created");

  // 5. UnitRecipient（利用者とユニットの紐付け）
  // 利用者1と2はユニットAに所属
  await prisma.unitRecipient.upsert({
    where: { id: "unitrecipient-1-a" },
    update: {},
    create: {
      id: "unitrecipient-1-a",
      unitId: unitA.id,
      recipientId: recipient1.id,
    },
  });

  await prisma.unitRecipient.upsert({
    where: { id: "unitrecipient-2-a" },
    update: {},
    create: {
      id: "unitrecipient-2-a",
      unitId: unitA.id,
      recipientId: recipient2.id,
    },
  });

  // 利用者3はユニットBに所属
  await prisma.unitRecipient.upsert({
    where: { id: "unitrecipient-3-b" },
    update: {},
    create: {
      id: "unitrecipient-3-b",
      unitId: unitB.id,
      recipientId: recipient3.id,
    },
  });

  console.log("✅ UnitRecipient relationships created");

  console.log("\n📊 Test Data Summary:");
  console.log("---");
  console.log(`👤 Users: ${staffUser.email} (STAFF), ${leadUser.email} (LEAD), ${managerUser.email} (MANAGER)`);
  console.log(`🏠 Units: ${unitA.name} (${unitA.id}), ${unitB.name} (${unitB.id})`);
  console.log(`👥 Recipients: ${recipient1.name}, ${recipient2.name}, ${recipient3.name}`);
  console.log("---");
  console.log("\n🔐 Access Control Test:");
  console.log(`- STAFF (${staffUser.email}): ユニットA所属 → 利用者1,2を閲覧可、利用者1のみ編集可`);
  console.log(`- LEAD (${leadUser.email}): ユニットA所属 → 利用者1,2を閲覧・編集可`);
  console.log(`- MANAGER (${managerUser.email}): 全ユニット → 全利用者を閲覧・編集可`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
