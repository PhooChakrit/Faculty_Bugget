import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import {
  errorResponse,
  handleApiError,
  successResponse,
} from "@/lib/api-response";
import { ensureMockActor } from "@/lib/ensure-mock-actor";
import { statusService } from "@/lib/status-service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const editableStatuses = ["STATUS_6", "STATUS_7"];
const maxFileSize = 10 * 1024 * 1024;

const allowedExtensions = /\.(pdf|doc|docx|xlsx|xls)$/i;
const allowedTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/octet-stream",
]);

function isAllowedFile(file: File) {
  return (
    allowedExtensions.test(file.name) &&
    allowedTypes.has(file.type || "application/octet-stream")
  );
}

async function ensureOwnerActor(
  id: string,
  actorRole: string,
  actorUserId: string,
) {
  if (actorRole !== "USER" || !actorUserId) {
    return {
      error: Response.json(
        { error: "ไฟล์รายงานอัปโหลดได้เฉพาะเจ้าของโครงการ" },
        { status: 403 },
      ),
    };
  }

  const actorUser = await ensureMockActor(actorUserId);
  if (!actorUser) {
    return {
      error: Response.json(
        { error: "ไม่พบผู้ใช้สำหรับบันทึกการแนบไฟล์รายงาน" },
        { status: 400 },
      ),
    };
  }

  const project = await prisma.project.findUnique({
    where: { id },
    select: {
      id: true,
      currentStatusCode: true,
      currentStatusId: true,
    },
  });

  if (!project) {
    return { error: errorResponse("Project not found", 404) };
  }

  if (!editableStatuses.includes(project.currentStatusCode ?? "")) {
    return {
      error: Response.json(
        { error: "แนบไฟล์รายงานได้เฉพาะโครงการที่อยู่ระหว่างดำเนินการ (State 6/7)" },
        { status: 403 },
      ),
    };
  }

  return { actorRole, actorUser, project };
}

// POST /api/overviews/[id]/report-file - upload project report (owner only)
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const formData = await request.formData();
    const actorRole = String(formData.get("actorRole") ?? "");
    const actorUserId = String(formData.get("actorUserId") ?? "");
    const access = await ensureOwnerActor(id, actorRole, actorUserId);
    if ("error" in access) return access.error;

    const file = formData.get("file") as File | null;

    if (!file) {
      return errorResponse("No file uploaded", 400);
    }

    if (file.size > maxFileSize) {
      return errorResponse("ไฟล์ต้องมีขนาดไม่เกิน 10 MB", 400);
    }

    if (!isAllowedFile(file)) {
      return errorResponse(
        "รองรับเฉพาะไฟล์ .pdf, .doc, .docx, .xlsx หรือ .xls",
        400,
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const [updatedProject] = await prisma.$transaction([
      prisma.project.update({
        where: { id },
        data: {
          reportFile: buffer,
          reportFileName: file.name,
          reportFileType: file.type || "application/octet-stream",
          reportUploadedAt: new Date(),
        },
        select: {
          id: true,
          reportFileName: true,
          reportFileType: true,
          reportUploadedAt: true,
        },
      }),
      prisma.projectStatusActionLog.create({
        data: {
          projectId: id,
          statusRecordId: access.project.currentStatusId,
          actionType: "UPLOAD_REPORT_FILE",
          actorUserId: access.actorUser.id,
          actorRole: access.actorRole,
          note: file.name,
        },
      }),
    ]);

    // เจ้าของอัปโหลดรายงานแล้ว → ขอให้ 3 ฝ่ายยืนยันปิดโครงการ
    await statusService.notifyOnDataProgress(id);

    return successResponse({
      message: "แนบไฟล์รายงานสำเร็จ",
      file: {
        name: updatedProject.reportFileName,
        type: updatedProject.reportFileType,
        uploadedAt: updatedProject.reportUploadedAt,
        downloadUrl: `/api/overviews/${id}/report-file`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// GET /api/overviews/[id]/report-file - download project report
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const project = await prisma.project.findUnique({
      where: { id },
      select: {
        reportFile: true,
        reportFileName: true,
        reportFileType: true,
      },
    });

    if (!project) {
      return errorResponse("Project not found", 404);
    }

    if (!project.reportFile) {
      return errorResponse("ยังไม่มีไฟล์รายงาน", 404);
    }

    const fileName = project.reportFileName || "project-report";
    const encodedName = encodeURIComponent(fileName);

    return new Response(Buffer.from(project.reportFile), {
      headers: {
        "Content-Type": project.reportFileType || "application/octet-stream",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodedName}`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/overviews/[id]/report-file - remove project report (owner only)
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as {
      actorRole?: string;
      actorUserId?: string;
    };
    const access = await ensureOwnerActor(
      id,
      body.actorRole ?? "",
      body.actorUserId ?? "",
    );
    if ("error" in access) return access.error;

    await prisma.$transaction([
      prisma.project.update({
        where: { id },
        data: {
          reportFile: null,
          reportFileName: null,
          reportFileType: null,
          reportUploadedAt: null,
        },
      }),
      prisma.projectStatusActionLog.create({
        data: {
          projectId: id,
          statusRecordId: access.project.currentStatusId,
          actionType: "DELETE_REPORT_FILE",
          actorUserId: access.actorUser.id,
          actorRole: access.actorRole,
        },
      }),
    ]);

    return successResponse({ message: "ลบไฟล์รายงานสำเร็จ" });
  } catch (error) {
    return handleApiError(error);
  }
}
