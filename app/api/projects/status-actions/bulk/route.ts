import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { successResponse, handleApiError } from "@/lib/api-response";
import { ensureMockActor } from "@/lib/ensure-mock-actor";
import { actorRoles } from "@/lib/mock-actors";
import { StatusCode, formatStatusDisplay } from "@/lib/status-constants";
import { statusService } from "@/lib/status-service";

const bulkStatusActionSchema = z.object({
  action: z.literal("APPROVE_TO_BOARD"),
  projectIds: z.array(z.string().min(1)).min(1),
  actorRole: z.enum(actorRoles),
  actorUserId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const payload = bulkStatusActionSchema.parse(await request.json());

    if (payload.actorRole !== "หัวหน้าฝ่ายวิจัย") {
      return Response.json(
        { error: "action นี้ต้องใช้ role หัวหน้าฝ่ายวิจัย" },
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

    const projects = await prisma.project.findMany({
      where: { id: { in: payload.projectIds } },
      select: { id: true, currentStatusCode: true },
    });
    const foundIds = new Set(projects.map((project) => project.id));
    const missingIds = payload.projectIds.filter((id) => !foundIds.has(id));
    const invalidProjects = projects.filter(
      (project) => project.currentStatusCode !== StatusCode.STATUS_2,
    );

    if (missingIds.length > 0 || invalidProjects.length > 0) {
      return Response.json(
        {
          error: "อนุมัติแบบกลุ่มได้เฉพาะโครงการที่อยู่ใน STATUS_2",
          missingIds,
          invalidProjectIds: invalidProjects.map((project) => project.id),
        },
        { status: 400 },
      );
    }

    const results: Array<{
      projectId: string;
      currentStatusCode: StatusCode;
      displayStatus: string;
    }> = [];

    for (const projectId of payload.projectIds) {
      const result = await statusService.transitionStatus(
        projectId,
        StatusCode.STATUS_3,
        actorUser.id,
        "BULK_APPROVE_TO_BOARD",
      );

      if (!result.success || !result.statusRecord) {
        return Response.json(
          { error: result.error ?? "อนุมัติแบบกลุ่มไม่สำเร็จ", projectId },
          { status: 400 },
        );
      }

      const displayStatus = formatStatusDisplay(StatusCode.STATUS_3);
      await prisma.$transaction([
        prisma.project.update({
          where: { id: projectId },
          data: {
            status1: displayStatus,
            status1Date: new Date(),
          },
        }),
        prisma.projectStatusActionLog.create({
          data: {
            projectId,
            statusRecordId: result.statusRecord.id,
            actionType: payload.action,
            actorUserId: actorUser.id,
            actorRole: payload.actorRole,
            note: "อนุมัติแบบกลุ่มจากหน้า overview",
          },
        }),
      ]);

      results.push({
        projectId,
        currentStatusCode: StatusCode.STATUS_3,
        displayStatus,
      });
    }

    return successResponse({ success: true, results });
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
