import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, handleApiError } from "@/lib/api-response";
import { statusService } from "@/lib/status-service";
import { StatusCode, statusLabels } from "@/lib/status-constants";
import { ensureMockActor } from "@/lib/ensure-mock-actor";
import { actorRoles } from "@/lib/mock-actors";
import { z } from "zod";

const INTERNAL_REVIEW_CHECKED_NOTE = "INTERNAL_REVIEW_CHECKED";

const statusActionSchema = z.object({
  action: z.enum([
    "SUBMIT_DRAFT",
    "DEPT_APPROVE",
    "MARK_INTERNAL_REVIEW_CHECKED",
    "COMPLETE_RESEARCH_REVIEW",
    "RETURN_FOR_REVISION",
    "APPROVE_TO_BOARD",
    "BOARD_APPROVE_TO_WAITING_RELEASE",
    "DEAN_APPROVE_TO_WAITING_RELEASE",
    "RELEASE_BOARD_PROJECT",
    "RELEASE_DEAN_PROJECT",
    "CLOSE_PROJECT",
    "RESUME_RECALL",
  ]),
  actorRole: z.enum(actorRoles),
  actorUserId: z.string().min(1),
  note: z.string().optional(),
});

const actionTransitions: Partial<
  Record<z.infer<typeof statusActionSchema>["action"], StatusCode>
> = {
  SUBMIT_DRAFT: StatusCode.STATUS_0,
  DEPT_APPROVE: StatusCode.STATUS_1,
  COMPLETE_RESEARCH_REVIEW: StatusCode.STATUS_2,
  RETURN_FOR_REVISION: StatusCode.STATUS_1,
  APPROVE_TO_BOARD: StatusCode.STATUS_3,
  BOARD_APPROVE_TO_WAITING_RELEASE: StatusCode.STATUS_4,
  DEAN_APPROVE_TO_WAITING_RELEASE: StatusCode.STATUS_5,
  RELEASE_BOARD_PROJECT: StatusCode.STATUS_6,
  RELEASE_DEAN_PROJECT: StatusCode.STATUS_7,
  CLOSE_PROJECT: StatusCode.STATUS_13,
  RESUME_RECALL: StatusCode.DRAFT,
};

const requiredRoleByAction: Record<
  z.infer<typeof statusActionSchema>["action"],
  z.infer<typeof statusActionSchema>["actorRole"]
> = {
  SUBMIT_DRAFT: "USER",
  DEPT_APPROVE: "ภาควิชาวิทยาศาสตร์",
  MARK_INTERNAL_REVIEW_CHECKED: "งานวิจัย",
  COMPLETE_RESEARCH_REVIEW: "งานวิจัย",
  RETURN_FOR_REVISION: "งานวิจัย",
  APPROVE_TO_BOARD: "หัวหน้าฝ่ายวิจัย",
  BOARD_APPROVE_TO_WAITING_RELEASE: "งานวิจัย",
  DEAN_APPROVE_TO_WAITING_RELEASE: "งานวิจัย",
  RELEASE_BOARD_PROJECT: "งานวิจัย",
  RELEASE_DEAN_PROJECT: "งานวิจัย",
  CLOSE_PROJECT: "งานวิจัย",
  RESUME_RECALL: "งานวิจัย",
};

