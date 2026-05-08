import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { successResponse, handleApiError } from "@/lib/api-response";
import { ensureMockActor } from "@/lib/ensure-mock-actor";
import { actorRoles } from "@/lib/mock-actors";

const budgetPayloadSchema = z.object({
  budgetSourceExtGov: z.coerce.number().optional(),
  budgetSourceExtPrivate: z.coerce.number().optional(),
  budgetSourceExtForeign: z.coerce.number().optional(),
  budgetSourceInternal: z.coerce.number().optional(),
  expenseRemuneration: z.coerce.number().optional(),
  expenseSupplies: z.coerce.number().optional(),
  expenseMaterials: z.coerce.number().optional(),
  expenseUtilities: z.coerce.number().optional(),
  expenseSubsidy: z.coerce.number().optional(),
  expenseReserve: z.coerce.number().optional(),
});

const createBudgetRevisionSchema = z.object({
  actorRole: z.enum(actorRoles),
  actorUserId: z.string().min(1),
  reason: z.string().min(1),
  proposedBudget: budgetPayloadSchema,
  closeAfterApproval: z.boolean().optional(),
  affectsCostCenter: z.boolean().optional(),
  affectsVendor: z.boolean().optional(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const payload = createBudgetRevisionSchema.parse(await request.json());

    if (payload.actorRole !== "USER") {
      return Response.json(
        { error: "เฉพาะเจ้าของโครงการเท่านั้นที่สร้างคำขอแก้ไขงบประมาณได้" },
        { status: 403 },
      );
    }

    const actorUser = await ensureMockActor(payload.actorUserId);
    if (!actorUser) {
      return Response.json(
        { error: "ไม่พบผู้ใช้สำหรับสร้างคำขอแก้ไขงบประมาณ" },
        { status: 400 },
      );
    }

    const project = await prisma.project.findUnique({
      where: { id },
      select: {
        currentStatusCode: true,
        budgetSourceExtGov: true,
        budgetSourceExtPrivate: true,
        budgetSourceExtForeign: true,
        budgetSourceInternal: true,
        expenseRemuneration: true,
        expenseSupplies: true,
        expenseMaterials: true,
        expenseUtilities: true,
        expenseSubsidy: true,
        expenseReserve: true,
      },
    });

    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    if (
      project.currentStatusCode !== "STATUS_6" &&
      project.currentStatusCode !== "STATUS_7"
    ) {
      return Response.json(
        { error: "สร้างคำขอแก้ไขงบได้เฉพาะโครงการที่อยู่ State 6/7" },
        { status: 400 },
      );
    }

    const activeRevision = await prisma.budgetRevision.findFirst({
      where: {
        projectId: id,
        status: { notIn: ["BR_APPLIED", "BR_REJECTED", "BR_CANCELLED"] },
      },
      select: { id: true },
    });

    if (activeRevision) {
      return Response.json(
        { error: "มีคำขอแก้ไขงบประมาณที่ยังดำเนินการอยู่แล้ว" },
        { status: 409 },
      );
    }

    const originalBudgetSnapshot = {
      budgetSourceExtGov: project.budgetSourceExtGov?.toString() ?? null,
      budgetSourceExtPrivate:
        project.budgetSourceExtPrivate?.toString() ?? null,
      budgetSourceExtForeign:
        project.budgetSourceExtForeign?.toString() ?? null,
      budgetSourceInternal: project.budgetSourceInternal?.toString() ?? null,
      expenseRemuneration: project.expenseRemuneration?.toString() ?? null,
      expenseSupplies: project.expenseSupplies?.toString() ?? null,
      expenseMaterials: project.expenseMaterials?.toString() ?? null,
      expenseUtilities: project.expenseUtilities?.toString() ?? null,
      expenseSubsidy: project.expenseSubsidy?.toString() ?? null,
      expenseReserve: project.expenseReserve?.toString() ?? null,
    };

    const revision = await prisma.$transaction(async (tx) => {
      const created = await tx.budgetRevision.create({
        data: {
          projectId: id,
          status: "BR_SUBMITTED",
          originalBudgetSnapshot,
          proposedBudget: payload.proposedBudget,
          reason: payload.reason,
          closeAfterApproval: payload.closeAfterApproval ?? false,
          affectsCostCenter: payload.affectsCostCenter ?? false,
          affectsVendor: payload.affectsVendor ?? false,
          createdBy: actorUser.id,
          submittedAt: new Date(),
        },
      });

      await tx.budgetRevisionActionLog.create({
        data: {
          revisionId: created.id,
          projectId: id,
          actionType: "SUBMIT_BUDGET_REVISION",
          actorUserId: actorUser.id,
          actorRole: payload.actorRole,
          fromStatus: "BR_DRAFT",
          toStatus: "BR_SUBMITTED",
          note: payload.reason,
        },
      });

      return created;
    });

    return successResponse({ revision });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "ข้อมูลไม่ถูกต้อง", details: error.flatten() },
        { status: 400 },
      );
    }

    return handleApiError(error);
  }
}
