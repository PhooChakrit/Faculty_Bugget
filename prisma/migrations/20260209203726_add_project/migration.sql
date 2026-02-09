-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "IncomeType" AS ENUM ('SUPPORT', 'REGISTRATION');

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "receiptNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "projectNameThai" TEXT NOT NULL,
    "projectNameEng" TEXT,
    "leaderId" TEXT NOT NULL,
    "leaderPosition" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "coLeaderId" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "background" TEXT,
    "projectDetails" TEXT,
    "objectives" TEXT,
    "scope" TEXT,
    "implementationPlan" TEXT,
    "serviceType" TEXT,
    "participantCount" INTEGER,
    "venue" TEXT,
    "committee" TEXT,
    "expectedBenefits" TEXT,
    "projectEvaluation" TEXT,
    "budgetSourceExtGov" DECIMAL(15,2),
    "budgetSourceExtPrivate" DECIMAL(15,2),
    "budgetSourceExtForeign" DECIMAL(15,2),
    "budgetSourceInternal" DECIMAL(15,2),
    "expenseRemuneration" DECIMAL(15,2),
    "expenseSupplies" DECIMAL(15,2),
    "expenseMaterials" DECIMAL(15,2),
    "expenseUtilities" DECIMAL(15,2),
    "expenseSubsidy" DECIMAL(15,2),
    "expenseReserve" DECIMAL(15,2),
    "note2" BOOLEAN NOT NULL DEFAULT false,
    "note3" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TargetGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "TargetGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectTargetGroup" (
    "projectId" TEXT NOT NULL,
    "targetGroupId" TEXT NOT NULL,

    CONSTRAINT "ProjectTargetGroup_pkey" PRIMARY KEY ("projectId","targetGroupId")
);

-- CreateTable
CREATE TABLE "Strategy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Strategy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectStrategy" (
    "projectId" TEXT NOT NULL,
    "strategyId" TEXT NOT NULL,

    CONSTRAINT "ProjectStrategy_pkey" PRIMARY KEY ("projectId","strategyId")
);

-- CreateTable
CREATE TABLE "IncomeItem" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" "IncomeType" NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncomeItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectCollaborator" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectCollaborator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectManager" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectManager_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Project_receiptNumber_key" ON "Project"("receiptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "TargetGroup_name_key" ON "TargetGroup"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Strategy_name_key" ON "Strategy"("name");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_coLeaderId_fkey" FOREIGN KEY ("coLeaderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTargetGroup" ADD CONSTRAINT "ProjectTargetGroup_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTargetGroup" ADD CONSTRAINT "ProjectTargetGroup_targetGroupId_fkey" FOREIGN KEY ("targetGroupId") REFERENCES "TargetGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectStrategy" ADD CONSTRAINT "ProjectStrategy_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectStrategy" ADD CONSTRAINT "ProjectStrategy_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "Strategy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncomeItem" ADD CONSTRAINT "IncomeItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectCollaborator" ADD CONSTRAINT "ProjectCollaborator_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectManager" ADD CONSTRAINT "ProjectManager_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
