-- CreateTable
CREATE TABLE "RoleEmailSetting" (
    "role" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoleEmailSetting_pkey" PRIMARY KEY ("role")
);
