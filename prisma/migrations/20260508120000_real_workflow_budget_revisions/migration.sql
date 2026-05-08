-- Real workflow remap and budget revision sub-flow.

ALTER TYPE "ClosureRole" ADD VALUE IF NOT EXISTS 'FINANCE';

CREATE TYPE "BudgetRevisionStatus" AS ENUM (
  'BR_DRAFT',
  'BR_SUBMITTED',
  'BR_RESEARCH_CHECKED',
  'BR_WAITING_MEETING',
  'BR_BOARD_APPROVED',
  'BR_DEAN_APPROVED',
  'BR_APPLIED',
  'BR_REJECTED',
  'BR_CANCELLED'
);

CREATE TYPE "BudgetApprovalRoute" AS ENUM ('BOARD', 'DEAN');

CREATE TABLE "BudgetRevision" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "status" "BudgetRevisionStatus" NOT NULL DEFAULT 'BR_DRAFT',
  "originalBudgetSnapshot" JSONB NOT NULL,
  "proposedBudget" JSONB NOT NULL,
  "reason" TEXT NOT NULL,
  "closeAfterApproval" BOOLEAN NOT NULL DEFAULT false,
  "meetingNo" TEXT,
  "meetingDate" TIMESTAMP(3),
  "meetingNote" TEXT,
  "approvalRoute" "BudgetApprovalRoute",
  "deanApprovalFileName" TEXT,
  "deanApprovalFileUrl" TEXT,
  "affectsCostCenter" BOOLEAN NOT NULL DEFAULT false,
  "affectsVendor" BOOLEAN NOT NULL DEFAULT false,
  "createdBy" TEXT NOT NULL,
  "submittedAt" TIMESTAMP(3),
  "reviewedBy" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "approvedBy" TEXT,
  "approvedAt" TIMESTAMP(3),
  "appliedBy" TEXT,
  "appliedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "BudgetRevision_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BudgetRevisionActionLog" (
  "id" TEXT NOT NULL,
  "revisionId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "actionType" TEXT NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "actorRole" TEXT NOT NULL,
  "fromStatus" TEXT,
  "toStatus" TEXT,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "BudgetRevisionActionLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BudgetRevision_projectId_status_idx" ON "BudgetRevision"("projectId", "status");
CREATE INDEX "BudgetRevision_createdBy_idx" ON "BudgetRevision"("createdBy");
CREATE INDEX "BudgetRevisionActionLog_revisionId_createdAt_idx" ON "BudgetRevisionActionLog"("revisionId", "createdAt");
CREATE INDEX "BudgetRevisionActionLog_projectId_createdAt_idx" ON "BudgetRevisionActionLog"("projectId", "createdAt");
CREATE INDEX "BudgetRevisionActionLog_actorUserId_idx" ON "BudgetRevisionActionLog"("actorUserId");

ALTER TABLE "BudgetRevision"
  ADD CONSTRAINT "BudgetRevision_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BudgetRevision"
  ADD CONSTRAINT "BudgetRevision_createdBy_fkey"
  FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "BudgetRevision"
  ADD CONSTRAINT "BudgetRevision_reviewedBy_fkey"
  FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "BudgetRevision"
  ADD CONSTRAINT "BudgetRevision_approvedBy_fkey"
  FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "BudgetRevision"
  ADD CONSTRAINT "BudgetRevision_appliedBy_fkey"
  FOREIGN KEY ("appliedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "BudgetRevisionActionLog"
  ADD CONSTRAINT "BudgetRevisionActionLog_revisionId_fkey"
  FOREIGN KEY ("revisionId") REFERENCES "BudgetRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BudgetRevisionActionLog"
  ADD CONSTRAINT "BudgetRevisionActionLog_actorUserId_fkey"
  FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill existing active workflow status codes into the new business numbering.
UPDATE "Project"
SET "currentStatusCode" = CASE
  WHEN "currentStatusCode" = 'STATUS_6' THEN 'STATUS_4'
  WHEN "currentStatusCode" = 'STATUS_7' THEN 'STATUS_5'
  WHEN "currentStatusCode" = 'STATUS_8' THEN 'STATUS_6'
  WHEN "currentStatusCode" = 'STATUS_9' THEN 'STATUS_7'
  WHEN "currentStatusCode" = 'STATUS_10' AND EXISTS (
    SELECT 1 FROM "Meeting" m WHERE m."projectId" = "Project"."id" AND m."type" = 'DEAN'
  ) THEN 'STATUS_7'
  WHEN "currentStatusCode" = 'STATUS_10' THEN 'STATUS_6'
  ELSE "currentStatusCode"
END
WHERE "currentStatusCode" IN ('STATUS_6', 'STATUS_7', 'STATUS_8', 'STATUS_9', 'STATUS_10');

UPDATE "ProjectStatusRecord"
SET "statusCode" = CASE
  WHEN "statusCode" = 'STATUS_6' THEN 'STATUS_4'::"StatusCode"
  WHEN "statusCode" = 'STATUS_7' THEN 'STATUS_5'::"StatusCode"
  WHEN "statusCode" = 'STATUS_8' THEN 'STATUS_6'::"StatusCode"
  WHEN "statusCode" = 'STATUS_9' THEN 'STATUS_7'::"StatusCode"
  WHEN "statusCode" = 'STATUS_10' AND EXISTS (
    SELECT 1 FROM "Meeting" m WHERE m."projectId" = "ProjectStatusRecord"."projectId" AND m."type" = 'DEAN'
  ) THEN 'STATUS_7'::"StatusCode"
  WHEN "statusCode" = 'STATUS_10' THEN 'STATUS_6'::"StatusCode"
  ELSE "statusCode"
END
WHERE "statusCode" IN ('STATUS_6', 'STATUS_7', 'STATUS_8', 'STATUS_9', 'STATUS_10');
