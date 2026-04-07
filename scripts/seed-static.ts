import "dotenv/config";
import prisma from "@/lib/prisma";

/** Matches `leaderId` in features/add-project/index.tsx until the form uses auth / user picker */
const DEV_LEADER_USER_ID = "cmlfoz51o0000voxek4yjqxhg";

async function main() {
  console.log("Seeding static data...");

  await prisma.user.upsert({
    where: { id: DEV_LEADER_USER_ID },
    update: {},
    create: {
      id: DEV_LEADER_USER_ID,
      email: "dev-leader@faculty.local",
      name: "หัวหน้าโครงการ (dev seed)",
    },
  });
  console.log("Dev leader user seeded.");

  // Strategies from features/add-project/index.tsx
  const strategies = [
    { id: "0", name: "ไม่สอดคล้องกับยุทธศาสตร์ใด ๆ" },
    { id: "1", name: "INTERNATIONAL GROWTH" },
    { id: "2", name: "IMPACTFUL GROWTH" },
    { id: "3", name: "INTERNAL GROWTH" },
    { id: "4", name: "INTEGRATED GROWTH" },
    { id: "5", name: "สอดคล้องกับยุทธศาสตร์ส่วนงาน" },
  ];

  for (const strategy of strategies) {
    await prisma.strategy.upsert({
      where: { id: strategy.id },
      update: { name: strategy.name },
      create: { id: strategy.id, name: strategy.name },
    });
  }
  console.log("Strategies seeded.");

  // TargetGroups from features/add-project/index.tsx
  const targetGroups = [
    { id: "1", name: "ประชาคมจุฬาฯ" },
    { id: "2", name: "ชุมชน" },
    { id: "3", name: "หน่วยงานภายนอกภาครัฐ" },
    { id: "4", name: "หน่วยงานภายนอกภาคเอกชน/อุตสาหกรรม" },
  ];

  for (const group of targetGroups) {
    await prisma.targetGroup.upsert({
      where: { id: group.id },
      update: { name: group.name },
      create: { id: group.id, name: group.name },
    });
  }
  console.log("TargetGroups seeded.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
