import "dotenv/config";
import prisma from "@/lib/prisma";
import { statusLabels } from "@/lib/status-constants";
import type { StatusCode } from "@/app/generated/prisma/client";

/**
 * สร้างโครงการตัวอย่าง 1 รายการต่อสถานะใน workflow หลัก
 * เพื่อทดสอบ email template ทุกสถานะ + หน้า /overviews และ /expense-dashboard
 *
 * รันซ้ำได้ (idempotent): ลบโครงการ demo เดิม (id ขึ้นต้น "demo-") แล้วสร้างใหม่
 *
 *   npx tsx scripts/seed-demo-projects.ts
 */

const DEV_LEADER_USER_ID = "cmlfoz51o0000voxek4yjqxhg";

// สถานะที่จะสร้างโครงการตัวอย่าง (เรียงตาม workflow)
const DEMO_STATUSES: StatusCode[] = [
  "DRAFT",
  "STATUS_0",
  "STATUS_1",
  "STATUS_2",
  "STATUS_3",
  "STATUS_4",
  "STATUS_5",
  "STATUS_6",
  "STATUS_7",
  "STATUS_8",
  "RECALL",
];

// สถานะที่แอปจริง generate projectCode ให้ (ตั้งแต่อนุมัติเป็นต้นไป)
const CODE_STATUSES = new Set<StatusCode>(["STATUS_6", "STATUS_7", "STATUS_8"]);

async function main() {
  console.log("Seeding demo projects (one per status)...");

  // ต้องมี dev leader ก่อน (seed-static สร้างให้แล้ว แต่กันพลาด)
  await prisma.user.upsert({
    where: { id: DEV_LEADER_USER_ID },
    update: {},
    create: {
      id: DEV_LEADER_USER_ID,
      email: "dev-leader@faculty.local",
      name: "หัวหน้าโครงการ (dev seed)",
    },
  });

  // ลบ demo เดิม (cascade ลบ ProjectStatusRecord ให้เอง)
  const deleted = await prisma.project.deleteMany({
    where: { id: { startsWith: "demo-" } },
  });
  if (deleted.count > 0) {
    console.log(`Removed ${deleted.count} existing demo project(s).`);
  }

  const now = new Date();
  let codeSeq = 69101;

  for (const status of DEMO_STATUSES) {
    const id = `demo-${status}`;
    const label = statusLabels[status] ?? status;
    const isDraft = status === "DRAFT";

    // 1. สร้างโครงการ (ยังไม่ผูก currentStatusId)
    await prisma.project.create({
      data: {
        id,
        projectNameThai: `[ตัวอย่าง] ${label}`,
        projectNameEng: `[Demo] ${status}`,
        leaderId: DEV_LEADER_USER_ID,
        leaderPosition: "อาจารย์",
        department: "sci",
        startDate: new Date("2026-08-01"),
        endDate: new Date("2026-09-30"),
        background: "โครงการตัวอย่างสำหรับทดสอบระบบ",
        objectives: "เพื่อทดสอบ email template และหน้า overview ในแต่ละสถานะ",
        projectCode: CODE_STATUSES.has(status) ? String(codeSeq++) : null,
        currentStatusCode: status,
        draftState: isDraft ? "DRAFT" : "SUBMITTED",
        submittedAt: isDraft ? null : now,
        // งบประมาณตัวอย่าง (ให้ expense-dashboard มีข้อมูล)
        budgetSourceInternal: 100000,
        expenseRemuneration: 30000,
        expenseSupplies: 20000,
        expenseMaterials: 15000,
        expenseUtilities: 10000,
        expenseSubsidy: 15000,
        expenseReserve: 10000,
      },
    });

    // 2. สร้าง status record + ผูกเป็น current
    const record = await prisma.projectStatusRecord.create({
      data: {
        projectId: id,
        statusCode: status,
        statusLabel: label,
        enteredBy: DEV_LEADER_USER_ID,
        enteredAt: now,
      },
    });

    await prisma.project.update({
      where: { id },
      data: { currentStatusId: record.id },
    });

    console.log(`  ✓ ${status.padEnd(10)} → ${id}`);
  }

  console.log(`Done. Seeded ${DEMO_STATUSES.length} demo projects.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
