-- AlterTable
ALTER TABLE "assessments" ADD COLUMN     "toiletCareTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "toiletInterval" TEXT,
ADD COLUMN     "toiletNote" TEXT;
