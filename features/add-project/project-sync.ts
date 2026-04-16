import type { z } from "zod";
import { formDataSchema } from "./schema";
import type { Collaborator, FormData, Notes } from "./types";
import { projectService } from "@/services/projectService";

export type FormDataSchemaType = z.infer<typeof formDataSchema>;

/** Matches `scripts/seed-static.ts` / dev form until auth provides a real leader id */
export const DEFAULT_LEADER_ID = "cmlfoz51o0000voxek4yjqxhg";

export const ADD_PROJECT_STORAGE_PREFIX = "faculty-budget-add-project-backup:";

const PENDING_DRAFT_SESSION_KEY = "faculty-budget-pending-draft-id";
let pendingDraftPromise: Promise<string> | null = null;

/**
 * Returns the draft project id for the given leader.
 * Priority: sessionStorage cache → existing DRAFT on server → create new draft.
 * Dedupes concurrent calls (React Strict Mode) via in-flight promise.
 */
export async function ensureDraftProjectId(leaderId: string): Promise<string> {
  try {
    const cached = sessionStorage.getItem(PENDING_DRAFT_SESSION_KEY);
    if (cached) return cached;
  } catch {
    /* ignore */
  }

  if (pendingDraftPromise) return pendingDraftPromise;

  pendingDraftPromise = (async () => {
    // Reuse an existing DRAFT for this leader instead of creating a new one
    const existing = await projectService.findExistingDraft(leaderId);
    const id =
      existing?.id ??
      (await projectService.createDraft(leaderId).then((r) => r?.data?.id));

    if (!id) throw new Error("สร้างแบบร่างไม่สำเร็จ");
    try {
      sessionStorage.setItem(PENDING_DRAFT_SESSION_KEY, id);
    } catch {
      /* ignore */
    }
    return id;
  })();

  try {
    return await pendingDraftPromise;
  } finally {
    pendingDraftPromise = null;
  }
}

