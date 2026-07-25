/**
 * Seed realistic mock data for the Faculty Budget system.
 *
 * Creates leader users, department-head assignments for every department,
 * and 14 projects spread across the whole status workflow
 * (DRAFT -> STATUS_0 -> ... -> STATUS_8) with full status history,
 * meetings, income items, role completions and notifications.
 *
 * Run with: npx tsx scripts/seed-mock-data.ts
 */
import "dotenv/config";
import {
  PrismaClient,
  StatusCode,
  MeetingType,
  ProjectStatus,
  ClosureRole,
  NotificationType,
} from "../app/generated/prisma/client.js";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { statusLabels } from "../lib/status-constants";
import { mockActorByRole } from "../lib/mock-actors";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5433/faculty_bugget";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ---------------------------------------------------------------------------
// Reference data
// ---------------------------------------------------------------------------

const OWNER = mockActorByRole["USER"].id; // ผู้เสนอโครงการ
const DEPT_HEAD = mockActorByRole["ภาควิชาวิทยาศาสตร์"].id;
const RESEARCH_STAFF = mockActorByRole["งานวิจัย"].id;
const RESEARCH_HEAD = mockActorByRole["หัวหน้าฝ่ายวิจัย"].id;
const PLANNING = mockActorByRole["งานแผน"].id;
const FINANCE = mockActorByRole["งานคลัง"].id;
const PHYSICAL = mockActorByRole["กายภาพ"].id;

const leaders = [
  {
    id: "leader-chem-somying",
    email: "somying.k@sci-faculty.ac.th",
    name: "รองศาสตราจารย์ ดร.สมหญิง เกียรติกุล",
  },
  {
    id: "leader-bio-prasert",
    email: "prasert.w@sci-faculty.ac.th",
    name: "ศาสตราจารย์ ดร.ประเสริฐ วงศ์วิทยา",
  },
  {
    id: "leader-phy-anucha",
    email: "anucha.r@sci-faculty.ac.th",
    name: "ผู้ช่วยศาสตราจารย์ ดร.อนุชา รัตนพงษ์",
  },
  {
    id: "leader-math-wilai",
    email: "wilai.s@sci-faculty.ac.th",
    name: "รองศาสตราจารย์ ดร.วิไล ศรีสุวรรณ",
  },
  {
    id: "leader-sci-kamon",
    email: "kamon.t@sci-faculty.ac.th",
    name: "ผู้ช่วยศาสตราจารย์ ดร.กมล ธาราทิพย์",
  },
];

// Workflow chain used to build status history for each project
const CHAIN_BOARD: StatusCode[] = [
  StatusCode.DRAFT,
  StatusCode.STATUS_0,
  StatusCode.STATUS_1,
  StatusCode.STATUS_2,
  StatusCode.STATUS_3,
  StatusCode.STATUS_4,
  StatusCode.STATUS_6,
  StatusCode.STATUS_8,
];
const CHAIN_DEAN: StatusCode[] = [
  StatusCode.DRAFT,
  StatusCode.STATUS_0,
  StatusCode.STATUS_1,
  StatusCode.STATUS_2,
  StatusCode.STATUS_3,
  StatusCode.STATUS_5,
  StatusCode.STATUS_7,
  StatusCode.STATUS_8,
];

const enteredByFor: Record<string, string> = {
  [StatusCode.DRAFT]: OWNER,
  [StatusCode.STATUS_0]: OWNER,
  [StatusCode.STATUS_1]: DEPT_HEAD,
  [StatusCode.STATUS_2]: RESEARCH_STAFF,
  [StatusCode.STATUS_3]: RESEARCH_HEAD,
  [StatusCode.STATUS_4]: RESEARCH_HEAD,
  [StatusCode.STATUS_5]: RESEARCH_HEAD,
  [StatusCode.STATUS_6]: PLANNING,
  [StatusCode.STATUS_7]: PLANNING,
  [StatusCode.STATUS_8]: RESEARCH_HEAD,
};

