import { z } from "zod";

// Income Item Schema
const incomeItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  amount: z.string(),
});

// Custom Income Category Schema
const customIncomeCategorySchema = z.object({
  id: z.number(),
  categoryName: z.string().min(1, "กรุณากรอกชื่อหัวข้อย่อย"),
  items: z.array(incomeItemSchema).min(1, "กรุณาเพิ่มรายการอย่างน้อย 1 รายการ"),
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

export const participantSchema = z.object({
  id: z.number(),
  count: z.string().min(1, "กรุณากรอกจำนวนผู้เข้าร่วม"),
  details: z.string().min(1, "กรุณากรอกรายละเอียดผู้เข้าร่วม"),
});

// Main Form Schema
export const formDataSchema = z
  .object({
    // Basic Info
    receiptNumber: z.string().optional(),
    projectNameThai: z.string().min(1, "กรุณากรอกชื่อโครงการภาษาไทย"),
    projectNameEng: z.string().optional(),
    leaderName: z.string().min(1, "กรุณากรอกชื่อหัวหน้าโครงการ"),
    leaderPosition: z.string().min(1, "กรุณากรอกตำแหน่ง"),
    department: z.string().min(1, "กรุณาเลือกหน่วยงาน/ภาควิชาที่รับผิดชอบ"),
    leaderEmail: z
      .string()
      .min(1, "กรุณากรอกอีเมลหัวหน้าโครงการ")
      .email("รูปแบบอีเมลหัวหน้าโครงการไม่ถูกต้อง"),
    coLeaderName: z.string().optional(),
    coLeaderEmail: z
      .string()
      .email("รูปแบบอีเมลผู้ประสานโครงการไม่ถูกต้อง")
      .optional()
      .or(z.literal("")),
    startDate: z.string().min(1, "กรุณาเลือกวันที่จัดโครงการ (เริ่มต้น)"),
    endDate: z.string().min(1, "กรุณาเลือกวันที่จัดโครงการ (สิ้นสุด)"),

    // Project Details
    background: z.string().min(1, "กรุณากรอกความเป็นมา หลักการและเหตุผล"),
    projectDetails: z.string().min(1, "กรุณากรอกรายละเอียดโครงการ"),
    objectives: z.string().min(1, "กรุณากรอกวัตถุประสงค์"),
    scope: z.string().optional(),
    implementationPlan: z.string().optional(),
    serviceType: z.string().min(1, "กรุณาเลือกประเภทงานบริการวิชาการ"),
    targetGroups: z.array(z.string()).min(1, "กรุณาเลือกกลุ่มเป้าหมาย"),
    strategies: z.array(z.string()).optional(),
    participants: z
      .array(participantSchema)
      .min(1, "กรุณาเพิ่มผู้เข้าร่วมอย่างน้อย 1 รายการ"),
    venue: z.string().min(1, "กรุณากรอกสถานที่จัดโครงการ/อบรม"),
    committee: z.string().min(1, "กรุณากรอกคณะกรรมการดำเนินงานโครงการ"),
    expectedBenefits: z.string().min(1, "กรุณากรอกประโยชน์ที่คาดว่าจะได้รับ"),
    projectEvaluation: z.string().optional(),

    // Budget Sources
    budgetSourceExtGov: z.string().optional(),
    budgetSourceExtPrivate: z.string().optional(),
    budgetSourceExtForeign: z.string().optional(),
    budgetSourceInternal: z.string().optional(),

    // Income Items
    incomeSupportItems: z.array(incomeItemSchema).min(1),
    incomeRegistrationItems: z.array(incomeItemSchema).min(1),
    customIncomeCategories: z.array(customIncomeCategorySchema).optional(),

    // Expenses
    expenseRemuneration: z.string().optional(),
    expenseSupplies: z.string().optional(),
    expenseMaterials: z.string().optional(),
    expenseUtilities: z.string().optional(),
    expenseSubsidy: z.string().optional(),
    expenseReserve: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const budgetSourceTotal =
      (Number(data.budgetSourceExtGov) || 0) +
      (Number(data.budgetSourceExtPrivate) || 0) +
      (Number(data.budgetSourceExtForeign) || 0) +
      (Number(data.budgetSourceInternal) || 0);

    const customIncomeTotal = (data.customIncomeCategories || []).reduce(
      (sum, category) =>
        Math.max(
          0,
          sum +
            category.items.reduce(
              (itemSum, item) => itemSum + (Number(item.amount) || 0),
              0,
            ),
        ),
      0,
    );

    const incomeTotal =
      data.incomeSupportItems.reduce(
        (sum, item) => sum + (Number(item.amount) || 0),
        0,
      ) +
      data.incomeRegistrationItems.reduce(
        (sum, item) => sum + (Number(item.amount) || 0),
        0,
      ) +
      customIncomeTotal;

    const expenseTotal =
      (Number(data.expenseRemuneration) || 0) +
      (Number(data.expenseSupplies) || 0) +
      (Number(data.expenseMaterials) || 0) +
      (Number(data.expenseUtilities) || 0) +
      (Number(data.expenseSubsidy) || 0) +
      (Number(data.expenseReserve) || 0);

    const isBudgetValid =
      Math.abs(budgetSourceTotal - incomeTotal) < 0.01 &&
      Math.abs(incomeTotal - expenseTotal) < 0.01;

    if (!isBudgetValid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `ยอดรวมงบประมาณไม่สมดุล: งบประมาณ (${budgetSourceTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท), รายรับ (${incomeTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท) และรายจ่าย (${expenseTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท) ต้องเท่ากันพอดี`,
        path: ["budgetSourceExtGov"],
      });
    }
  });

// Infer types from schemas
export type FormDataSchema = z.infer<typeof formDataSchema>;
export type NotesSchema = z.infer<typeof notesSchema>;
export type CollaboratorSchema = z.infer<typeof collaboratorSchema>;
export type ManagerSchema = z.infer<typeof managerSchema>;
