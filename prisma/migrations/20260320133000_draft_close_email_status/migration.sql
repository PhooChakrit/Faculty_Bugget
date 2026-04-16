-- Add new enums
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DraftState') THEN
    CREATE TYPE "DraftState" AS ENUM ('DRAFT', 'SUBMITTED');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ClosureRole') THEN
    CREATE TYPE "ClosureRole" AS ENUM ('RESEARCH', 'PHYSICAL');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EmailDeliveryStatus') THEN
    CREATE TYPE "EmailDeliveryStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'SKIPPED');
  END IF;
END
$$;

-- Extend existing status enum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum
    WHERE enumlabel = 'DRAFT'
      AND enumtypid = '"StatusCode"'::regtype
  ) THEN
    ALTER TYPE "StatusCode" ADD VALUE 'DRAFT';
  END IF;
END
$$;

-- Project new workflow fields
ALTER TABLE "Project"
  ADD COLUMN IF NOT EXISTS "draftState" "DraftState" NOT NULL DEFAULT 'SUBMITTED',
  ADD COLUMN IF NOT EXISTS "draftSavedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "submittedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "submittedByRole" TEXT;

-- Completion table
CREATE TABLE IF NOT EXISTS "ProjectRoleCompletion" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "role" "ClosureRole" NOT NULL,
  "isComplete" BOOLEAN NOT NULL DEFAULT false,
  "completedAt" TIMESTAMP(3),
  "completedBy" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProjectRoleCompletion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ProjectRoleCompletion_projectId_role_key"
  ON "ProjectRoleCompletion" ("projectId", "role");

CREATE INDEX IF NOT EXISTS "ProjectRoleCompletion_projectId_isComplete_idx"
  ON "ProjectRoleCompletion" ("projectId", "isComplete");

-- Approval email logs
CREATE TABLE IF NOT EXISTS "ApprovalEmailLog" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "recipient" TEXT NOT NULL,
  "recipientRole" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "status" "EmailDeliveryStatus" NOT NULL DEFAULT 'PENDING',
  "errorMessage" TEXT,
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ApprovalEmailLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ApprovalEmailLog_projectId_createdAt_idx"
  ON "ApprovalEmailLog" ("projectId", "createdAt");

CREATE INDEX IF NOT EXISTS "ApprovalEmailLog_status_idx"
  ON "ApprovalEmailLog" ("status");

-- Foreign keys
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProjectRoleCompletion_projectId_fkey'
  ) THEN
    ALTER TABLE "ProjectRoleCompletion"
      ADD CONSTRAINT "ProjectRoleCompletion_projectId_fkey"
      FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProjectRoleCompletion_completedBy_fkey'
  ) THEN
    ALTER TABLE "ProjectRoleCompletion"
      ADD CONSTRAINT "ProjectRoleCompletion_completedBy_fkey"
      FOREIGN KEY ("completedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ApprovalEmailLog_projectId_fkey'
  ) THEN
    ALTER TABLE "ApprovalEmailLog"
      ADD CONSTRAINT "ApprovalEmailLog_projectId_fkey"
      FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

-- Backfill status 11/12 to 10 in current status code
UPDATE "Project"
SET "currentStatusCode" = 'STATUS_10'
WHERE "currentStatusCode" IN ('STATUS_11', 'STATUS_12');

-- Backfill free-text overview status1 display for 11/12 rows
UPDATE "Project"
SET "status1" = '10. อนุมัติโครงการ'
WHERE "status1" LIKE '11.%' OR "status1" LIKE '12.%';

-- Backfill default role completion rows for existing projects
INSERT INTO "ProjectRoleCompletion" (
  "id", "projectId", "role", "isComplete", "createdAt", "updatedAt"
)
SELECT
  md5(random()::text || clock_timestamp()::text || p."id" || role_data.role::text),
  p."id",
  role_data.role,
  false,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Project" p
CROSS JOIN (VALUES ('RESEARCH'::"ClosureRole"), ('PHYSICAL'::"ClosureRole")) AS role_data(role)
ON CONFLICT ("projectId", "role") DO NOTHING;
