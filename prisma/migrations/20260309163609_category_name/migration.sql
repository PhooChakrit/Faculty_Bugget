-- AlterEnum
ALTER TYPE "IncomeType" ADD VALUE 'OTHER';

-- AlterTable
ALTER TABLE "IncomeItem" ADD COLUMN     "categoryName" TEXT;
