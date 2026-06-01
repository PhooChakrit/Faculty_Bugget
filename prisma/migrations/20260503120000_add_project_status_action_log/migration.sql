CREATE TABLE "ProjectStatusActionLog" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "statusRecordId" TEXT,
    "actionType" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectStatusActionLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProjectStatusActionLog_projectId_createdAt_idx" ON "ProjectStatusActionLog"("projectId", "createdAt");
CREATE INDEX "ProjectStatusActionLog_statusRecordId_idx" ON "ProjectStatusActionLog"("statusRecordId");
CREATE INDEX "ProjectStatusActionLog_actionType_idx" ON "ProjectStatusActionLog"("actionType");
CREATE INDEX "ProjectStatusActionLog_actorUserId_idx" ON "ProjectStatusActionLog"("actorUserId");

ALTER TABLE "ProjectStatusActionLog"
ADD CONSTRAINT "ProjectStatusActionLog_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProjectStatusActionLog"
ADD CONSTRAINT "ProjectStatusActionLog_statusRecordId_fkey"
FOREIGN KEY ("statusRecordId") REFERENCES "ProjectStatusRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ProjectStatusActionLog"
ADD CONSTRAINT "ProjectStatusActionLog_actorUserId_fkey"
FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
