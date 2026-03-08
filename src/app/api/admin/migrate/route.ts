import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const session = await auth();

    // MANAGER権限のみ実行可能
    if (!session || session.user.role !== 'MANAGER') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // マイグレーションSQL
    const migrationSQL = `
      ALTER TABLE "daily_log_entries" ADD COLUMN IF NOT EXISTS "timeSlotRecords" JSONB;

      COMMENT ON COLUMN "daily_log_entries"."timeSlotRecords" IS '時間帯別記録（30分刻み）: [{time, water, meal, leisure, oral, bath, condition, toilet, sleep, notes}]';
    `;

    // SQLを実行
    await prisma.$executeRawUnsafe(migrationSQL);

    return NextResponse.json({
      success: true,
      message: 'Migration executed successfully',
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
