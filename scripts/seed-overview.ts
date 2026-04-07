import {
  PrismaClient,
  MeetingType,
  ProjectStatus,
} from "../app/generated/prisma/client.js";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { readFileSync } from "fs";
import { join } from "path";

// Initialize Prisma with adapter
const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5433/faculty_bugget";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface MockProjectData {
  id: string;
  receiptNumber: string;
  projectCode: string;
  memoTitle: string;
  department: string;
  projectHead: string;
  startDate: string;
  endDate: string;
  purpose: string;
  boardMeetingNo: string;
  boardMeetingDate: string;
  deanDecisionNo: string;
  deanDecisionDate: string;
  totalBudget: string;
  compensation: string;
  operatingCost: string;
  materialCost: string;
  utilities: string;
  academicFund: string;
  generalReserve: string;
  vendorCode: string;
  costCenter: string;
  maintenanceFee: string;
  electricityFee: string;
  fundOwner: string;
  serviceType: string;
  strategyType: string;
  targetGroup: string;
  participantCount: string;
  projectDescription: string;
  amountGovExternal: string;
  amountPrivateExternal: string;
  amountForeignExternal: string;
  amountUnivRevenue: string;
  status1: string;
  status1Date: string;
  status2: string;
  status2Date: string;
  status3: string;
  status3Date: string;
  status4: string;
  status4Date: string;
  status5: string;
  status5Date: string;
  responsible: string;
  docNumber: string;
  docDate: string;
  docLink: string;
}

// Helper to parse Thai date string to Date
function parseThaiDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.trim() === "") return null;

  // Try parsing various date formats
  // Format: "1 กรกฏคม 2568" or "d/m/yyyy"
  const thaiMonths: Record<string, number> = {
    มกราคม: 0,
    กุมภาพันธ์: 1,
    มีนาคม: 2,
    เมษายน: 3,
    พฤษภาคม: 4,
    มิถุนายน: 5,
    กรกฏคม: 6,
    กรกฎาคม: 6,
    สิงหาคม: 7,
    กันยายน: 8,
    ตุลาคม: 9,
    พฤศจิิกายน: 10,
    พฤศจิกายน: 10,
    ธันวาคม: 11,
  };

  // Try Thai format first: "1 กรกฏคม 2568"
  const thaiMatch = dateStr.match(/(\d+)\s+([^\s]+)\s+(\d+)/);
  if (thaiMatch) {
    const day = parseInt(thaiMatch[1]);
    const monthName = thaiMatch[2];
    const year = parseInt(thaiMatch[3]);

    const month = thaiMonths[monthName];
    if (month !== undefined) {
      // Convert Buddhist year to Gregorian
      const gregorianYear = year > 2400 ? year - 543 : year;
      return new Date(gregorianYear, month, day);
    }
  }

  // Try d/m/yyyy format
  const slashMatch = dateStr.match(/(\d+)\/(\d+)\/(\d+)/);
  if (slashMatch) {
    const day = parseInt(slashMatch[1]);
    const month = parseInt(slashMatch[2]) - 1; // JS months are 0-indexed
    const year = parseInt(slashMatch[3]);
    return new Date(year, month, day);
  }

  // Fallback: try native Date parsing
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
}

// Helper to parse numeric string to number
function parseDecimal(value: string): number | null {
  if (!value || value.trim() === "" || value === "-") return null;

  // Remove commas and parse
  const cleaned = value.replace(/,/g, "");
  const num = parseFloat(cleaned);

  return isNaN(num) ? null : num;
}

