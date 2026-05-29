import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { successResponse, handleApiError } from "@/lib/api-response";
import { ensureMockActor } from "@/lib/ensure-mock-actor";
import { actorRoles } from "@/lib/mock-actors";
import { formatStatusDisplay, statusLabels } from "@/lib/status-constants";
import type {
  BudgetRevisionStatus,
  Prisma,
} from "@/app/generated/prisma/client";

const actionSchema = z.object({
  action: z.enum([
    "RESEARCH_CHECK",
    "RETURN_TO_OWNER",
    "REJECT",
    "APPROVE_TO_MEETING",
    "MARK_BOARD_APPROVED",
    "MARK_DEAN_APPROVED",
    "APPLY",
    "CANCEL",
  ]),
  actorRole: z.enum(actorRoles),
  actorUserId: z.string().min(1),
  note: z.string().optional(),
});

const budgetFields = [
  "budgetSourceExtGov",
  "budgetSourceExtPrivate",
  "budgetSourceExtForeign",
  "budgetSourceInternal",
  "expenseRemuneration",
  "expenseSupplies",
  "expenseMaterials",
  "expenseUtilities",
  "expenseSubsidy",
  "expenseReserve",
] as const;

type RouteContext = {
  params: Promise<{ revisionId: string }>;
};

