import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-response";

type RouteParams = {
  params: Promise<{ id: string }>;
};

// POST /api/projects/[id]/import-excel — store uploaded file into DB
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Verify project exists
    const existingProject = await prisma.project.findUnique({
      where: { id },
    });

    if (!existingProject) {
      return errorResponse("Project not found", 404);
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return errorResponse("No file uploaded", 400);
    }

    // Read file as Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Update project with the file
    const updated = await prisma.project.update({
      where: { id },
      data: {
        excelFile: buffer,
        excelFileName: file.name,
        excelFileType: file.type || "application/octet-stream",
        excelUploadedAt: new Date(),
      },
      select: {
        id: true,
        excelFileName: true,
        excelFileType: true,
        excelUploadedAt: true,
      },
    });

    return successResponse({
      message: "อัปโหลดไฟล์สำเร็จ",
      file: {
        name: updated.excelFileName,
        type: updated.excelFileType,
        uploadedAt: updated.excelUploadedAt,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// GET /api/projects/[id]/import-excel — download the stored file
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const project = await prisma.project.findUnique({
      where: { id },
      select: {
        excelFile: true,
        excelFileName: true,
        excelFileType: true,
      },
    });

    if (!project) {
      return errorResponse("Project not found", 404);
    }

    if (!project.excelFile) {
      return errorResponse("No file attached to this project", 404);
    }

    const fileName = project.excelFileName || "file.xlsx";
    const encodedName = encodeURIComponent(fileName);

    return new Response(Buffer.from(project.excelFile), {
      headers: {
        "Content-Type": project.excelFileType || "application/octet-stream",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodedName}`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/projects/[id]/import-excel — remove the stored file
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const existingProject = await prisma.project.findUnique({
      where: { id },
    });

    if (!existingProject) {
      return errorResponse("Project not found", 404);
    }

    await prisma.project.update({
      where: { id },
      data: {
        excelFile: null,
        excelFileName: null,
        excelFileType: null,
        excelUploadedAt: null,
      },
    });

    return successResponse({ message: "ลบไฟล์สำเร็จ" });
  } catch (error) {
    return handleApiError(error);
  }
}
