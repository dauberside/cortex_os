import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { config } from 'dotenv';

config();

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DIRECT_URL or DATABASE_URL is not defined');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function checkDatabaseContent() {
  console.log('=== データベース内容確認 ===\n');

  try {
    // Users
    console.log('【ユーザー】');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
      orderBy: { email: 'asc' },
    });
    users.forEach((u) => {
      console.log(`  ${u.email} - ${u.name} (${u.role})`);
    });
    console.log('');

    // Units
    console.log('【事業所】');
    const units = await prisma.unit.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: 'asc' },
    });
    units.forEach((u) => {
      console.log(`  ${u.id} - ${u.name}`);
    });
    console.log('');

    // CareRecipients
    console.log('【利用者】');
    const recipients = await prisma.careRecipient.findMany({
      select: {
        id: true,
        name: true,
        deletedAt: true,
      },
      orderBy: { name: 'asc' },
    });
    recipients.forEach((r) => {
      const status = r.deletedAt ? '(削除済み)' : '';
      console.log(`  ${r.id} - ${r.name} ${status}`);
    });
    console.log('');

    // ShiftTypes
    console.log('【シフト種別】');
    const shiftTypes = await prisma.shiftType.findMany({
      select: {
        id: true,
        name: true,
        startTime: true,
        endTime: true,
      },
      orderBy: { name: 'asc' },
    });
    if (shiftTypes.length > 0) {
      shiftTypes.forEach((st) => {
        console.log(`  ${st.name} (${st.startTime} - ${st.endTime})`);
      });
    } else {
      console.log('  (なし)');
    }
    console.log('');

    // AttendanceRecords
    console.log('【勤怠実績】');
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      include: {
        staff: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { date: 'desc' },
      take: 5,
    });
    if (attendanceRecords.length > 0) {
      console.log(`  総件数: ${await prisma.attendanceRecord.count()} 件`);
      console.log('  最新5件:');
      attendanceRecords.forEach((ar) => {
        const date = new Date(ar.date).toLocaleDateString('ja-JP');
        console.log(
          `    ${date} - ${ar.staff.name} (実働: ${ar.workMinutes / 60}h)`
        );
      });
    } else {
      console.log('  (なし)');
    }
    console.log('');

    // MonthlyClosings
    console.log('【月次締め】');
    const closings = await prisma.monthlyClosing.findMany({
      include: {
        closer: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { yearMonth: 'desc' },
    });
    if (closings.length > 0) {
      closings.forEach((c) => {
        const reopened = c.reopenedAt ? '(差戻し済み)' : '';
        const unit = c.unitId || '全体';
        console.log(
          `  ${c.yearMonth} - ${unit} by ${c.closer?.name || '不明'} ${reopened}`
        );
      });
    } else {
      console.log('  (なし)');
    }
    console.log('');

    // GuideRecords
    console.log('【ガイド記録】');
    const guideRecordCount = await prisma.guideRecord.count();
    console.log(`  総件数: ${guideRecordCount} 件`);
    if (guideRecordCount > 0) {
      const recentGuides = await prisma.guideRecord.findMany({
        include: {
          recipient: {
            select: {
              name: true,
            },
          },
          user: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 3,
      });
      console.log('  最新3件:');
      recentGuides.forEach((g) => {
        const date = new Date(g.createdAt).toLocaleDateString('ja-JP');
        console.log(
          `    ${date} - ${g.recipient.name} by ${g.user.name} (${g.status})`
        );
      });
    }
    console.log('');

    // ServiceRecords
    console.log('【サービス提供実績】');
    const serviceRecordCount = await prisma.serviceRecord.count();
    console.log(`  総件数: ${serviceRecordCount} 件`);
    console.log('');

    // DailyLogs
    console.log('【業務日誌】');
    const dailyLogCount = await prisma.dailyLog.count();
    console.log(`  総件数: ${dailyLogCount} 件`);
    console.log('');
  } catch (error) {
    console.error('❌ エラー:', error);
  }

  await prisma.$disconnect();
}

checkDatabaseContent().catch((e) => {
  console.error('❌ チェック失敗:', e);
  process.exit(1);
});
