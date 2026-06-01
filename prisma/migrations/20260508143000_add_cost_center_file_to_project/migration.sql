-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "costCenterFile" BYTEA,
ADD COLUMN     "costCenterFileName" TEXT,
ADD COLUMN     "costCenterFileType" TEXT,
ADD COLUMN     "costCenterUploadedAt" TIMESTAMP(3);