const toDisplayStatus = (statusCode: StatusCode) => {
  if (statusCode === StatusCode.DRAFT || statusCode === StatusCode.RECALL) {
    return `${statusCode}. ${statusLabels[statusCode]}`;
  }

  return `${statusCode.replace("STATUS_", "")}. ${statusLabels[statusCode]}`;
};

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const payload = statusActionSchema.parse(await request.json());

    const requiredRole = requiredRoleByAction[payload.action];
    if (payload.actorRole !== requiredRole) {
      return Response.json(
        { error: `action นี้ต้องใช้ role ${requiredRole}` },
        { status: 403 },
      );
    }

    const actorUser = await ensureMockActor(payload.actorUserId);
    if (!actorUser) {
      return Response.json(
        { error: "ไม่พบผู้ใช้สำหรับบันทึก action/status log" },
        { status: 400 },
      );
    }

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        currentStatus: true,
        meetings: true,
      },
    });

    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    if (payload.action === "MARK_INTERNAL_REVIEW_CHECKED") {
      if (
        project.currentStatusCode !== "STATUS_1" ||
        !project.currentStatusId
      ) {
        return Response.json(
          { error: "ติดธงตรวจสอบแล้วได้เฉพาะโครงการที่อยู่ใน STATUS_1" },
          { status: 400 },
        );
      }

      const currentNotes = project.currentStatus?.notes ?? "";
      const notes = currentNotes.includes(INTERNAL_REVIEW_CHECKED_NOTE)
        ? currentNotes
        : [currentNotes, INTERNAL_REVIEW_CHECKED_NOTE]
            .filter(Boolean)
            .join("\n");

      const [, actionLog] = await prisma.$transaction([
        prisma.projectStatusRecord.update({
          where: { id: project.currentStatusId },
          data: { notes },
        }),
        prisma.projectStatusActionLog.create({
          data: {
            projectId: id,
            statusRecordId: project.currentStatusId,
            actionType: INTERNAL_REVIEW_CHECKED_NOTE,
            actorUserId: actorUser.id,
            actorRole: payload.actorRole,
            note: payload.note ?? "ตรวจสอบแล้ว (1.5)",
          },
          include: {
            actorUser: {
              select: { id: true, name: true, email: true },
            },
          },
        }),
      ]);

      return successResponse({
        success: true,
        reviewChecked: true,
        actionLog,
      });
    }

    if (
      payload.action === "COMPLETE_RESEARCH_REVIEW" &&
      !project.currentStatus?.notes?.includes(INTERNAL_REVIEW_CHECKED_NOTE)
    ) {
      return Response.json(
        {
          error:
            "ต้องติดธงตรวจสอบแล้ว (1.5) ก่อนเปลี่ยนจาก STATUS_1 เป็น STATUS_2",
        },
        { status: 400 },
      );
    }

    if (
      (payload.action === "BOARD_APPROVE_TO_WAITING_RELEASE" ||
        payload.action === "DEAN_APPROVE_TO_WAITING_RELEASE") &&
      !project.meetings.some((meeting) => meeting.type === "BOARD")
    ) {
      return Response.json(
        {
          error:
            "ต้องบันทึกข้อมูลมติที่ประชุมคณะกรรมการก่อนเปลี่ยนจาก STATUS_3",
        },
        { status: 400 },
      );
    }

    if (payload.action === "DEPT_APPROVE") {
      const isAssignedHead = await statusService.isAssignedDepartmentHead(
        id,
        actorUser.id,
      );
      if (!isAssignedHead) {
        return Response.json(
          { error: "ผู้ใช้นี้ไม่ใช่หัวหน้าภาคที่ถูกกำหนดของภาควิชานี้" },
          { status: 403 },
        );
      }
    }

    const toStatus = actionTransitions[payload.action];
    if (!toStatus) {
      return Response.json({ error: "Unsupported action" }, { status: 400 });
    }

    const result = await statusService.transitionStatus(
      id,
      toStatus,
      actorUser.id,
      payload.note,
    );

    if (!result.success) {
      return Response.json(
        { error: result.error ?? "Invalid status transition" },
        { status: 400 },
      );
    }

    if (result.statusRecord) {
      await prisma.projectStatusActionLog.create({
        data: {
          projectId: id,
          statusRecordId: result.statusRecord.id,
          actionType: payload.action,
          actorUserId: actorUser.id,
          actorRole: payload.actorRole,
          note: payload.note,
        },
      });
    }

    const displayStatus = toDisplayStatus(toStatus);
    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        status1: displayStatus,
        status1Date: new Date(),
      },
    });

    return successResponse({
      success: true,
      project: updatedProject,
      statusRecord: result.statusRecord,
      displayStatus,
      currentStatusCode: toStatus,
    });
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
