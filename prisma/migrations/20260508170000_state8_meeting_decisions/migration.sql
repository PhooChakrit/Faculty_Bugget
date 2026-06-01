-- Add meeting decision target for the new STATUS_3 branching flow.
ALTER TABLE "Meeting"
ADD COLUMN "decisionStatusCode" "StatusCode";

-- Move the active close status from STATUS_13 to STATUS_8 for existing data.
UPDATE "Project"
SET "currentStatusCode" = 'STATUS_8'
WHERE "currentStatusCode" = 'STATUS_13';

UPDATE "ProjectStatusRecord"
SET
  "statusCode" = 'STATUS_8',
  "statusLabel" = 'ปิดโครงการ'
WHERE "statusCode" = 'STATUS_13';

UPDATE "Project"
SET "status1" = '8. ปิดโครงการ'
WHERE "status1" LIKE '13.%';
