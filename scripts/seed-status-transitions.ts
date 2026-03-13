import { PrismaClient, StatusCode } from "../app/generated/prisma/client.js";
import { allowedTransitions } from "../lib/status-constants";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// Initialize Prisma with adapter
const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5433/faculty_bugget";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting status system seed...");

  // Clear existing transitions
  console.log("🗑️  Clearing existing transitions...");
  await prisma.statusTransition.deleteMany({});

  // Seed transitions
  console.log("📝 Seeding status transitions...");
  let count = 0;

  for (const transition of allowedTransitions) {
    await prisma.statusTransition.create({
      data: {
        fromStatus: transition.fromStatus as StatusCode,
        toStatus: transition.toStatus as StatusCode,
        label: transition.label,
        condition: transition.condition || null,
        order: transition.order || 0,
      },
    });
    count++;
  }

  console.log(`✅ Seeded ${count} status transitions`);

  // Summary
  console.log("\n📊 Status Transition Summary:");
  const transitionsByFrom = await prisma.statusTransition.groupBy({
    by: ["fromStatus"],
    _count: true,
  });

  for (const group of transitionsByFrom) {
    console.log(`  ${group.fromStatus}: ${group._count} transitions`);
  }

  console.log("\n✨ Status system seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
