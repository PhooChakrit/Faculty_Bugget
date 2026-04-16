import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { StatusCode } from "@/app/generated/prisma/client";

/**
 * POST /api/projects/[id]/request-revision
 * Request document revision: STATUS_1 → RECALL (await admin approve on overviews → DRAFT)
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const project = await prisma.project.findUnique({
      where: { id },
      select: { currentStatusCode: true },
    });

    if (!project) {
      return NextResponse.json({ error: "ไม่พบโครงการ" }, { status: 404 });
    }

    if (project.currentStatusCode !== StatusCode.STATUS_1) {
      return NextResponse.json(
        {
          error: "สามารถขอแก้ไขได้เฉพาะโครงการที่อยู่ในขั้น STATUS_1 เท่านั้น",
        },
        { status: 400 },
      );
    }

    await prisma.project.update({
      where: { id },
      data: {
        currentStatusCode: StatusCode.RECALL,
        status1: "RECALL. ดึงกลับเอกสาร",
        draftState: "SUBMITTED",
      },
    });

    return NextResponse.json({
      success: true,
      message: "ส่งคำขอแก้ไขเอกสารเรียบร้อย",
    });
  } catch (error) {
    console.error("Request revision error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการส่งคำขอแก้ไขเอกสาร" },
      { status: 500 },
    );
  }
}
