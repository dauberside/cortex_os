-- AlterTable: Add role column to users table
-- This migration adds the missing role column that exists in schema.prisma but not in the database

-- Create UserRole enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE "UserRole" AS ENUM ('STAFF', 'LEAD', 'MANAGER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add role column to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role" "UserRole" NOT NULL DEFAULT 'STAFF';

-- Create index on role
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users"("role");
