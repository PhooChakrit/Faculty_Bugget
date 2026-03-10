/*
  Warnings:

  - A unique constraint covering the columns `[currentStatusId]` on the table `Project` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "StatusCode" AS ENUM ('STATUS_1', 'STATUS_2', 'STATUS_3', 'STATUS_4', 'STATUS_5', 'STATUS_6', 'STATUS_7', 'STATUS_8', 'STATUS_9', 'STATUS_10', 'STATUS_11', 'STATUS_12', 'STATUS_13', 'STATUS_14', 'STATUS_15', 'RECALL');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('DEPT_HEAD', 'FINANCE', 'PLANNING', 'PHYSICAL');

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "currentStatusCode" TEXT DEFAULT 'STATUS_1',
ADD COLUMN     "currentStatusId" TEXT;

-- CreateTable
CREATE TABLE "ProjectStatusRecord" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "statusCode" "StatusCode" NOT NULL,
    "statusLabel" TEXT NOT NULL,
    "subStatus" TEXT,
    "enteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enteredBy" TEXT NOT NULL,
    "exitedAt" TIMESTAMP(3),
    "notes" TEXT,
    "branchChoice" TEXT,

    CONSTRAINT "ProjectStatusRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationStatus" (
    "id" TEXT NOT NULL,
    "statusId" TEXT NOT NULL,
    "notificationType" "NotificationType" NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,
    "recipient" TEXT,
    "notes" TEXT,

    CONSTRAINT "NotificationStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusTransition" (
    "id" TEXT NOT NULL,
    "fromStatus" "StatusCode" NOT NULL,
    "toStatus" "StatusCode" NOT NULL,
    "label" TEXT,
    "condition" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "StatusTransition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectStatusRecord_projectId_enteredAt_idx" ON "ProjectStatusRecord"("projectId", "enteredAt");

-- CreateIndex
CREATE INDEX "ProjectStatusRecord_statusCode_idx" ON "ProjectStatusRecord"("statusCode");

-- CreateIndex
CREATE INDEX "NotificationStatus_statusId_isCompleted_idx" ON "NotificationStatus"("statusId", "isCompleted");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationStatus_statusId_notificationType_key" ON "NotificationStatus"("statusId", "notificationType");

-- CreateIndex
CREATE INDEX "StatusTransition_fromStatus_idx" ON "StatusTransition"("fromStatus");

-- CreateIndex
CREATE UNIQUE INDEX "StatusTransition_fromStatus_toStatus_key" ON "StatusTransition"("fromStatus", "toStatus");

-- CreateIndex
CREATE UNIQUE INDEX "Project_currentStatusId_key" ON "Project"("currentStatusId");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_currentStatusId_fkey" FOREIGN KEY ("currentStatusId") REFERENCES "ProjectStatusRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectStatusRecord" ADD CONSTRAINT "ProjectStatusRecord_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectStatusRecord" ADD CONSTRAINT "ProjectStatusRecord_enteredBy_fkey" FOREIGN KEY ("enteredBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationStatus" ADD CONSTRAINT "NotificationStatus_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "ProjectStatusRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationStatus" ADD CONSTRAINT "NotificationStatus_completedBy_fkey" FOREIGN KEY ("completedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
