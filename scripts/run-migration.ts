import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
config();

const prisma = new PrismaClient();

async function runMigration() {
  try {
    const migrationPath = path.join(
      __dirname,
      '../prisma/migrations/20260304131918_add_time_slot_records/migration.sql'
    );

    const sql = fs.readFileSync(migrationPath, 'utf-8');

    console.log('Running migration SQL:', sql);

    await prisma.$executeRawUnsafe(sql);

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();
