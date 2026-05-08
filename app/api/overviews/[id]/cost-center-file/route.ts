import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import {
  errorResponse,
  handleApiError,
  successResponse,
} from "@/lib/api-response";
import { ensureMockActor } from "@/lib/ensure-mock-actor";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const editableStatuses = ["STATUS_4", "STATUS_5", "STATUS_6", "STATUS_7"];
const maxFileSize = 10 * 1024 * 1024;

const allowedExtensions = /\.(xlsx|xls|csv|pdf)$/i;
const allowedTypes = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
  "application/csv",
  "application/pdf",
  "application/octet-stream",
]);

function isAllowedFile(file: File) {
  return (
    allowedExtensions.test(file.name) &&
    allowedTypes.has(file.type || "application/octet-stream")
  );
}

async function ensurePlanningActor(request: NextRequest, id: string) {
  const actorRole = request.headers.get("x-actor-role") ?? "";
  const actorUserId = request.headers.get("x-actor-user-id") ?? "";

  if (actorRole !== "งานแผน" || !actorUserId) {
    return {
      error: Response.json(
        { error: "ไฟล์ศูนย์ต้นทุนแก้ไขได้เฉพาะงานแผน" },
        { status: 403 },
      ),
    };
  }

  const actorUser = await ensureMockActor(actorUserId);
  if (!actorUser) {
    return {
      error: Response.json(
        { error: "ไม่พบผู้ใช้สำหรับบันทึกการแนบไฟล์ศูนย์ต้นทุน" },
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
        { error: "แนบไฟล์ศูนย์ต้นทุนได้เฉพาะ State 4/5/6/7" },
        { status: 403 },
      ),
    };
  }

  return { actorRole, actorUser, project };
}

// POST /api/overviews/[id]/cost-center-file - upload cost center attachment
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const access = await ensurePlanningActor(request, id);
    if ("error" in access) return access.error;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return errorResponse("No file uploaded", 400);
    }

    if (file.size > maxFileSize) {
      return errorResponse("ไฟล์ต้องมีขนาดไม่เกิน 10 MB", 400);
    }

    if (!isAllowedFile(file)) {
      return errorResponse("รองรับเฉพาะไฟล์ .xlsx, .xls, .csv หรือ .pdf", 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const [updatedProject] = await prisma.$transaction([
      prisma.project.update({
        where: { id },
        data: {
          costCenter: file.name,
          costCenterFile: buffer,
          costCenterFileName: file.name,
          costCenterFileType: file.type || "application/octet-stream",
          costCenterUploadedAt: new Date(),
        },
        select: {
          id: true,
          costCenter: true,
          costCenterFileName: true,
          costCenterFileType: true,
          costCenterUploadedAt: true,
        },
      }),
      prisma.projectStatusActionLog.create({
        data: {
          projectId: id,
          statusRecordId: access.project.currentStatusId,
          actionType: "UPLOAD_COST_CENTER_FILE",
          actorUserId: access.actorUser.id,
          actorRole: access.actorRole,
          note: file.name,
        },
      }),
    ]);

    return successResponse({
      message: "แนบไฟล์ศูนย์ต้นทุนสำเร็จ",
      file: {
        name: updatedProject.costCenterFileName,
        type: updatedProject.costCenterFileType,
        uploadedAt: updatedProject.costCenterUploadedAt,
        downloadUrl: `/api/overviews/${id}/cost-center-file`,
      },
      costCenter: updatedProject.costCenter,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// GET /api/overviews/[id]/cost-center-file - download cost center attachment
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const project = await prisma.project.findUnique({
      where: { id },
      select: {
        costCenterFile: true,
        costCenterFileName: true,
        costCenterFileType: true,
      },
    });

    if (!project) {
      return errorResponse("Project not found", 404);
    }

    if (!project.costCenterFile) {
      return errorResponse("ยังไม่มีไฟล์ศูนย์ต้นทุน", 404);
    }

    const fileName = project.costCenterFileName || "cost-center-file";
    const encodedName = encodeURIComponent(fileName);

    return new Response(Buffer.from(project.costCenterFile), {
      headers: {
        "Content-Type":
          project.costCenterFileType || "application/octet-stream",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodedName}`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/overviews/[id]/cost-center-file - remove cost center attachment
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const access = await ensurePlanningActor(request, id);
    if ("error" in access) return access.error;

    await prisma.$transaction([
      prisma.project.update({
        where: { id },
        data: {
          costCenter: null,
          costCenterFile: null,
          costCenterFileName: null,
          costCenterFileType: null,
          costCenterUploadedAt: null,
        },
      }),
      prisma.projectStatusActionLog.create({
        data: {
          projectId: id,
          statusRecordId: access.project.currentStatusId,
          actionType: "DELETE_COST_CENTER_FILE",
          actorUserId: access.actorUser.id,
          actorRole: access.actorRole,
        },
      }),
    ]);

    return successResponse({ message: "ลบไฟล์ศูนย์ต้นทุนสำเร็จ" });
  } catch (error) {
    return handleApiError(error);
  }
}
