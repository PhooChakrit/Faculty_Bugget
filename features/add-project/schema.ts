import { z } from "zod";

// Income Item Schema
const incomeItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  amount: z.string(),
});

// Collaborator Schema
export const collaboratorSchema = z.object({
  id: z.number(),
  name: z.string(),
});

// Manager Schema
export const managerSchema = z.object({
  id: z.number(),
  name: z.string(),
  position: z.string(),
});

// Notes Schema
export const notesSchema = z.object({
  note2: z.boolean(),
  note3: z.boolean(),
});

// Main Form Schema
export const formDataSchema = z.object({
  // Basic Info
  receiptNumber: z.string().optional(),
  projectNameThai: z.string().min(1, "กรุณากรอกชื่อโครงการ (ภาษาไทย)"),
  projectNameEng: z.string().optional(),
  leaderName: z.string().min(1, "กรุณากรอกชื่อหัวหน้าโครงการ"),
  leaderPosition: z.string().min(1, "กรุณากรอกตำแหน่ง"),
  department: z.string().min(1, "กรุณากรอกสังกัด"),
  leaderEmail: z.string().email("กรุณากรอกอีเมลให้ถูกต้อง"),
  coLeaderName: z.string().optional(),
  coLeaderEmail: z
    .string()
    .email("กรุณากรอกอีเมลให้ถูกต้อง")
    .optional()
    .or(z.literal("")),
  startDate: z.string().min(1, "กรุณาเลือกวันที่เริ่มต้น"),
  endDate: z.string().min(1, "กรุณาเลือกวันที่สิ้นสุด"),

  // Project Details
  background: z.string().min(1, "กรุณากรอกความเป็นมาและความสำคัญ"),
  projectDetails: z.string().min(1, "กรุณากรอกรายละเอียดโครงการ"),
  objectives: z.string().min(1, "กรุณากรอกวัตถุประสงค์"),
  scope: z.string().optional(),
  implementationPlan: z.string().optional(),
  serviceType: z.string().min(1, "กรุณาเลือกประเภทการให้บริการ"),
  targetGroups: z.array(z.string()).min(1, "กรุณาเลือกกลุ่มเป้าหมาย"),
  strategies: z.array(z.string()).optional(),
  participantCount: z.string().min(1, "กรุณากรอกจำนวนผู้เข้าร่วม"),
  participantDetails: z.string().optional(),
  venue: z.string().min(1, "กรุณากรอกสถานที่จัดโครงการ"),
  committee: z.string().optional(),
  expectedBenefits: z.string().optional(),
  projectEvaluation: z.string().optional(),

  // Budget Sources
  budgetSourceExtGov: z.string().optional(),
  budgetSourceExtPrivate: z.string().optional(),
  budgetSourceExtForeign: z.string().optional(),
  budgetSourceInternal: z.string().optional(),

  // Income Items
  incomeSupportItems: z.array(incomeItemSchema).min(1),
  incomeRegistrationItems: z.array(incomeItemSchema).min(1),

  // Expenses
  expenseRemuneration: z.string().optional(),
  expenseSupplies: z.string().optional(),
  expenseMaterials: z.string().optional(),
  expenseUtilities: z.string().optional(),
  expenseSubsidy: z.string().optional(),
  expenseReserve: z.string().optional(),
});

// Infer types from schemas
export type FormDataSchema = z.infer<typeof formDataSchema>;
export type NotesSchema = z.infer<typeof notesSchema>;
export type CollaboratorSchema = z.infer<typeof collaboratorSchema>;
export type ManagerSchema = z.infer<typeof managerSchema>;