interface MockProject {
  id: string;
  nameThai: string;
  nameEng?: string;
  department: "sci" | "chem" | "bio" | "phy" | "math";
  leaderId: string;
  route: "BOARD" | "DEAN";
  /** Status the project currently sits in */
  current: StatusCode;
  draft?: boolean; // still a saved draft (never submitted)
  startDate: string; // ISO
  endDate: string;
  serviceType: string;
  participantCount: number;
  venue: string;
  fundOwner: string;
  // budget sources (THB)
  srcGov?: number;
  srcPrivate?: number;
  srcInternal?: number;
  // 6 expense categories
  expRemuneration?: number;
  expSupplies?: number;
  expMaterials?: number;
  expUtilities?: number;
  expSubsidy?: number;
  expReserve?: number;
  maintenanceProposal?: number;
  electricityProposal?: number;
  maintenanceActual?: number;
  electricityActual?: number;
  vendorCode?: string;
  costCenter?: string;
  docNumber?: string;
  docLink?: string;
  incomes?: { type: "SUPPORT" | "REGISTRATION" | "OTHER"; name: string; amount: number }[];
  objectives?: string;
  background?: string;
}

const projects: MockProject[] = [
  {
    id: "69001",
    nameThai:
      "โครงการอบรมเชิงปฏิบัติการเคมีวิเคราะห์ขั้นสูงสำหรับครูมัธยมศึกษา ประจำปี 2569",
    nameEng: "Advanced Analytical Chemistry Workshop for High School Teachers",
    department: "chem",
    leaderId: "leader-chem-somying",
    route: "BOARD",
    current: StatusCode.STATUS_8,
    startDate: "2025-11-03",
    endDate: "2026-01-30",
    serviceType: "1",
    participantCount: 60,
    venue: "อาคารเคมี 2 คณะวิทยาศาสตร์",
    fundOwner: "สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน (สพฐ.)",
    srcGov: 285000,
    expRemuneration: 120000,
    expSupplies: 65000,
    expMaterials: 48000,
    expUtilities: 14250,
    expSubsidy: 28500,
    expReserve: 9250,
    maintenanceProposal: 8000,
    electricityProposal: 6250,
    maintenanceActual: 7420,
    electricityActual: 5980,
    vendorCode: "3011245",
    costCenter: "CC-CHEM-6901",
    docNumber: "อว 64.11/0125",
    docLink: "https://drive.example.com/docs/69001",
    incomes: [
      { type: "SUPPORT", name: "เงินอุดหนุนจาก สพฐ.", amount: 285000 },
    ],
    objectives:
      "เพื่อพัฒนาทักษะการวิเคราะห์ทางเคมีสมัยใหม่ให้แก่ครูผู้สอนระดับมัธยมศึกษาตอนปลาย",
    background:
      "ครูวิทยาศาสตร์จำนวนมากยังขาดโอกาสเข้าถึงเครื่องมือวิเคราะห์ขั้นสูง คณะจึงจัดอบรมเชิงปฏิบัติการโดยใช้ห้องปฏิบัติการของภาควิชาเคมี",
  },
  {
    id: "69002",
    nameThai: "โครงการค่ายโอลิมปิกวิชาการ สาขาชีววิทยา (สอวน.) ค่าย 1 ปีการศึกษา 2569",
    department: "bio",
    leaderId: "leader-bio-prasert",
    route: "DEAN",
    current: StatusCode.STATUS_8,
    startDate: "2025-10-06",
    endDate: "2025-10-20",
    serviceType: "1",
    participantCount: 35,
    venue: "อาคารชีววิทยา 1 และหอพักนิสิต",
    fundOwner: "มูลนิธิ สอวน.",
    srcPrivate: 420000,
    expRemuneration: 180000,
    expSupplies: 95000,
    expMaterials: 72000,
    expUtilities: 21000,
    expSubsidy: 42000,
    expReserve: 10000,
    maintenanceProposal: 12000,
    electricityProposal: 9000,
    maintenanceActual: 12800,
    electricityActual: 8650,
    vendorCode: "3012870",
    costCenter: "CC-BIO-6902",
    docNumber: "อว 64.12/0348",
    docLink: "https://drive.example.com/docs/69002",
    incomes: [
      { type: "SUPPORT", name: "เงินสนับสนุนจากมูลนิธิ สอวน.", amount: 420000 },
    ],
    objectives: "เพื่อคัดเลือกและพัฒนานักเรียนผู้แทนศูนย์เข้าแข่งขันชีววิทยาโอลิมปิกระดับชาติ",
  },
  {
    id: "69003",
    nameThai: "โครงการบริการตรวจวิเคราะห์คุณภาพน้ำและสิ่งแวดล้อมแก่ชุมชนรอบมหาวิทยาลัย",
    department: "sci",
    leaderId: "leader-sci-kamon",
    route: "BOARD",
    current: StatusCode.STATUS_6,
    startDate: "2026-01-15",
    endDate: "2026-09-30",
    serviceType: "4",
    participantCount: 120,
    venue: "ศูนย์เครื่องมือวิจัยวิทยาศาสตร์",
    fundOwner: "กรมควบคุมมลพิษ",
    srcGov: 750000,
    expRemuneration: 280000,
    expSupplies: 150000,
    expMaterials: 185000,
    expUtilities: 37500,
    expSubsidy: 75000,
    expReserve: 22500,
    maintenanceProposal: 20000,
    electricityProposal: 17500,
    vendorCode: "3010556",
    costCenter: "CC-SCI-6903",
    docNumber: "อว 64.10/0512",
    docLink: "https://drive.example.com/docs/69003",
    incomes: [
      { type: "SUPPORT", name: "งบสนับสนุนจากกรมควบคุมมลพิษ", amount: 600000 },
      { type: "REGISTRATION", name: "ค่าบริการตรวจวิเคราะห์ตัวอย่าง", amount: 150000 },
    ],
    objectives: "เพื่อให้บริการตรวจวิเคราะห์คุณภาพน้ำผิวดินและน้ำใต้ดินแก่ชุมชนและหน่วยงานท้องถิ่น",
  },
  {
    id: "69004",
    nameThai: "โครงการอบรม Python และ Data Science สำหรับบุคลากรภาครัฐ รุ่นที่ 3",
    nameEng: "Python for Data Science Bootcamp for Government Officers (Batch 3)",
    department: "math",
    leaderId: "leader-math-wilai",
    route: "DEAN",
    current: StatusCode.STATUS_7,
    startDate: "2026-03-02",
    endDate: "2026-08-28",
    serviceType: "1",
    participantCount: 80,
    venue: "ห้องปฏิบัติการคอมพิวเตอร์ อาคารคณิตศาสตร์",
    fundOwner: "สำนักงาน ก.พ.",
    srcGov: 960000,
    expRemuneration: 420000,
    expSupplies: 190000,
    expMaterials: 96000,
    expUtilities: 48000,
    expSubsidy: 96000,
    expReserve: 110000,
    maintenanceProposal: 25000,
    electricityProposal: 23000,
    vendorCode: "3013391",
    costCenter: "CC-MATH-6904",
    docNumber: "อว 64.14/0533",
    docLink: "https://drive.example.com/docs/69004",
    incomes: [
      { type: "SUPPORT", name: "งบอุดหนุนจากสำนักงาน ก.พ.", amount: 760000 },
      { type: "REGISTRATION", name: "ค่าลงทะเบียนผู้เข้าอบรม", amount: 200000 },
    ],
  },
  {
    id: "69005",
    nameThai: "โครงการบริการทดสอบวัสดุด้วยเทคนิค X-ray Diffraction แก่ภาคอุตสาหกรรม",
    department: "phy",
    leaderId: "leader-phy-anucha",
    route: "BOARD",
    current: StatusCode.STATUS_6,
    startDate: "2026-02-02",
    endDate: "2026-12-25",
    serviceType: "4",
    participantCount: 45,
    venue: "ห้องปฏิบัติการฟิสิกส์ประยุกต์ ชั้น 4",
    fundOwner: "บริษัท ไทยแอดวานซ์แมททีเรียล จำกัด",
    srcPrivate: 1250000,
    expRemuneration: 450000,
    expSupplies: 260000,
    expMaterials: 310000,
    expUtilities: 62500,
    expSubsidy: 125000,
    expReserve: 42500,
    maintenanceProposal: 35000,
    electricityProposal: 27500,
    vendorCode: "3014220",
    costCenter: "CC-PHY-6905",
    docNumber: "อว 64.13/0601",
    docLink: "https://drive.example.com/docs/69005",
    incomes: [
      { type: "OTHER", name: "ค่าบริการทดสอบตัวอย่างวัสดุ", amount: 1250000 },
    ],
  },
  {
    id: "69006",
    nameThai: "โครงการอบรมความปลอดภัยในห้องปฏิบัติการเคมีสำหรับผู้ประกอบการ SME",
    department: "chem",
    leaderId: "leader-chem-somying",
    route: "BOARD",
    current: StatusCode.STATUS_4,
    startDate: "2026-08-03",
    endDate: "2026-10-30",
    serviceType: "1",
    participantCount: 50,
    venue: "อาคารเคมี 1 คณะวิทยาศาสตร์",
    fundOwner: "สำนักงานส่งเสริมวิสาหกิจขนาดกลางและขนาดย่อม",
    srcGov: 340000,
    expRemuneration: 150000,
    expSupplies: 78000,
    expMaterials: 51000,
    expUtilities: 17000,
    expSubsidy: 34000,
    expReserve: 10000,
    maintenanceProposal: 9500,
    electricityProposal: 7500,
    incomes: [
      { type: "SUPPORT", name: "งบสนับสนุนจาก สสว.", amount: 340000 },
    ],
  },
  {
    id: "69007",
    nameThai: "โครงการคลินิกให้คำปรึกษาทางสถิติและการวิเคราะห์ข้อมูลแก่นักวิจัย",
    department: "math",
    leaderId: "leader-math-wilai",
    route: "DEAN",
    current: StatusCode.STATUS_5,
    startDate: "2026-08-17",
    endDate: "2027-03-31",
    serviceType: "3",
    participantCount: 150,
    venue: "ภาควิชาคณิตศาสตร์ (ออนไลน์ร่วมด้วย)",
    fundOwner: "เงินรายได้ส่วนงาน",
    srcInternal: 180000,
    expRemuneration: 96000,
    expSupplies: 36000,
    expMaterials: 18000,
    expUtilities: 9000,
    expSubsidy: 18000,
    expReserve: 3000,
    maintenanceProposal: 5000,
    electricityProposal: 4000,
    incomes: [
      { type: "OTHER", name: "ค่าธรรมเนียมการให้คำปรึกษา", amount: 180000 },
    ],
  },
  {
    id: "69008",
    nameThai:
      "โครงการบริการกล้องจุลทรรศน์อิเล็กตรอนแบบส่องกราดเพื่องานวิจัยและอุตสาหกรรม",
    department: "bio",
    leaderId: "leader-bio-prasert",
    route: "BOARD",
    current: StatusCode.STATUS_3,
    startDate: "2026-09-01",
    endDate: "2027-08-31",
    serviceType: "4",
    participantCount: 90,
    venue: "ศูนย์เครื่องมือกลาง อาคารชีววิทยา 2",
    fundOwner: "บริษัท ไบโอเทคอินโนเวชั่น จำกัด",
    srcPrivate: 880000,
    expRemuneration: 320000,
    expSupplies: 176000,
    expMaterials: 220000,
    expUtilities: 44000,
    expSubsidy: 88000,
    expReserve: 32000,
    maintenanceProposal: 28000,
    electricityProposal: 22000,
    incomes: [
      { type: "OTHER", name: "ค่าบริการถ่ายภาพตัวอย่าง SEM", amount: 880000 },
    ],
  },
  {
    id: "69009",
    nameThai:
      "โครงการอบรมระบบสารสนเทศภูมิศาสตร์ (GIS) เพื่อการจัดการทรัพยากรท้องถิ่น",
    department: "sci",
    leaderId: "leader-sci-kamon",
    route: "BOARD",
    current: StatusCode.STATUS_3,
    startDate: "2026-09-14",
    endDate: "2026-12-18",
    serviceType: "1",
    participantCount: 40,
    venue: "ห้องปฏิบัติการคอมพิวเตอร์ อาคารวิทยาศาสตร์ทั่วไป",
    fundOwner: "องค์การบริหารส่วนจังหวัด",
    srcGov: 265000,
    expRemuneration: 118000,
    expSupplies: 58000,
    expMaterials: 39750,
    expUtilities: 13250,
    expSubsidy: 26500,
    expReserve: 9500,
    maintenanceProposal: 7500,
    electricityProposal: 5750,
    incomes: [
      { type: "SUPPORT", name: "งบสนับสนุนจาก อบจ.", amount: 265000 },
    ],
  },
  {
    id: "69010",
    nameThai: "โครงการค่ายฟิสิกส์ดาราศาสตร์โอลิมปิก ค่าย 2 ประจำปี 2569",
    department: "phy",
    leaderId: "leader-phy-anucha",
    route: "DEAN",
    current: StatusCode.STATUS_2,
    startDate: "2026-10-05",
    endDate: "2026-10-19",
    serviceType: "1",
    participantCount: 30,
    venue: "อาคารฟิสิกส์และหอดูดาว",
    fundOwner: "มูลนิธิ สอวน.",
    srcPrivate: 380000,
    expRemuneration: 165000,
    expSupplies: 85000,
    expMaterials: 60000,
    expUtilities: 19000,
    expSubsidy: 38000,
    expReserve: 13000,
    maintenanceProposal: 11000,
    electricityProposal: 8000,
    incomes: [
      { type: "SUPPORT", name: "เงินสนับสนุนจากมูลนิธิ สอวน.", amount: 380000 },
    ],
  },
  {
    id: "69011",
    nameThai:
      "โครงการตรวจวิเคราะห์สารปนเปื้อนในอาหารเพื่อผู้ประกอบการชุมชน",
    department: "chem",
    leaderId: "leader-chem-somying",
    route: "BOARD",
    current: StatusCode.STATUS_1,
    startDate: "2026-11-02",
    endDate: "2027-04-30",
    serviceType: "4",
    participantCount: 70,
    venue: "ห้องปฏิบัติการเคมีวิเคราะห์ อาคารเคมี 2",
    fundOwner: "สำนักงานคณะกรรมการอาหารและยา",
    srcGov: 520000,
    expRemuneration: 210000,
    expSupplies: 110000,
    expMaterials: 120000,
    expUtilities: 26000,
    expSubsidy: 52000,
    expReserve: 2000,
    maintenanceProposal: 14000,
    electricityProposal: 11000,
    incomes: [
      { type: "SUPPORT", name: "งบสนับสนุนจาก อย.", amount: 520000 },
    ],
  },
  {
    id: "69012",
    nameThai:
      "โครงการสัมมนาวิชาการปัญญาประดิษฐ์กับการเปลี่ยนผ่านสู่เศรษฐกิจดิจิทัล",
    nameEng: "AI and Digital Economy Transformation Seminar",
    department: "math",
    leaderId: "leader-math-wilai",
    route: "BOARD",
    current: StatusCode.STATUS_1,
    startDate: "2026-11-16",
    endDate: "2026-11-18",
    serviceType: "1",
    participantCount: 200,
    venue: "หอประชุมใหญ่ คณะวิทยาศาสตร์",
    fundOwner: "สมาคมปัญญาประดิษฐ์แห่งประเทศไทย",
    srcPrivate: 450000,
    srcInternal: 50000,
    expRemuneration: 200000,
    expSupplies: 125000,
    expMaterials: 50000,
    expUtilities: 25000,
    expSubsidy: 50000,
    expReserve: 50000,
    maintenanceProposal: 18000,
    electricityProposal: 15000,
    incomes: [
      { type: "SUPPORT", name: "เงินสนับสนุนจากสมาคมฯ", amount: 450000 },
      { type: "REGISTRATION", name: "ค่าลงทะเบียนผู้เข้าร่วมสัมมนา", amount: 50000 },
    ],
  },
  {
    id: "69013",
    nameThai: "โครงการอบรมเทคนิคการเพาะเลี้ยงเนื้อเยื่อพืชเศรษฐกิจสำหรับเกษตรกร",
    department: "bio",
    leaderId: "leader-bio-prasert",
    route: "BOARD",
    current: StatusCode.STATUS_0,
    startDate: "2026-12-01",
    endDate: "2027-02-26",
    serviceType: "1",
    participantCount: 40,
    venue: "ห้องปฏิบัติการเพาะเลี้ยงเนื้อเยื่อ อาคารชีววิทยา 1",
    fundOwner: "กรมส่งเสริมการเกษตร",
    srcGov: 310000,
    expRemuneration: 135000,
    expSupplies: 70000,
    expMaterials: 55000,
    expUtilities: 15500,
    expSubsidy: 31000,
    expReserve: 3500,
    maintenanceProposal: 9000,
    electricityProposal: 7000,
    incomes: [
      { type: "SUPPORT", name: "งบสนับสนุนจากกรมส่งเสริมการเกษตร", amount: 310000 },
    ],
  },
  {
    id: "69014",
    nameThai: "โครงการวัดและสอบเทียบเครื่องมือวัดทางฟิสิกส์แก่โรงงานอุตสาหกรรม (ร่าง)",
    department: "phy",
    leaderId: "leader-phy-anucha",
    route: "BOARD",
    current: StatusCode.DRAFT,
    draft: true,
    startDate: "2027-01-11",
    endDate: "2027-06-30",
    serviceType: "4",
    participantCount: 25,
    venue: "ห้องปฏิบัติการมาตรวิทยา อาคารฟิสิกส์",
    fundOwner: "บริษัท สยามพรีซิชั่น จำกัด",
    srcPrivate: 640000,
    expRemuneration: 256000,
    expSupplies: 128000,
    expMaterials: 160000,
    expUtilities: 32000,
    expSubsidy: 64000,
    maintenanceProposal: 16000,
    electricityProposal: 13000,
    incomes: [
      { type: "OTHER", name: "ค่าบริการสอบเทียบเครื่องมือวัด", amount: 640000 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

/** Build the status chain a project has walked through to reach `current`. */
function historyFor(p: MockProject): StatusCode[] {
  const chain = p.route === "DEAN" ? CHAIN_DEAN : CHAIN_BOARD;
  const idx = chain.indexOf(p.current);
  if (idx === -1) throw new Error(`Status ${p.current} not in chain`);
  return chain.slice(0, idx + 1);
}

async function main() {
  console.log("🌱 Seeding mock data...");

  // --- Leader users -------------------------------------------------------
  for (const leader of leaders) {
    await prisma.user.upsert({
      where: { id: leader.id },
      update: { email: leader.email, name: leader.name },
      create: leader,
    });
  }
  console.log(`👤 ${leaders.length} leader users upserted`);

  // --- Department head assignments (all departments -> mock dept head) ----
  const anyActor = await prisma.user.findFirst();
  for (const dept of ["sci", "chem", "bio", "phy", "math"]) {
    await prisma.departmentHeadAssignment.upsert({
      where: { department: dept },
      update: { headUserId: DEPT_HEAD, assignedByUserId: anyActor!.id },
      create: {
        department: dept,
        headUserId: DEPT_HEAD,
        assignedByUserId: anyActor!.id,
      },
    });
  }
  console.log("🏛️  Department head assignments upserted for 5 departments");

  // --- Wipe previous mock projects ----------------------------------------
  await prisma.project.deleteMany({
    where: { id: { in: projects.map((p) => p.id) } },
  });

  // --- Projects -------------------------------------------------------------
  let count = 0;
  for (const p of projects) {
    const chain = historyFor(p);
    const submitted = !p.draft;
    // Space transitions ~9 days apart, ending in the recent past
    const firstEntered = addDays(new Date("2026-07-01"), -chain.length * 9);

    const isActive =
      p.current === StatusCode.STATUS_6 || p.current === StatusCode.STATUS_7;
    const isClosed = p.current === StatusCode.STATUS_8;
    const boardApproved = chain.includes(StatusCode.STATUS_4);
    const deanApproved = chain.includes(StatusCode.STATUS_5);

    const project = await prisma.project.create({
      data: {
        id: p.id,
        projectCode: p.id,
        receiptNumber: submitted ? `${2400 + count * 7}/2569` : null,
        status: isClosed
          ? ProjectStatus.COMPLETED
          : isActive
            ? ProjectStatus.IN_PROGRESS
            : submitted
              ? ProjectStatus.PENDING_APPROVAL
              : ProjectStatus.DRAFT,
        projectNameThai: p.nameThai,
        projectNameEng: p.nameEng ?? null,
        memoTitle: p.nameThai,
        leaderId: p.leaderId,
        leaderPosition: "อาจารย์ประจำภาควิชา",
        department: p.department,
        startDate: new Date(p.startDate),
        endDate: new Date(p.endDate),
        serviceType: p.serviceType,
        participantCount: p.participantCount,
        venue: p.venue,
        fundOwner: p.fundOwner,
        background: p.background ?? null,
        objectives: p.objectives ?? null,
        expectedBenefits:
          "ผู้เข้าร่วมโครงการได้รับความรู้และทักษะที่นำไปประยุกต์ใช้ได้จริง และสร้างเครือข่ายความร่วมมือกับคณะวิทยาศาสตร์",
        budgetSourceExtGov: p.srcGov ?? null,
        budgetSourceExtPrivate: p.srcPrivate ?? null,
        budgetSourceInternal: p.srcInternal ?? null,
        expenseRemuneration: p.expRemuneration ?? null,
        expenseSupplies: p.expSupplies ?? null,
        expenseMaterials: p.expMaterials ?? null,
        expenseUtilities: p.expUtilities ?? null,
        expenseSubsidy: p.expSubsidy ?? null,
        expenseReserve: p.expReserve ?? null,
        maintenanceFeeProposal: p.maintenanceProposal ?? null,
        electricityFeeProposal: p.electricityProposal ?? null,
        maintenanceFeeActual: p.maintenanceActual ?? null,
        electricityFeeActual: p.electricityActual ?? null,
        vendorCode: p.vendorCode ?? null,
        costCenter: p.costCenter ?? null,
        docNumber: p.docNumber ?? null,
        docDate: p.docNumber ? addDays(firstEntered, 40) : null,
        docLink: p.docLink ?? null,
        draftState: submitted ? "SUBMITTED" : "DRAFT",
        draftSavedAt: submitted ? null : new Date("2026-07-05"),
        submittedAt: submitted ? addDays(firstEntered, 2) : null,
        submittedByRole: submitted ? "USER" : null,
        currentStatusCode: p.current,
        strategies: {
          create: [{ strategyId: String((count % 4) + 1) }],
        },
        targetGroups: {
          create: [{ targetGroupId: String((count % 4) + 1) }],
        },
        incomeItems: p.incomes
          ? {
              create: p.incomes.map((inc) => ({
                type: inc.type,
                name: inc.name,
                amount: inc.amount,
              })),
            }
          : undefined,
        managers: {
          create: [
            { name: "นางสาวจันทร์เพ็ญ สุริยะ", position: "ผู้ประสานงานโครงการ" },
          ],
        },
      },
    });

    // Status history records
    let lastRecordId: string | null = null;
    for (let i = 0; i < chain.length; i++) {
      const code = chain[i];
      const enteredAt = addDays(firstEntered, i * 9);
      const isLast = i === chain.length - 1;
      const record = await prisma.projectStatusRecord.create({
        data: {
          projectId: project.id,
          statusCode: code,
          statusLabel: statusLabels[code] ?? code,
          enteredAt,
          exitedAt: isLast ? null : addDays(enteredAt, 9),
          enteredBy: enteredByFor[code] ?? OWNER,
          branchChoice:
            code === StatusCode.STATUS_4
              ? "BOARD"
              : code === StatusCode.STATUS_5
                ? "DEAN"
                : null,
        },
      });
      lastRecordId = record.id;

      // Notifications on active-status record
      if (
        (code === StatusCode.STATUS_6 || code === StatusCode.STATUS_7) &&
        isLast
      ) {
        await prisma.notificationStatus.createMany({
          data: (
            [
              ["FINANCE", FINANCE],
              ["PLANNING", PLANNING],
              ["PHYSICAL", PHYSICAL],
            ] as [NotificationType, string][]
          ).map(([type, userId], j) => ({
            statusId: record.id,
            notificationType: type,
            isRequired: true,
            isCompleted: j < 2, // finance & planning done, physical pending
            completedAt: j < 2 ? addDays(enteredAt, j + 2) : null,
            completedBy: j < 2 ? userId : null,
          })),
        });
      }
    }

    await prisma.project.update({
      where: { id: project.id },
      data: { currentStatusId: lastRecordId },
    });

    // Meetings for projects that reached the committee stage
    if (chain.includes(StatusCode.STATUS_3)) {
      const meetingDate = addDays(firstEntered, 4 * 9 + 5);
      const decided = boardApproved || deanApproved;
      await prisma.meeting.create({
        data: {
          projectId: project.id,
          type: MeetingType.BOARD,
          no: `${10 + count}/2569`,
          date: meetingDate,
          purpose: "ขอความเห็นชอบจัดโครงการ",
          decisionStatusCode: decided
            ? boardApproved
              ? StatusCode.STATUS_4
              : StatusCode.STATUS_5
            : null,
        },
      });
      if (deanApproved) {
        await prisma.meeting.create({
          data: {
            projectId: project.id,
            type: MeetingType.DEAN,
            no: `${6 + count}/2569`,
            date: addDays(meetingDate, 10),
            purpose: "รับทราบมติและอนุมัติดำเนินโครงการ",
            decisionStatusCode: StatusCode.STATUS_5,
          },
        });
      }
    }

    // Role completions for active / closed projects
    if (isActive || isClosed) {
      const roles: ClosureRole[] = ["RESEARCH", "PHYSICAL", "FINANCE"];
      const completerFor: Record<string, string> = {
        RESEARCH: RESEARCH_STAFF,
        PHYSICAL: PHYSICAL,
        FINANCE: FINANCE,
      };
      for (let r = 0; r < roles.length; r++) {
        const complete = isClosed || r === 0; // active: only research done
        await prisma.projectRoleCompletion.create({
          data: {
            projectId: project.id,
            role: roles[r],
            isComplete: complete,
            completedAt: complete ? addDays(new Date(p.startDate), 30 + r * 7) : null,
            completedBy: complete ? completerFor[roles[r]] : null,
            notes: complete ? "ตรวจสอบเรียบร้อย" : null,
          },
        });
      }
    }

    count++;
    console.log(`✅ ${project.id} [${p.current}] ${p.nameThai.slice(0, 48)}...`);
  }

  // --- One pending budget revision on an active project --------------------
  const brProject = projects.find((p) => p.id === "69005")!;
  await prisma.budgetRevision.create({
    data: {
      projectId: brProject.id,
      status: "BR_WAITING_MEETING",
      originalBudgetSnapshot: {
        expenseRemuneration: 450000,
        expenseSupplies: 260000,
        expenseMaterials: 310000,
        expenseUtilities: 62500,
        expenseSubsidy: 125000,
        expenseReserve: 42500,
      },
      proposedBudget: {
        expenseRemuneration: 430000,
        expenseSupplies: 260000,
        expenseMaterials: 350000,
        expenseUtilities: 62500,
        expenseSubsidy: 125000,
        expenseReserve: 22500,
      },
      reason:
        "วัสดุสิ้นเปลืองสำหรับการทดสอบมีราคาสูงขึ้น ขอปรับลดหมวดค่าตอบแทนและเงินสำรองไปเพิ่มหมวดค่าวัสดุ",
      approvalRoute: "BOARD",
      createdBy: OWNER,
      submittedAt: new Date("2026-06-20"),
      reviewedBy: RESEARCH_STAFF,
      reviewedAt: new Date("2026-06-25"),
      actionLogs: {
        create: [
          {
            projectId: brProject.id,
            actionType: "SUBMIT",
            actorUserId: OWNER,
            actorRole: "USER",
            fromStatus: "BR_DRAFT",
            toStatus: "BR_SUBMITTED",
          },
          {
            projectId: brProject.id,
            actionType: "RESEARCH_CHECK",
            actorUserId: RESEARCH_STAFF,
            actorRole: "งานวิจัย",
            fromStatus: "BR_SUBMITTED",
            toStatus: "BR_WAITING_MEETING",
            note: "ตรวจสอบเอกสารครบถ้วน รอเข้าวาระที่ประชุม",
          },
        ],
      },
    },
  });
  console.log("💰 Budget revision (BR_WAITING_MEETING) created on 69005");

  const total = await prisma.project.count();
  console.log(`\n✨ Done — ${count} mock projects seeded (${total} total in DB)`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
