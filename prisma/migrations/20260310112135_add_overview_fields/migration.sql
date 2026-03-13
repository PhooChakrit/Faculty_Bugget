/*
  Warnings:

  - A unique constraint covering the columns `[projectCode]` on the table `Project` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "MeetingType" AS ENUM ('BOARD', 'DEAN');

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "costCenter" TEXT,
ADD COLUMN     "docDate" TIMESTAMP(3),
ADD COLUMN     "docLink" TEXT,
ADD COLUMN     "docNumber" TEXT,
ADD COLUMN     "electricityFeeActual" DECIMAL(15,2),
ADD COLUMN     "electricityFeeProposal" DECIMAL(15,2),
ADD COLUMN     "fundOwner" TEXT,
ADD COLUMN     "maintenanceFeeActual" DECIMAL(15,2),
ADD COLUMN     "maintenanceFeeProposal" DECIMAL(15,2),
ADD COLUMN     "memoTitle" TEXT,
ADD COLUMN     "projectCode" TEXT,
ADD COLUMN     "responsible" TEXT,
ADD COLUMN     "status1" TEXT,
ADD COLUMN     "status1Date" TIMESTAMP(3),
ADD COLUMN     "status2" TEXT,
ADD COLUMN     "status2Date" TIMESTAMP(3),
ADD COLUMN     "status3" TEXT,
ADD COLUMN     "status3Date" TIMESTAMP(3),
ADD COLUMN     "status4" TEXT,
ADD COLUMN     "status4Date" TIMESTAMP(3),
ADD COLUMN     "status5" TEXT,
ADD COLUMN     "status5Date" TIMESTAMP(3),
ADD COLUMN     "vendorCode" TEXT;

-- CreateTable
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" "MeetingType" NOT NULL,
    "no" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "purpose" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Project_projectCode_key" ON "Project"("projectCode");

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
