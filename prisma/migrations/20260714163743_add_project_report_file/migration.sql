-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "reportFile" BYTEA,
ADD COLUMN     "reportFileName" TEXT,
ADD COLUMN     "reportFileType" TEXT,
ADD COLUMN     "reportUploadedAt" TIMESTAMP(3);
