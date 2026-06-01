ALTER TABLE "public"."Project"
ADD COLUMN "maintenanceFeeActualFile" BYTEA,
ADD COLUMN "maintenanceFeeActualFileName" TEXT,
ADD COLUMN "maintenanceFeeActualFileType" TEXT,
ADD COLUMN "maintenanceFeeActualUploadedAt" TIMESTAMP(3),
ADD COLUMN "electricityFeeActualFile" BYTEA,
ADD COLUMN "electricityFeeActualFileName" TEXT,
ADD COLUMN "electricityFeeActualFileType" TEXT,
ADD COLUMN "electricityFeeActualUploadedAt" TIMESTAMP(3);
