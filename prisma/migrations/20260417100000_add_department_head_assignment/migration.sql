-- Add enforceable department -> head-of-department assignment mapping
CREATE TABLE "DepartmentHeadAssignment" (
    "id" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "headUserId" TEXT NOT NULL,
    "assignedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DepartmentHeadAssignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DepartmentHeadAssignment_department_key" ON "DepartmentHeadAssignment"("department");
CREATE INDEX "DepartmentHeadAssignment_headUserId_idx" ON "DepartmentHeadAssignment"("headUserId");
CREATE INDEX "DepartmentHeadAssignment_assignedByUserId_idx" ON "DepartmentHeadAssignment"("assignedByUserId");

ALTER TABLE "DepartmentHeadAssignment"
ADD CONSTRAINT "DepartmentHeadAssignment_headUserId_fkey"
FOREIGN KEY ("headUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "DepartmentHeadAssignment"
ADD CONSTRAINT "DepartmentHeadAssignment_assignedByUserId_fkey"
FOREIGN KEY ("assignedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
