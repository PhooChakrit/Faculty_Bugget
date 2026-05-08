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

const updateBudgetRevisionSchema = z.object({
  actorRole: z.enum(actorRoles),
  actorUserId: z.string().min(1),
  reason: z.string().optional(),
  proposedBudget: budgetPayloadSchema.optional(),
  closeAfterApproval: z.boolean().optional(),
  meetingNo: z.string().optional(),
  meetingDate: z.string().optional(),
  meetingNote: z.string().optional(),
  deanApprovalFileName: z.string().optional(),
  deanApprovalFileUrl: z.string().optional(),
  affectsCostCenter: z.boolean().optional(),
  affectsVendor: z.boolean().optional(),
});

type RouteContext = {
  params: Promise<{ revisionId: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { revisionId } = await context.params;
    const payload = updateBudgetRevisionSchema.parse(await request.json());

    if (payload.actorRole !== "USER" && payload.actorRole !== "งานวิจัย") {
      return Response.json(
        { error: "ไม่มีสิทธิ์แก้ไขคำขอแก้ไขงบประมาณ" },
        { status: 403 },
      );
    }

    const actorUser = await ensureMockActor(payload.actorUserId);
    if (!actorUser) {
      return Response.json(
        { error: "ไม่พบผู้ใช้สำหรับบันทึกคำขอแก้ไขงบประมาณ" },
        { status: 400 },
      );
    }

    const revision = await prisma.budgetRevision.findUnique({
      where: { id: revisionId },
      select: { id: true, projectId: true, status: true },
    });

    if (!revision) {
      return Response.json(
        { error: "Budget revision not found" },
        { status: 404 },
      );
    }

    const userEditable = revision.status === "BR_DRAFT";
    const researchEditable = [
      "BR_SUBMITTED",
      "BR_RESEARCH_CHECKED",
      "BR_WAITING_MEETING",
      "BR_BOARD_APPROVED",
      "BR_DEAN_APPROVED",
    ].includes(revision.status);

    if (
      (payload.actorRole === "USER" && !userEditable) ||
      (payload.actorRole === "งานวิจัย" && !researchEditable)
    ) {
      return Response.json(
        { error: "สถานะปัจจุบันไม่เปิดให้ role นี้แก้ไขคำขอ" },
        { status: 400 },
      );
    }

    const data = {
      ...(payload.reason !== undefined && { reason: payload.reason }),
      ...(payload.proposedBudget !== undefined && {
        proposedBudget: payload.proposedBudget,
      }),
      ...(payload.closeAfterApproval !== undefined && {
        closeAfterApproval: payload.closeAfterApproval,
      }),
      ...(payload.meetingNo !== undefined && { meetingNo: payload.meetingNo }),
      ...(payload.meetingDate !== undefined && {
        meetingDate: payload.meetingDate ? new Date(payload.meetingDate) : null,
      }),
      ...(payload.meetingNote !== undefined && {
        meetingNote: payload.meetingNote,
      }),
      ...(payload.deanApprovalFileName !== undefined && {
        deanApprovalFileName: payload.deanApprovalFileName,
      }),
      ...(payload.deanApprovalFileUrl !== undefined && {
        deanApprovalFileUrl: payload.deanApprovalFileUrl,
      }),
      ...(payload.affectsCostCenter !== undefined && {
        affectsCostCenter: payload.affectsCostCenter,
      }),
      ...(payload.affectsVendor !== undefined && {
        affectsVendor: payload.affectsVendor,
      }),
    };

    const [updated] = await prisma.$transaction([
      prisma.budgetRevision.update({
        where: { id: revisionId },
        data,
      }),
      prisma.budgetRevisionActionLog.create({
        data: {
          revisionId,
          projectId: revision.projectId,
          actionType: "UPDATE_BUDGET_REVISION",
          actorUserId: actorUser.id,
          actorRole: payload.actorRole,
          fromStatus: revision.status,
          toStatus: revision.status,
        },
      }),
    ]);

    return successResponse({ revision: updated });
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