export function clearPendingDraftSession() {
  try {
    sessionStorage.removeItem(PENDING_DRAFT_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

const PLACEHOLDER_NAME = "(แบบร่าง)";
const PLACEHOLDER_DASH = "-";

function isPlaceholderProjectName(v: string) {
  return v === PLACEHOLDER_NAME;
}

function isPlaceholderDash(v: string) {
  return v === PLACEHOLDER_DASH;
}

function formatDateInput(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

function decToString(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "number") return String(v);
  if (typeof v === "string") return v;
  if (typeof v === "object" && v !== null && "toString" in v) {
    return String((v as { toString: () => string }).toString());
  }
  return String(v);
}

/** API project row (GET /api/projects/:id) — loose typing for JSON */
export type ProjectApiShape = {
  id: string;
  receiptNumber?: string | null;
  projectNameThai: string;
  projectNameEng?: string | null;
  leaderPosition: string;
  department: string;
  leaderId: string;
  leader?: { id: string; name: string | null; email: string | null } | null;
  coLeaderId?: string | null;
  coLeader?: { id: string; name: string | null; email: string | null } | null;
  startDate: string;
  endDate: string;
  background?: string | null;
  projectDetails?: string | null;
  objectives?: string | null;
  scope?: string | null;
  implementationPlan?: string | null;
  serviceType?: string | null;
  participantCount?: number | null;
  participantDetails?: string | null;
  venue?: string | null;
  committee?: string | null;
  expectedBenefits?: string | null;
  projectEvaluation?: string | null;
  budgetSourceExtGov?: unknown;
  budgetSourceExtPrivate?: unknown;
  budgetSourceExtForeign?: unknown;
  budgetSourceInternal?: unknown;
  expenseRemuneration?: unknown;
  expenseSupplies?: unknown;
  expenseMaterials?: unknown;
  expenseUtilities?: unknown;
  expenseSubsidy?: unknown;
  expenseReserve?: unknown;
  note2?: boolean;
  note3?: boolean;
  targetGroups?: { targetGroup: { id: string } }[];
  strategies?: { strategy: { id: string } }[];
  incomeItems?: {
    type: string;
    name: string;
    amount: unknown;
    categoryName?: string | null;
  }[];
  collaborators?: { name: string }[];
};

export function projectApiToFormState(project: ProjectApiShape): {
  form: FormDataSchemaType;
  collaborators: Collaborator[];
  notes: Notes;
} {
  const incomeItems = project.incomeItems ?? [];
  const support = incomeItems.filter((i) => i.type === "SUPPORT");
  const registration = incomeItems.filter((i) => i.type === "REGISTRATION");
  const other = incomeItems.filter((i) => i.type === "OTHER");

  const mapIncomeRows = (
    rows: typeof incomeItems,
    startId: number,
  ): FormData["incomeSupportItems"] => {
    if (rows.length === 0) return [{ id: startId, name: "", amount: "" }];
    return rows.map((r, i) => ({
      id: startId + i,
      name: r.name,
      amount: decToString(r.amount),
    }));
  };

  const otherByCategory = new Map<string, typeof other>();
  for (const item of other) {
    const cat = item.categoryName?.trim() || "รายได้อื่นๆ";
    if (!otherByCategory.has(cat)) otherByCategory.set(cat, []);
    otherByCategory.get(cat)!.push(item);
  }

  let catId = 1;
  const customIncomeCategories = Array.from(otherByCategory.entries()).map(
    ([categoryName, items]) => ({
      id: catId++,
      categoryName,
      items: items.map((r, i) => ({
        id: i + 1,
        name: r.name,
        amount: decToString(r.amount),
      })),
    }),
  );

  const participantCount = project.participantCount ?? 0;
  const participantDetails = (project.participantDetails ?? "").trim();

  const form = {
    receiptNumber: project.receiptNumber ?? "",
    projectNameThai: isPlaceholderProjectName(project.projectNameThai)
      ? ""
      : project.projectNameThai,
    projectNameEng: project.projectNameEng ?? "",
    leaderName: isPlaceholderDash(project.leaderPosition)
      ? ""
      : (project.leader?.name ?? ""),
    leaderPosition: isPlaceholderDash(project.leaderPosition)
      ? ""
      : project.leaderPosition,
    department: isPlaceholderDash(project.department) ? "" : project.department,
    leaderEmail: isPlaceholderDash(project.leaderPosition)
      ? ""
      : (project.leader?.email ?? ""),
    coLeaderName: project.coLeader?.name ?? "",
    coLeaderEmail: project.coLeader?.email ?? "",
    startDate: isPlaceholderDash(project.leaderPosition)
      ? ""
      : formatDateInput(project.startDate),
    endDate: isPlaceholderDash(project.leaderPosition)
      ? ""
      : formatDateInput(project.endDate),
    background: project.background ?? "",
    projectDetails: project.projectDetails ?? "",
    objectives: project.objectives ?? "",
    scope: project.scope ?? "",
    implementationPlan: project.implementationPlan ?? "",
    serviceType: project.serviceType ?? "",
    targetGroups: isPlaceholderProjectName(project.projectNameThai)
      ? []
      : (project.targetGroups ?? []).map((t) => t.targetGroup.id),
    strategies: isPlaceholderProjectName(project.projectNameThai)
      ? []
      : (project.strategies ?? []).map((s) => s.strategy.id),
    participants: [
      {
        id: 1,
        count: participantCount > 0 ? String(participantCount) : "1",
        details: participantDetails || "-",
      },
    ],
    venue:
      project.venue && isPlaceholderDash(project.venue)
        ? ""
        : (project.venue ?? ""),
    committee: project.committee ?? "",
    expectedBenefits: project.expectedBenefits ?? "",
    projectEvaluation: project.projectEvaluation ?? "",
    budgetSourceExtGov: decToString(project.budgetSourceExtGov),
    budgetSourceExtPrivate: decToString(project.budgetSourceExtPrivate),
    budgetSourceExtForeign: decToString(project.budgetSourceExtForeign),
    budgetSourceInternal: decToString(project.budgetSourceInternal),
    incomeSupportItems: mapIncomeRows(support, 1),
    incomeRegistrationItems: mapIncomeRows(registration, 1),
    customIncomeCategories,
    expenseRemuneration: decToString(project.expenseRemuneration),
    expenseSupplies: decToString(project.expenseSupplies),
    expenseMaterials: decToString(project.expenseMaterials),
    expenseUtilities: decToString(project.expenseUtilities),
    expenseSubsidy: decToString(project.expenseSubsidy),
    expenseReserve: decToString(project.expenseReserve),
  };

  const collaborators: Collaborator[] =
    project.collaborators && project.collaborators.length > 0
      ? project.collaborators.map((c, i) => ({ id: i + 1, name: c.name }))
      : [{ id: 1, name: "" }];

  const notes: Notes = {
    note2: project.note2 ?? false,
    note3: project.note3 ?? false,
  };

  return { form: form as FormDataSchemaType, collaborators, notes };
}

export function buildApiPayloadFromForm(
  validatedData: FormDataSchemaType,
  collaborators: Collaborator[],
  notes: Notes,
  leaderId: string,
): Record<string, unknown> {
  const stripCommas = (s: string) => s.replace(/,/g, "");

  const incomeItems = [
    ...validatedData.incomeSupportItems.map((item) => ({
      type: "SUPPORT" as const,
      name: item.name,
      amount: parseFloat(stripCommas(item.amount || "0")),
    })),
    ...validatedData.incomeRegistrationItems.map((item) => ({
      type: "REGISTRATION" as const,
      name: item.name,
      amount: parseFloat(stripCommas(item.amount || "0")),
    })),
    ...(validatedData.customIncomeCategories || []).flatMap((category) =>
      category.items.map((item) => ({
        type: "OTHER" as const,
        name: item.name,
        amount: parseFloat(stripCommas(item.amount || "0")),
        categoryName: category.categoryName,
      })),
    ),
  ].filter((item) => item.name && item.amount > 0);

  const participantCount =
    validatedData.participants.reduce(
      (sum, p) => sum + (parseInt(p.count, 10) || 0),
      0,
    ) || undefined;

  const participantDetails =
    validatedData.participants
      .map((p) => p.details)
      .filter(Boolean)
      .join(", ") || undefined;

  const num = (s: string | undefined) =>
    s ? parseFloat(s.replace(/,/g, "")) : undefined;

  const payload: Record<string, unknown> = {
    receiptNumber: validatedData.receiptNumber || undefined,
    projectNameThai: validatedData.projectNameThai,
    projectNameEng: validatedData.projectNameEng || undefined,
    leaderId,
    leaderPosition: validatedData.leaderPosition,
    department: validatedData.department,
    startDate: validatedData.startDate,
    endDate: validatedData.endDate,
    background: validatedData.background || undefined,
    projectDetails: validatedData.projectDetails || undefined,
    objectives: validatedData.objectives || undefined,
    scope: validatedData.scope || undefined,
    implementationPlan: validatedData.implementationPlan || undefined,
    serviceType: validatedData.serviceType || undefined,
    participantCount,
    participantDetails,
    venue: validatedData.venue,
    committee: validatedData.committee || undefined,
    expectedBenefits: validatedData.expectedBenefits || undefined,
    projectEvaluation: validatedData.projectEvaluation || undefined,
    budgetSourceExtGov: num(validatedData.budgetSourceExtGov),
    budgetSourceExtPrivate: num(validatedData.budgetSourceExtPrivate),
    budgetSourceExtForeign: num(validatedData.budgetSourceExtForeign),
    budgetSourceInternal: num(validatedData.budgetSourceInternal),
    expenseRemuneration: num(validatedData.expenseRemuneration),
    expenseSupplies: num(validatedData.expenseSupplies),
    expenseMaterials: num(validatedData.expenseMaterials),
    expenseUtilities: num(validatedData.expenseUtilities),
    expenseSubsidy: num(validatedData.expenseSubsidy),
    expenseReserve: num(validatedData.expenseReserve),
    note2: notes.note2,
    note3: notes.note3,
    targetGroupIds: validatedData.targetGroups ?? [],
    strategyIds: validatedData.strategies ?? [],
    incomeItems: incomeItems.length > 0 ? incomeItems : [],
    collaborators: collaborators
      .filter((c) => c.name.trim() !== "")
      .map((c) => ({ name: c.name })),
  };

  return payload;
}

const DEEP_COMPARE_KEYS = new Set([
  "incomeItems",
  "targetGroupIds",
  "strategyIds",
  "collaborators",
  "managers",
]);

export function diffApiPayload(
  last: Record<string, unknown> | null,
  next: Record<string, unknown>,
): Record<string, unknown> {
  if (!last) return next;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(next)) {
    const a = last[key];
    const b = next[key];
    if (DEEP_COMPARE_KEYS.has(key)) {
      if (JSON.stringify(a) !== JSON.stringify(b)) out[key] = b;
    } else if (a !== b) {
      out[key] = b;
    }
  }
  return out;
}

export function mergeSyncedPayload(
  last: Record<string, unknown> | null,
  diff: Record<string, unknown>,
): Record<string, unknown> {
  return { ...(last ?? {}), ...diff };
}

/** Avoid sending "" for fields that would fail zod .min(1) on partial PUT */
export function stripEmptyStringValues(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (v === "") continue;
    out[k] = v;
  }
  return out;
}

export function backupFormToLocalStorage(
  projectId: string,
  snapshot: {
    form: FormDataSchemaType;
    collaborators: Collaborator[];
    notes: Notes;
  },
) {
  try {
    localStorage.setItem(
      ADD_PROJECT_STORAGE_PREFIX + projectId,
      JSON.stringify(snapshot),
    );
  } catch {
    /* ignore quota */
  }
}
