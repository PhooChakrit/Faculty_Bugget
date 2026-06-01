-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "excelFile" BYTEA,
ADD COLUMN     "excelFileName" TEXT,
ADD COLUMN     "excelFileType" TEXT,
ADD COLUMN     "excelUploadedAt" TIMESTAMP(3);
