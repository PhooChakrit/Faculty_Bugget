import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";
import { successResponse, handleApiError } from "@/lib/api-response";
import { deleteMeetingSchema, updateMeetingsSchema } from "../../schema";
import { ensureMockActor } from "@/lib/ensure-mock-actor";
import { statusService } from "@/lib/status-service";
import { StatusCode, formatStatusDisplay } from "@/lib/status-constants";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

// PATCH /api/overviews/[id]/meetings - Update project meetings
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { meetings, deanApprovalLink, actorRole, actorUserId } =
      updateMeetingsSchema.parse(body);

    if (actorRole !== "งานวิจัย" || !actorUserId) {
      return Response.json(
        { error: "ข้อมูลมติประชุมแก้ไขได้เฉพาะงานวิจัย" },
        { status: 403 },
      );
    }

    const actorUser = await ensureMockActor(actorUserId);
    if (!actorUser) {
      return Response.json(
        { error: "ไม่พบผู้ใช้สำหรับบันทึกการแก้ไขมติประชุม" },
        { status: 400 },
      );
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id },
      include: { meetings: true },
    });

    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    const decisionMeeting = meetings.find((meeting) =>
      ["STATUS_4", "STATUS_5"].includes(meeting.decisionStatusCode ?? ""),
    );

    // Use a transaction to update meetings atomically without deleting history.
    const result = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        for (const m of meetings) {
          const data = {
            type: m.type,
            no: m.no,
            date: new Date(m.date),
            purpose: m.purpose || null,
            decisionStatusCode: m.decisionStatusCode || null,
          };

          if (m.id && !m.id.startsWith("new-")) {
            await tx.meeting.updateMany({
              where: { id: m.id, projectId: id },
              data,
            });
          } else {
            await tx.meeting.create({
              data: {
                ...data,
                projectId: id,
              },
            });
          }
        }

        if (typeof deanApprovalLink === "string") {
          await tx.project.update({
            where: { id },
            data: { docLink: deanApprovalLink.trim() || null },
          });
        }

        await tx.projectStatusActionLog.create({
          data: {
            projectId: id,
            statusRecordId: project.currentStatusId,
            actionType: "UPSERT_MEETINGS",
            actorUserId: actorUser.id,
            actorRole,
          },
        });

        return tx.project.findUnique({
          where: { id },
          include: {
            meetings: {
              orderBy: { date: "asc" },
            },
          },
        });
      },
    );

    if (
      decisionMeeting?.decisionStatusCode &&
      project.currentStatusCode === "STATUS_3"
    ) {
      const resultStatus = await statusService.transitionStatus(
        id,
        decisionMeeting.decisionStatusCode as StatusCode,
        actorUser.id,
        `MEETING_DECISION:${decisionMeeting.decisionStatusCode}`,
      );

      if (!resultStatus.success || !resultStatus.statusRecord) {
        return Response.json(
          { error: resultStatus.error ?? "เปลี่ยนสถานะจากมติไม่สำเร็จ" },
          { status: 400 },
        );
      }

      await prisma.$transaction([
        prisma.project.update({
          where: { id },
          data: {
            status1: formatStatusDisplay(decisionMeeting.decisionStatusCode),
            status1Date: new Date(),
          },
        }),
        prisma.projectStatusActionLog.create({
          data: {
            projectId: id,
            statusRecordId: resultStatus.statusRecord.id,
            actionType: "MEETING_DECISION_TRANSITION",
            actorUserId: actorUser.id,
            actorRole,
            note: decisionMeeting.decisionStatusCode,
          },
        }),
      ]);
    }

    // เอกสารอนุมัติคณบดี (docLink) อาจถูกตั้งค่า → เช็คว่าเส้น B พร้อมอนุมัติหรือยัง
    await statusService.notifyOnDataProgress(id);

    return successResponse({
      success: true,
      project: result,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const body = await request.json();
    const parsed = updateMeetingsSchema
      .extend({ meetings: updateMeetingsSchema.shape.meetings.min(1).max(1) })
      .parse(body);

    return PATCH(
      new NextRequest(request.url, {
        method: "PATCH",
        headers: request.headers,
        body: JSON.stringify(parsed),
      }),
      context,
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { meetingId, actorRole, actorUserId } = deleteMeetingSchema.parse(
      await request.json(),
    );

    if (actorRole !== "งานวิจัย" || !actorUserId) {
      return Response.json(
        { error: "ข้อมูลมติประชุมแก้ไขได้เฉพาะงานวิจัย" },
        { status: 403 },
      );
    }

    const actorUser = await ensureMockActor(actorUserId);
    if (!actorUser) {
      return Response.json(
        { error: "ไม่พบผู้ใช้สำหรับบันทึกการลบมติประชุม" },
        { status: 400 },
      );
    }

    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      select: { projectId: true, decisionStatusCode: true },
    });

    if (!meeting || meeting.projectId !== id) {
      return Response.json({ error: "Meeting not found" }, { status: 404 });
    }

    if (meeting.decisionStatusCode) {
      return Response.json(
        { error: "ไม่สามารถลบมติที่ใช้เป็นผลการเปลี่ยนสถานะแล้ว" },
        { status: 400 },
      );
    }

    const updatedProject = await prisma.$transaction(async (tx) => {
      await tx.meeting.delete({ where: { id: meetingId } });
      await tx.projectStatusActionLog.create({
        data: {
          projectId: id,
          actionType: "DELETE_MEETING",
          actorUserId: actorUser.id,
          actorRole,
        },
      });
      return tx.project.findUnique({
        where: { id },
        include: { meetings: { orderBy: { date: "asc" } } },
      });
    });

    return successResponse({ success: true, project: updatedProject });
  } catch (error) {
    return handleApiError(error);
  }
}
