import { z } from "zod";

export const projectStatusEnumSchema = z.enum([
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "REJECTED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]);

/** Workflow step codes (matches Prisma `StatusCode` — overview / timeline) */
export const workflowStatusCodeSchema = z.enum([
  "STATUS_0",
  "STATUS_1",
  "STATUS_2",
  "STATUS_3",
  "STATUS_4",
  "STATUS_5",
  "STATUS_6",
  "STATUS_7",
  "STATUS_8",
  "STATUS_9",
  "STATUS_10",
  "STATUS_11",
  "STATUS_12",
  "STATUS_13",
  "STATUS_14",
  "STATUS_15",
  "RECALL",
]);

// Create Project Request Schema
export const createProjectSchema = z.object({
  // Basic Info
  receiptNumber: z.string().optional(),
  projectNameThai: z.string().min(1, "กรุณากรอกชื่อโครงการ (ภาษาไทย)"),
  projectNameEng: z.string().optional(),

  // Leader Info
  leaderId: z.string().min(1, "กรุณาระบุหัวหน้าโครงการ"),
  leaderPosition: z.string().min(1, "กรุณากรอกตำแหน่ง"),
  department: z.string().min(1, "กรุณากรอกสังกัด"),

  // Co-Leader Info
  coLeaderId: z.string().optional(),

  // Dates
  startDate: z.string().min(1, "กรุณาเลือกวันที่เริ่มต้น"),
  endDate: z.string().min(1, "กรุณาเลือกวันที่สิ้นสุด"),

  // Project Details
  background: z.string().optional(),
  projectDetails: z.string().optional(),
  objectives: z.string().optional(),
  scope: z.string().optional(),
  implementationPlan: z.string().optional(),
  serviceType: z.string().optional(),
  participantDetails: z.string().optional(),
  participantCount: z.number().optional(),
  venue: z.string().min(1, "กรุณากรอกสถานที่จัดโครงการ"),
  committee: z.string().optional(),
  expectedBenefits: z.string().optional(),
  projectEvaluation: z.string().optional(),

  // Budget Sources
  budgetSourceExtGov: z.number().optional(),
  budgetSourceExtPrivate: z.number().optional(),
  budgetSourceExtForeign: z.number().optional(),
  budgetSourceInternal: z.number().optional(),

  // Expenses
  expenseRemuneration: z.number().optional(),
  expenseSupplies: z.number().optional(),
  expenseMaterials: z.number().optional(),
  expenseUtilities: z.number().optional(),
  expenseSubsidy: z.number().optional(),
  expenseReserve: z.number().optional(),

  // Notes
  note2: z.boolean().optional(),
  note3: z.boolean().optional(),

  // Relations
  targetGroupIds: z.array(z.string()).optional(),
  strategyIds: z.array(z.string()).optional(),
  incomeItems: z
    .array(
      z.object({
        type: z.enum(["SUPPORT", "REGISTRATION", "OTHER"]),
        name: z.string(),
        amount: z.number(),
        categoryName: z.string().optional(),
      }),
    )
    .optional(),
  collaborators: z
    .array(
      z.object({
        name: z.string(),
      }),
    )
    .optional(),
  managers: z
    .array(
      z.object({
        name: z.string(),
        position: z.string().optional(),
      }),
    )
    .optional(),

  status: projectStatusEnumSchema.optional(),
  currentStatusCode: workflowStatusCodeSchema.optional(),
});

/** Minimal body to create an empty row with status DRAFT (placeholders on server). */
export const createDraftProjectSchema = z.object({
  draft: z.literal(true),
  leaderId: z.string().min(1, "กรุณาระบุหัวหน้าโครงการ"),
});

// Update Project Request Schema (all fields optional, including status)
export const updateProjectSchema = createProjectSchema.partial();

// Project ID param schema
export const projectIdSchema = z.object({
  id: z
    .string()
    .regex(/^\d{2}\d{5}$/, "Invalid project ID format (expected YYxxxxx)"),
});

// Query params for list
export const listProjectsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  status: projectStatusEnumSchema.optional(),
  search: z.string().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateDraftProjectInput = z.infer<typeof createDraftProjectSchema>;
export type ListProjectsQuery = z.infer<typeof listProjectsQuerySchema>;
