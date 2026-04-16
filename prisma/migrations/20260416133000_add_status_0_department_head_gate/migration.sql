-- Add STATUS_0 for department-head approval gate before STATUS_1
ALTER TYPE "StatusCode" ADD VALUE IF NOT EXISTS 'STATUS_0';

-- Keep project drafts in DRAFT by default; STATUS_0 is entered via submit action
ALTER TABLE "Project"
ALTER COLUMN "currentStatusCode" SET DEFAULT 'DRAFT';
