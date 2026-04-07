-- Add STATUS_0 (draft step) to workflow enum, before STATUS_1
ALTER TYPE "StatusCode" ADD VALUE 'STATUS_0' BEFORE 'STATUS_1';

-- New projects default to draft workflow step
ALTER TABLE "Project" ALTER COLUMN "currentStatusCode" SET DEFAULT 'STATUS_0';