async function main() {
  console.log("🌱 Starting seed...");

  // Read mock.json
  const mockDataPath = join(process.cwd(), "public", "mock.json");
  const mockDataRaw = readFileSync(mockDataPath, "utf-8");
  const mockData: MockProjectData[] = JSON.parse(mockDataRaw);

  console.log(`📦 Found ${mockData.length} projects in mock.json`);

  // Create a default user for projects
  console.log("👤 Creating default user...");
  const defaultUser = await prisma.user.upsert({
    where: { email: "default@faculty.ac.th" },
    update: {},
    create: {
      email: "default@faculty.ac.th",
      name: "Default User",
    },
  });

  console.log("🗑️  Clearing existing data...");
  await prisma.meeting.deleteMany({});
  await prisma.project.deleteMany({});

  console.log("📝 Importing projects...");
  let successCount = 0;
  let errorCount = 0;

  for (const item of mockData) {
    try {
      // Create project
      const project = await prisma.project.create({
        data: {
          receiptNumber: item.receiptNumber || null,
          projectCode: item.projectCode || null,
          projectNameThai: item.memoTitle || "Untitled Project",
          projectNameEng: null,
          memoTitle: item.memoTitle || null,
          department: item.department,
          leaderId: defaultUser.id,
          leaderPosition: "หัวหน้าโครงการ",
          startDate: parseThaiDate(item.startDate) || new Date(),
          endDate: parseThaiDate(item.endDate) || new Date(),
          status: ProjectStatus.DRAFT,

          // Budget sources
          budgetSourceExtGov: parseDecimal(item.amountGovExternal),
          budgetSourceExtPrivate: parseDecimal(item.amountPrivateExternal),
          budgetSourceExtForeign: parseDecimal(item.amountForeignExternal),
          budgetSourceInternal: parseDecimal(item.amountUnivRevenue),

          // Expenses
          expenseRemuneration: parseDecimal(item.compensation),
          expenseSupplies: parseDecimal(item.operatingCost),
          expenseMaterials: parseDecimal(item.materialCost),
          expenseUtilities: parseDecimal(item.utilities),
          expenseSubsidy: parseDecimal(item.academicFund),
          expenseReserve: parseDecimal(item.generalReserve),

          // Overview fields
          vendorCode: item.vendorCode || null,
          costCenter: item.costCenter || null,
          fundOwner: item.fundOwner || null,
          maintenanceFeeProposal: parseDecimal("1000"), // Default proposal
          maintenanceFeeActual: parseDecimal(item.maintenanceFee),
          electricityFeeProposal: parseDecimal("500"), // Default proposal
          electricityFeeActual: parseDecimal(item.electricityFee),

          // Project details
          serviceType: item.serviceType || null,
          projectDetails: item.projectDescription || null,
          participantCount: item.participantCount
            ? parseInt(item.participantCount)
            : null,

          // Status tracking
          status1: item.status1 || null,
          status1Date: parseThaiDate(item.status1Date),
          status2: item.status2 || null,
          status2Date: parseThaiDate(item.status2Date),
          status3: item.status3 || null,
          status3Date: parseThaiDate(item.status3Date),
          status4: item.status4 || null,
          status4Date: parseThaiDate(item.status4Date),
          status5: item.status5 || null,
          status5Date: parseThaiDate(item.status5Date),
          responsible: item.responsible || null,
          docNumber: item.docNumber || null,
          docDate: parseThaiDate(item.docDate),
          docLink: item.docLink || null,
        },
      });

      // Create meetings
      const meetings = [];
      if (item.boardMeetingNo) {
        meetings.push({
          projectId: project.id,
          type: MeetingType.BOARD,
          no: item.boardMeetingNo,
          date: parseThaiDate(item.boardMeetingDate) || new Date(),
          purpose: item.purpose || null,
        });
      }
      if (item.deanDecisionNo) {
        meetings.push({
          projectId: project.id,
          type: MeetingType.DEAN,
          no: item.deanDecisionNo,
          date: parseThaiDate(item.deanDecisionDate) || new Date(),
          purpose: item.purpose || null,
        });
      }

      if (meetings.length > 0) {
        await prisma.meeting.createMany({
          data: meetings,
        });
      }

      successCount++;
      console.log(`✅ Imported: ${item.projectCode || item.id}`);
    } catch (error) {
      errorCount++;
      console.error(
        `❌ Failed to import ${item.projectCode || item.id}:`,
        error,
      );
    }
  }

  console.log(`\n✨ Seed completed!`);
  console.log(`   Success: ${successCount}`);
  console.log(`   Errors: ${errorCount}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
