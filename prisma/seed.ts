import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Load environment variables
config();

// Use DIRECT_URL for seed operations (non-pooled connection)
const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DIRECT_URL or DATABASE_URL is not defined');
}

// Create pg Pool with DIRECT_URL
const pool = new Pool({ connectionString });

// Create PrismaPg adapter
const adapter = new PrismaPg(pool);

// Use PrismaClient with adapter
const prisma = new PrismaClient({
  adapter,
  log: ['error'],
});

async function main() {
  console.log('🌱 Starting seed...');

  // ShiftType（勤務区分マスタ）の初期データ
  const shiftTypes = [
    {
      code: 'EARLY',
      name: '早番',
      description: '早朝から午後までの勤務',
      startTime: '07:00',
      endTime: '16:00',
      breakMinutes: 60,
      crossesDay: false,
      standardWorkMinutes: 480, // 8時間
      color: '#FEF3C7', // 淡い黄色
    },
    {
      code: 'DAY',
      name: '日勤',
      description: '日中の標準勤務',
      startTime: '09:00',
      endTime: '18:00',
      breakMinutes: 60,
      crossesDay: false,
      standardWorkMinutes: 480, // 8時間
      color: '#DBEAFE', // 淡い青
    },
    {
      code: 'LATE',
      name: '遅番',
      description: '午後から夜までの勤務',
      startTime: '13:00',
      endTime: '22:00',
      breakMinutes: 60,
      crossesDay: false,
      standardWorkMinutes: 480, // 8時間
      color: '#FCE7F3', // 淡いピンク
    },
    {
      code: 'NIGHT',
      name: '夜勤',
      description: '夜間から翌朝までの勤務（日跨ぎ）',
      startTime: '22:00',
      endTime: '07:00',
      breakMinutes: 60,
      crossesDay: true,
      standardWorkMinutes: 480, // 8時間
      color: '#E9D5FF', // 淡い紫
    },
  ];

  console.log('📋 Creating ShiftTypes...');

  for (const shiftType of shiftTypes) {
    await prisma.shiftType.upsert({
      where: { code: shiftType.code },
      update: shiftType,
      create: shiftType,
    });
    console.log(`  ✓ ${shiftType.name} (${shiftType.code})`);
  }

  // Test Units（テスト用事業所）
  console.log('🏢 Creating Test Units...');

  const testUnit = await prisma.unit.upsert({
    where: { id: 'test-unit-001' },
    update: {},
    create: {
      id: 'test-unit-001',
      name: 'テスト事業所A',
      serviceType: 'GROUP_HOME',
      description: '月次締めテスト用の事業所',
    },
  });
  console.log(`  ✓ ${testUnit.name}`);

  // Test Users（テスト用ユーザー）
  console.log('👥 Creating Test Users...');

  const manager = await prisma.user.upsert({
    where: { email: 'manager@test.com' },
    update: {},
    create: {
      email: 'manager@test.com',
      name: 'テスト管理者',
      role: 'MANAGER',
    },
  });
  console.log(`  ✓ ${manager.name} (MANAGER)`);

  const staff1 = await prisma.user.upsert({
    where: { email: 'staff1@test.com' },
    update: {},
    create: {
      email: 'staff1@test.com',
      name: 'テスト職員1',
      role: 'STAFF',
    },
  });
  console.log(`  ✓ ${staff1.name} (STAFF)`);

  const staff2 = await prisma.user.upsert({
    where: { email: 'staff2@test.com' },
    update: {},
    create: {
      email: 'staff2@test.com',
      name: 'テスト職員2',
      role: 'STAFF',
    },
  });
  console.log(`  ✓ ${staff2.name} (STAFF)`);

  // Assign staff to unit
  console.log('🔗 Assigning staff to units...');

  // Check if already exists
  const existing1 = await prisma.unitStaff.findFirst({
    where: {
      userId: staff1.id,
      unitId: testUnit.id,
    },
  });

  if (!existing1) {
    await prisma.unitStaff.create({
      data: {
        userId: staff1.id,
        unitId: testUnit.id,
        role: 'primary',
        assignedDate: new Date('2026-01-01'),
      },
    });
  }

  const existing2 = await prisma.unitStaff.findFirst({
    where: {
      userId: staff2.id,
      unitId: testUnit.id,
    },
  });

  if (!existing2) {
    await prisma.unitStaff.create({
      data: {
        userId: staff2.id,
        unitId: testUnit.id,
        role: 'primary',
        assignedDate: new Date('2026-01-01'),
      },
    });
  }
  console.log(`  ✓ Assigned 2 staff to ${testUnit.name}`);

  // Get created ShiftTypes
  const dayShift = await prisma.shiftType.findFirst({ where: { code: 'DAY' } });
  const earlyShift = await prisma.shiftType.findFirst({ where: { code: 'EARLY' } });

  if (!dayShift || !earlyShift) {
    throw new Error('ShiftTypes not found');
  }

  // Create shifts for last month (February 2026)
  console.log('📅 Creating sample shifts for February 2026...');

  const febDays = 28;
  let shiftCount = 0;

  for (let day = 1; day <= febDays; day++) {
    const date = new Date(2026, 1, day); // February 2026

    // Staff1: 月・水・金に日勤
    if (day % 2 === 1) {
      const startAt = new Date(2026, 1, day, 9, 0);
      const endAt = new Date(2026, 1, day, 18, 0);

      await prisma.shift.create({
        data: {
          staffId: staff1.id,
          unitId: testUnit.id,
          shiftTypeId: dayShift.id,
          date,
          startAt,
          endAt,
          breakMinutes: 60,
          status: 'PUBLISHED',
          publishedAt: new Date(),
          publishedBy: manager.id,
          createdBy: manager.id,
        },
      });
      shiftCount++;
    }

    // Staff2: 火・木・土に早番
    if (day % 2 === 0 && day <= 26) {
      const startAt = new Date(2026, 1, day, 7, 0);
      const endAt = new Date(2026, 1, day, 16, 0);

      await prisma.shift.create({
        data: {
          staffId: staff2.id,
          unitId: testUnit.id,
          shiftTypeId: earlyShift.id,
          date,
          startAt,
          endAt,
          breakMinutes: 60,
          status: 'PUBLISHED',
          publishedAt: new Date(),
          publishedBy: manager.id,
          createdBy: manager.id,
        },
      });
      shiftCount++;
    }
  }
  console.log(`  ✓ Created ${shiftCount} shifts`);

  // Create time clock events for February 2026
  console.log('⏰ Creating sample time clock events...');

  let clockEventCount = 0;

  for (let day = 1; day <= febDays; day++) {
    // Staff1: 奇数日に打刻
    if (day % 2 === 1) {
      const clockInTime = new Date(2026, 1, day, 9, 0);
      const clockOutTime = new Date(2026, 1, day, 18, 0);

      await prisma.timeClockEvent.create({
        data: {
          staffId: staff1.id,
          type: 'CLOCK_IN',
          occurredAt: clockInTime,
        },
      });

      await prisma.timeClockEvent.create({
        data: {
          staffId: staff1.id,
          type: 'CLOCK_OUT',
          occurredAt: clockOutTime,
        },
      });
      clockEventCount += 2;
    }

    // Staff2: 偶数日に打刻
    if (day % 2 === 0 && day <= 26) {
      const clockInTime = new Date(2026, 1, day, 7, 0);
      const clockOutTime = new Date(2026, 1, day, 16, 0);

      await prisma.timeClockEvent.create({
        data: {
          staffId: staff2.id,
          type: 'CLOCK_IN',
          occurredAt: clockInTime,
        },
      });

      await prisma.timeClockEvent.create({
        data: {
          staffId: staff2.id,
          type: 'CLOCK_OUT',
          occurredAt: clockOutTime,
        },
      });
      clockEventCount += 2;
    }
  }
  console.log(`  ✓ Created ${clockEventCount} clock events`);

  // Create attendance records for February 2026
  console.log('📊 Creating sample attendance records...');

  let attendanceCount = 0;

  for (let day = 1; day <= febDays; day++) {
    const date = new Date(2026, 1, day, 0, 0, 0, 0);

    // Staff1: 奇数日
    if (day % 2 === 1) {
      await prisma.attendanceRecord.create({
        data: {
          staffId: staff1.id,
          date,
          clockInAt: new Date(2026, 1, day, 9, 0),
          clockOutAt: new Date(2026, 1, day, 18, 0),
          workMinutes: 480, // 8時間
          breakMinutes: 60,
          overtimeMinutes: 0,
          midnightMinutes: 0,
          holidayMinutes: 0,
          status: 'OPEN',
        },
      });
      attendanceCount++;
    }

    // Staff2: 偶数日
    if (day % 2 === 0 && day <= 26) {
      await prisma.attendanceRecord.create({
        data: {
          staffId: staff2.id,
          date,
          clockInAt: new Date(2026, 1, day, 7, 0),
          clockOutAt: new Date(2026, 1, day, 16, 0),
          workMinutes: 480, // 8時間
          breakMinutes: 60,
          overtimeMinutes: 0,
          midnightMinutes: 0,
          holidayMinutes: 0,
          status: 'OPEN',
        },
      });
      attendanceCount++;
    }
  }
  console.log(`  ✓ Created ${attendanceCount} attendance records`);

  // Test Recipients（テスト用利用者）
  console.log('👤 Creating Test Recipients...');

  const recipient1 = await prisma.careRecipient.upsert({
    where: { id: 'test-recipient-001' },
    update: {},
    create: {
      id: 'test-recipient-001',
      userId: manager.id,
      name: '山田太郎',
      nameKana: 'ヤマダタロウ',
      birthDate: new Date('1990-04-15'),
      gender: 'Male',
      disabilityType: ['Intellectual'],
      supportLevel: 4,
    },
  });
  console.log(`  ✓ ${recipient1.name}`);

  const recipient2 = await prisma.careRecipient.upsert({
    where: { id: 'test-recipient-002' },
    update: {},
    create: {
      id: 'test-recipient-002',
      userId: manager.id,
      name: '佐藤花子',
      nameKana: 'サトウハナコ',
      birthDate: new Date('1985-08-22'),
      gender: 'Female',
      disabilityType: ['Physical', 'Intellectual'],
      supportLevel: 5,
    },
  });
  console.log(`  ✓ ${recipient2.name}`);

  // Support Records（支援記録）
  console.log('📝 Creating Test Support Records...');

  let supportRecordCount = 0;

  // 山田太郎さんの記録（直近1週間）
  for (let daysAgo = 0; daysAgo < 7; daysAgo++) {
    const recordDate = new Date();
    recordDate.setDate(recordDate.getDate() - daysAgo);
    recordDate.setHours(12, 0, 0, 0);

    // 朝食記録
    await prisma.supportRecord.create({
      data: {
        recipientId: recipient1.id,
        staffId: staff1.id,
        recordDate: new Date(recordDate.getTime() - 3 * 60 * 60 * 1000), // 9:00
        category: 'MEAL',
        content: {
          mealType: 'breakfast',
          intakeAmount: daysAgo === 0 ? 'most' : 'all',
          foodTexture: 'normal',
          assistanceLevel: 'verbal',
          duration: 25,
        },
        notes: daysAgo === 0 ? '少し食欲がなさそうでした' : undefined,
      },
    });
    supportRecordCount++;

    // 昼食記録
    await prisma.supportRecord.create({
      data: {
        recipientId: recipient1.id,
        staffId: staff2.id,
        recordDate,
        category: 'MEAL',
        content: {
          mealType: 'lunch',
          intakeAmount: 'all',
          foodTexture: 'normal',
          assistanceLevel: 'independent',
          duration: 30,
        },
      },
    });
    supportRecordCount++;

    // 夕食記録
    await prisma.supportRecord.create({
      data: {
        recipientId: recipient1.id,
        staffId: staff1.id,
        recordDate: new Date(recordDate.getTime() + 6 * 60 * 60 * 1000), // 18:00
        category: 'MEAL',
        content: {
          mealType: 'dinner',
          intakeAmount: daysAgo % 3 === 0 ? 'half' : 'all',
          foodTexture: 'normal',
          assistanceLevel: 'verbal',
          duration: 28,
          leftoverReason: daysAgo % 3 === 0 ? '味付けが苦手だったようです' : undefined,
        },
      },
    });
    supportRecordCount++;
  }

  // 佐藤花子さんの記録（直近3日間）
  for (let daysAgo = 0; daysAgo < 3; daysAgo++) {
    const recordDate = new Date();
    recordDate.setDate(recordDate.getDate() - daysAgo);
    recordDate.setHours(12, 0, 0, 0);

    // 昼食記録（介助が必要）
    await prisma.supportRecord.create({
      data: {
        recipientId: recipient2.id,
        staffId: staff2.id,
        recordDate,
        category: 'MEAL',
        content: {
          mealType: 'lunch',
          intakeAmount: 'most',
          foodTexture: 'soft',
          assistanceLevel: 'partial',
          duration: 45,
        },
        notes: '一部介助で完食されました',
      },
    });
    supportRecordCount++;

    // 夕食記録
    await prisma.supportRecord.create({
      data: {
        recipientId: recipient2.id,
        staffId: staff1.id,
        recordDate: new Date(recordDate.getTime() + 6 * 60 * 60 * 1000),
        category: 'MEAL',
        content: {
          mealType: 'dinner',
          intakeAmount: 'half',
          foodTexture: 'soft',
          assistanceLevel: 'full',
          duration: 50,
          leftoverReason: '体調がすぐれない様子でした',
        },
      },
    });
    supportRecordCount++;
  }

  console.log(`  ✓ Created ${supportRecordCount} support records`);

  console.log('✅ Seed completed successfully!');
  console.log('\n📝 Test data summary:');
  console.log(`   - Unit: ${testUnit.name}`);
  console.log(`   - Manager: ${manager.email}`);
  console.log(`   - Staff: ${staff1.email}, ${staff2.email}`);
  console.log(`   - Recipients: ${recipient1.name}, ${recipient2.name}`);
  console.log(`   - Period: February 2026 (2026-02-01 to 2026-02-28)`);
  console.log(`   - Shifts: ${shiftCount} shifts`);
  console.log(`   - Clock events: ${clockEventCount} events`);
  console.log(`   - Attendance records: ${attendanceCount} records`);
  console.log(`   - Support records: ${supportRecordCount} records`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
