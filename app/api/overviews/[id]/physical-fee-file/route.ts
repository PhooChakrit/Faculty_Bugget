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

type PhysicalFileKind = "maintenance" | "electricity";

const editableStatuses = ["STATUS_6", "STATUS_7"];
const maxFileSize = 10 * 1024 * 1024;

const allowedExtensions = /\.(xlsx|xls|csv|pdf|jpg|jpeg|png)$/i;
const allowedTypes = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
  "application/csv",
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/octet-stream",
]);

const fileFieldByKind = {
  maintenance: {
    file: "maintenanceFeeActualFile",
    name: "maintenanceFeeActualFileName",
    type: "maintenanceFeeActualFileType",
    uploadedAt: "maintenanceFeeActualUploadedAt",
    actionUpload: "UPLOAD_MAINTENANCE_FEE_ACTUAL_FILE",
    actionDelete: "DELETE_MAINTENANCE_FEE_ACTUAL_FILE",
    fallbackName: "maintenance-fee-actual-file",
  },
  electricity: {
    file: "electricityFeeActualFile",
    name: "electricityFeeActualFileName",
    type: "electricityFeeActualFileType",
    uploadedAt: "electricityFeeActualUploadedAt",
    actionUpload: "UPLOAD_ELECTRICITY_FEE_ACTUAL_FILE",
    actionDelete: "DELETE_ELECTRICITY_FEE_ACTUAL_FILE",
    fallbackName: "electricity-fee-actual-file",
  },
} as const;

function parseKind(value: FormDataEntryValue | string | null): PhysicalFileKind | null {
  return value === "maintenance" || value === "electricity" ? value : null;
}

function isAllowedFile(file: File) {
  return (
    allowedExtensions.test(file.name) &&
    allowedTypes.has(file.type || "application/octet-stream")
  );
}

async function ensurePhysicalActor(
  id: string,
  actorRole: string,
  actorUserId: string,
) {
  if (actorRole !== "กายภาพ" || !actorUserId) {
    return {
      error: Response.json(
        { error: "ไฟล์ข้อมูลกายภาพแก้ไขได้เฉพาะงานกายภาพ" },
        { status: 403 },
      ),
    };
  }

  const actorUser = await ensureMockActor(actorUserId);
  if (!actorUser) {
    return {
      error: Response.json(
        { error: "ไม่พบผู้ใช้สำหรับบันทึกการแนบไฟล์ข้อมูลกายภาพ" },
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
        { error: "แนบไฟล์ข้อมูลกายภาพได้เฉพาะ State 6/7" },
        { status: 403 },
      ),
    };
  }

  return { actorRole, actorUser, project };
}

// POST /api/overviews/[id]/physical-fee-file - upload optional physical attachment
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const formData = await request.formData();
    const kind = parseKind(formData.get("kind"));
    if (!kind) {
      return errorResponse("Invalid physical file kind", 400);
    }

    const actorRole = String(formData.get("actorRole") ?? "");
    const actorUserId = String(formData.get("actorUserId") ?? "");
    const access = await ensurePhysicalActor(id, actorRole, actorUserId);
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
        "รองรับเฉพาะไฟล์ .xlsx, .xls, .csv, .pdf, .jpg หรือ .png",
        400,
      );
    }

    const fields = fileFieldByKind[kind];
    const buffer = Buffer.from(await file.arrayBuffer());

    const [updatedProject] = await prisma.$transaction([
      prisma.project.update({
        where: { id },
        data: {
          [fields.file]: buffer,
          [fields.name]: file.name,
          [fields.type]: file.type || "application/octet-stream",
          [fields.uploadedAt]: new Date(),
        },
        select: {
          [fields.name]: true,
          [fields.type]: true,
          [fields.uploadedAt]: true,
        },
      }),
      prisma.projectStatusActionLog.create({
        data: {
          projectId: id,
          statusRecordId: access.project.currentStatusId,
          actionType: fields.actionUpload,
          actorUserId: access.actorUser.id,
          actorRole: access.actorRole,
          note: file.name,
        },
      }),
    ]);

    return successResponse({
      message: "แนบไฟล์ข้อมูลกายภาพสำเร็จ",
      file: {
        name: updatedProject[fields.name],
        type: updatedProject[fields.type],
        uploadedAt: updatedProject[fields.uploadedAt],
        downloadUrl: `/api/overviews/${id}/physical-fee-file?kind=${kind}`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// GET /api/overviews/[id]/physical-fee-file?kind=maintenance|electricity
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const kind = parseKind(new URL(request.url).searchParams.get("kind"));
    if (!kind) {
      return errorResponse("Invalid physical file kind", 400);
    }

    const fields = fileFieldByKind[kind];
    const project = await prisma.project.findUnique({
      where: { id },
      select: {
        [fields.file]: true,
        [fields.name]: true,
        [fields.type]: true,
      },
    });

    if (!project) {
      return errorResponse("Project not found", 404);
    }

    const file = project[fields.file] as unknown as Uint8Array | null;
    if (!file) {
      return errorResponse("ยังไม่มีไฟล์ข้อมูลกายภาพ", 404);
    }

    const fileName =
      (project[fields.name] as unknown as string | null) ||
      fields.fallbackName;
    const contentType =
      (project[fields.type] as unknown as string | null) ||
      "application/octet-stream";
    const encodedName = encodeURIComponent(fileName);

    return new Response(Buffer.from(file), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename*=UTF-8''${encodedName}`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/overviews/[id]/physical-fee-file
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as {
      kind?: string;
      actorRole?: string;
      actorUserId?: string;
    };
    const kind = parseKind(body.kind ?? null);
    if (!kind) {
      return errorResponse("Invalid physical file kind", 400);
    }

    const access = await ensurePhysicalActor(
      id,
      body.actorRole ?? "",
      body.actorUserId ?? "",
    );
    if ("error" in access) return access.error;

    const fields = fileFieldByKind[kind];
    await prisma.$transaction([
      prisma.project.update({
        where: { id },
        data: {
          [fields.file]: null,
          [fields.name]: null,
          [fields.type]: null,
          [fields.uploadedAt]: null,
        },
      }),
      prisma.projectStatusActionLog.create({
        data: {
          projectId: id,
          statusRecordId: access.project.currentStatusId,
          actionType: fields.actionDelete,
          actorUserId: access.actorUser.id,
          actorRole: access.actorRole,
        },
      }),
    ]);

    return successResponse({ message: "ลบไฟล์ข้อมูลกายภาพสำเร็จ" });
  } catch (error) {
    return handleApiError(error);
  }
}
