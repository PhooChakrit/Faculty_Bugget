import { PrismaClient } from "../app/generated/prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const STATUS_1_LABEL =
  "1. งานบริหารวิจัยและบริการวิชาการ ดำเนินการตรวจสอบ/แก้ไข";

async function main() {
  const result = await prisma.project.updateMany({
    data: {
      status1: STATUS_1_LABEL,
      currentStatusCode: "STATUS_1",
    },
  });

  console.log(`Updated projects: ${result.count}`);

  const sample = await prisma.project.findMany({
    take: 5,
    select: { id: true, status1: true, currentStatusCode: true },
    orderBy: { createdAt: "desc" },
  });

  console.log("Sample rows:");
  console.log(JSON.stringify(sample, null, 2));
}

main()
  .catch((error) => {
    console.error("Reset failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
