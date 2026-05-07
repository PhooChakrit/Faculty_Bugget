-- AlterEnum
ALTER TYPE "StatusCode" ADD VALUE 'STATUS_99';

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "previousStatusCode" TEXT;

-- CreateTable
CREATE TABLE "BudgetEditLog" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "oldValue" DECIMAL(15,2),
    "newValue" DECIMAL(15,2),
    "editedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editedBy" TEXT,

    CONSTRAINT "BudgetEditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BudgetEditLog_projectId_editedAt_idx" ON "BudgetEditLog"("projectId", "editedAt");

-- AddForeignKey
ALTER TABLE "BudgetEditLog" ADD CONSTRAINT "BudgetEditLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