function nextStatusForAction(
  action: z.infer<typeof actionSchema>["action"],
): BudgetRevisionStatus {
  switch (action) {
    case "RESEARCH_CHECK":
      return "BR_RESEARCH_CHECKED";
    case "RETURN_TO_OWNER":
      return "BR_DRAFT";
    case "REJECT":
      return "BR_REJECTED";
    case "APPROVE_TO_MEETING":
      return "BR_WAITING_MEETING";
    case "MARK_BOARD_APPROVED":
      return "BR_BOARD_APPROVED";
    case "MARK_DEAN_APPROVED":
      return "BR_DEAN_APPROVED";
    case "APPLY":
      return "BR_APPLIED";
    case "CANCEL":
      return "BR_CANCELLED";
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { revisionId } = await context.params;
    const payload = actionSchema.parse(await request.json());

    const actorUser = await ensureMockActor(payload.actorUserId);
    if (!actorUser) {
      return Response.json(
        { error: "ไม่พบผู้ใช้สำหรับบันทึก action" },
        { status: 400 },
      );
    }

    const revision = await prisma.budgetRevision.findUnique({
      where: { id: revisionId },
      include: { project: true },
    });

    if (!revision) {
      return Response.json(
        { error: "Budget revision not found" },
        { status: 404 },
      );
    }

    const requiredRole =
      payload.action === "APPROVE_TO_MEETING"
        ? "หัวหน้าฝ่ายวิจัย"
        : payload.action === "CANCEL"
          ? "USER"
          : "งานวิจัย";

    if (payload.actorRole !== requiredRole) {
      return Response.json(
        { error: `action นี้ต้องใช้ role ${requiredRole}` },
        { status: 403 },
      );
    }

    const allowed: Record<string, string[]> = {
      BR_SUBMITTED: ["RESEARCH_CHECK", "RETURN_TO_OWNER", "REJECT"],
      BR_RESEARCH_CHECKED: ["APPROVE_TO_MEETING", "RETURN_TO_OWNER", "REJECT"],
      BR_WAITING_MEETING: [
        "MARK_BOARD_APPROVED",
        "MARK_DEAN_APPROVED",
        "REJECT",
      ],
      BR_BOARD_APPROVED: ["APPLY"],
      BR_DEAN_APPROVED: ["APPLY"],
      BR_DRAFT: ["CANCEL"],
    };

    if (!allowed[revision.status]?.includes(payload.action)) {
      return Response.json(
        { error: "action นี้ไม่ถูกต้องสำหรับสถานะคำขอปัจจุบัน" },
        { status: 400 },
      );
    }

    if (
      payload.action === "MARK_BOARD_APPROVED" ||
      payload.action === "MARK_DEAN_APPROVED"
    ) {
      if (!revision.meetingNo || !revision.meetingDate) {
        return Response.json(
          { error: "ต้องกรอกครั้งที่ประชุมและวันที่ประชุมก่อนบันทึกมติ" },
          { status: 400 },
        );
      }

      if (
        payload.action === "MARK_DEAN_APPROVED" &&
        !revision.deanApprovalFileUrl
      ) {
        return Response.json(
          { error: "ต้องแนบไฟล์/ลิงก์อนุมัติจากคณบดีก่อน" },
          { status: 400 },
        );
      }
    }

    if (payload.action === "APPLY") {
      if (revision.affectsCostCenter && !revision.project.costCenter?.trim()) {
        return Response.json(
          { error: "ต้องให้งานแผนยืนยัน/กรอกศูนย์ต้นทุนก่อน apply" },
          { status: 400 },
        );
      }

      if (revision.affectsVendor && !revision.project.vendorCode?.trim()) {
        return Response.json(
          { error: "ต้องให้งานคลังยืนยัน/กรอก Vendor ก่อน apply" },
          { status: 400 },
        );
      }
    }

    const toStatus = nextStatusForAction(payload.action);
    const result = await prisma.$transaction(async (tx) => {
      const updateData: Prisma.BudgetRevisionUncheckedUpdateInput = {
        status: toStatus,
        ...(payload.action === "RESEARCH_CHECK" && {
          reviewedBy: actorUser.id,
          reviewedAt: new Date(),
        }),
        ...(payload.action === "MARK_BOARD_APPROVED" && {
          approvalRoute: "BOARD" as const,
          approvedBy: actorUser.id,
          approvedAt: new Date(),
        }),
        ...(payload.action === "MARK_DEAN_APPROVED" && {
          approvalRoute: "DEAN" as const,
          approvedBy: actorUser.id,
          approvedAt: new Date(),
        }),
        ...(payload.action === "APPLY" && {
          appliedBy: actorUser.id,
          appliedAt: new Date(),
        }),
      };

      const updated = await tx.budgetRevision.update({
        where: { id: revisionId },
        data: updateData,
      });

      if (payload.action === "APPLY") {
        const proposedBudget = revision.proposedBudget as Record<
          string,
          unknown
        >;
        const projectBudgetUpdate: Record<string, number> = {};
        for (const field of budgetFields) {
          const raw = proposedBudget[field];
          if (raw !== undefined && raw !== null && raw !== "") {
            const parsed = Number(raw);
            if (!Number.isNaN(parsed)) {
              projectBudgetUpdate[field] = parsed;
            }
          }
        }

        await tx.project.update({
          where: { id: revision.projectId },
          data: projectBudgetUpdate,
        });
      }

      await tx.budgetRevisionActionLog.create({
        data: {
          revisionId,
          projectId: revision.projectId,
          actionType: payload.action,
          actorUserId: actorUser.id,
          actorRole: payload.actorRole,
          fromStatus: revision.status,
          toStatus,
          note: payload.note,
        },
      });

      return updated;
    });

    if (
      payload.action === "APPLY" &&
      revision.status === "BR_DEAN_APPROVED" &&
      revision.project.currentStatusCode === "STATUS_6"
    ) {
      await prisma.$transaction(async (tx) => {
        const project = await tx.project.findUnique({
          where: { id: revision.projectId },
          select: { currentStatusId: true },
        });

        if (project?.currentStatusId) {
          await tx.projectStatusRecord.update({
            where: { id: project.currentStatusId },
            data: { exitedAt: new Date() },
          });
        }

        const statusRecord = await tx.projectStatusRecord.create({
          data: {
            projectId: revision.projectId,
            statusCode: "STATUS_7",
            statusLabel: statusLabels.STATUS_7,
            enteredBy: actorUser.id,
            branchChoice: "BUDGET_REVISION_DEAN_APPROVED",
          },
        });

        await tx.project.update({
          where: { id: revision.projectId },
          data: {
            currentStatusCode: "STATUS_7",
            currentStatusId: statusRecord.id,
            status1: formatStatusDisplay("STATUS_7"),
            status1Date: new Date(),
          },
        });

        await tx.projectStatusActionLog.create({
          data: {
            projectId: revision.projectId,
            statusRecordId: statusRecord.id,
            actionType: "BUDGET_REVISION_CHANGED_PROJECT_TO_STATUS_7",
            actorUserId: actorUser.id,
            actorRole: payload.actorRole,
          },
        });
      });
    }

    return successResponse({ revision: result });
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
