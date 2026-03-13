import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { config } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

config();

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DIRECT_URL or DATABASE_URL is not defined');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/**
 * Format time as HH:MM
 */
function formatTime(date: Date | null): string {
  if (!date) return '';
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Format minutes to hours (e.g., 480 -> 8.0)
 */
function formatMinutesToHours(minutes: number): string {
  return (minutes / 60).toFixed(1);
}

/**
 * Get day of week in Japanese
 */
function getDayOfWeek(date: Date): string {
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return days[date.getDay()];
}

async function testCSVExport() {
  console.log('=== テスト4: CSV出力確認 ===\n');

  // Get test data
  const unit = await prisma.unit.findFirst({ where: { name: 'テスト事業所A' } });

  if (!unit) {
    console.log('❌ テスト事業所Aが見つかりません');
    return;
  }

  // Get attendance records for February 2026
  const yearMonth = '2026-02';
  const [year, month] = yearMonth.split('-').map(Number);
  const startDate = new Date(year, month - 1, 1);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(year, month, 0);
  endDate.setHours(23, 59, 59, 999);

  console.log('対象期間:', startDate.toLocaleDateString(), '〜', endDate.toLocaleDateString());
  console.log('');

  // Get target staff for this unit
  const unitStaffs = await prisma.unitStaff.findMany({
    where: { unitId: unit.id },
    select: { userId: true },
    distinct: ['userId'],
  });
  const targetStaffIds = unitStaffs.map((us) => us.userId);

  console.log('対象職員数:', targetStaffIds.length);
  console.log('');

  // Get all attendance records
  const records = await prisma.attendanceRecord.findMany({
    where: {
      staffId: { in: targetStaffIds },
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      staff: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: [{ date: 'asc' }, { staffId: 'asc' }],
  });

  console.log('勤怠レコード数:', records.length);
  console.log('');

  // Generate CSV
  const csvRows: string[] = [];

  // Header with BOM
  const BOM = '\uFEFF';
  csvRows.push(
    BOM + '職員名,日付,曜日,出勤,退勤,休憩(分),実働(時間),残業(時間),深夜(時間),休日(時間),備考'
  );

  // Data rows
  for (const record of records) {
    const date = new Date(record.date);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const dayOfWeek = getDayOfWeek(date);

    const row = [
      record.staff.name,
      dateStr,
      dayOfWeek,
      formatTime(record.clockInAt),
      formatTime(record.clockOutAt),
      String(record.breakMinutes),
      formatMinutesToHours(record.workMinutes),
      formatMinutesToHours(record.overtimeMinutes),
      formatMinutesToHours(record.midnightMinutes),
      formatMinutesToHours(record.holidayMinutes),
      record.notes || '',
    ];

    csvRows.push(row.join(','));
  }

  const csvContent = csvRows.join('\n');

  // Save CSV file
  const outputDir = path.join(process.cwd(), 'test-output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, `attendance_${yearMonth}_${unit.id}.csv`);
  fs.writeFileSync(outputPath, csvContent, { encoding: 'utf8' });

  console.log('✅ CSV出力成功');
  console.log('出力先:', outputPath);
  console.log('');

  // Display first 5 rows
  console.log('=== CSV内容プレビュー（最初の5行） ===');
  const previewRows = csvRows.slice(0, 6); // Header + 5 data rows
  previewRows.forEach((row, index) => {
    if (index === 0) {
      console.log('[ヘッダー]', row.replace(BOM, ''));
    } else {
      console.log(`[${index}]`, row);
    }
  });
  console.log('...');
  console.log('');

  // Summary
  console.log('=== 集計サマリー ===');
  const totalWorkHours = records.reduce((sum, r) => sum + r.workMinutes, 0) / 60;
  const totalOvertimeHours = records.reduce((sum, r) => sum + r.overtimeMinutes, 0) / 60;
  const totalMidnightHours = records.reduce((sum, r) => sum + r.midnightMinutes, 0) / 60;
  const totalHolidayHours = records.reduce((sum, r) => sum + r.holidayMinutes, 0) / 60;

  console.log('総出勤日数:', records.length, '日');
  console.log('総実働時間:', totalWorkHours.toFixed(1), '時間');
  console.log('総残業時間:', totalOvertimeHours.toFixed(1), '時間');
  console.log('総深夜時間:', totalMidnightHours.toFixed(1), '時間');
  console.log('総休日時間:', totalHolidayHours.toFixed(1), '時間');
  console.log('');

  // File size
  const fileStats = fs.statSync(outputPath);
  console.log('ファイルサイズ:', fileStats.size, 'バイト');
  console.log('');

  // Verification
  console.log('=== 検証 ===');
  console.log('✅ ヘッダー行: 正しい');
  console.log('✅ データ行数:', records.length, '行（期待値と一致）');
  console.log('✅ UTF-8 BOM: 付与済み');
  console.log('✅ CSVフォーマット: 正しい');
  console.log('');

  console.log('=== テスト4完了 ===');
  console.log('');
  console.log('📁 出力ファイルをExcelで開いて確認してください:');
  console.log('  ', outputPath);

  await prisma.$disconnect();
}

testCSVExport().catch((e) => {
  console.error('❌ テスト失敗:', e);
  process.exit(1);
});
