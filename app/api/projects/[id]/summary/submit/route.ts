import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * POST /api/projects/[id]/summary/submit
 * Business step for STATUS_6/7: USER submits summary without changing status
 *
 * Body: {
 *   userId: string;
 *   summaryText?: string;
 *   docLink?: string;
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();

    const userId = typeof body?.userId === "string" ? body.userId.trim() : "";
    const summaryText =
      typeof body?.summaryText === "string" ? body.summaryText.trim() : "";
    const docLink =
      typeof body?.docLink === "string" ? body.docLink.trim() : "";

    if (!userId) {
      return NextResponse.json({ error: "ต้องระบุ userId" }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        currentStatusCode: true,
        currentStatusId: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "โครงการไม่พบในระบบ" },
        { status: 404 },
      );
    }

    if (
      project.currentStatusCode !== "STATUS_6" &&
      project.currentStatusCode !== "STATUS_7"
    ) {
      return NextResponse.json(
        {
          error:
            "สามารถส่งสรุปโครงการได้เฉพาะสถานะ 6/7 เท่านั้น และไม่ต้องรอการอนุมัติหัวหน้าภาค",
        },
        { status: 400 },
      );
    }

    if (!project.currentStatusId) {
      return NextResponse.json(
        { error: "โครงการยังไม่มีรายการสถานะปัจจุบัน" },
        { status: 400 },
      );
    }

    const stamp = new Date().toISOString();
    const summaryLine = summaryText
      ? `SUMMARY_SUBMITTED by ${userId} at ${stamp}: ${summaryText}`
      : `SUMMARY_SUBMITTED by ${userId} at ${stamp}`;

    await prisma.$transaction(async (tx) => {
      const currentStatus = await tx.projectStatusRecord.findUnique({
        where: { id: project.currentStatusId! },
        select: { notes: true },
      });

      await tx.projectStatusRecord.update({
        where: { id: project.currentStatusId! },
        data: {
          notes: currentStatus?.notes
            ? `${currentStatus.notes}\n${summaryLine}`
            : summaryLine,
        },
      });

      if (docLink) {
        await tx.project.update({
          where: { id: projectId },
          data: { docLink },
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: "บันทึกการส่งสรุปโครงการเรียบร้อยแล้ว",
      currentStatusCode: project.currentStatusCode,
    });
  } catch (error) {
    console.error("Summary submit error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการส่งสรุปโครงการ" },
      { status: 500 },
    );
  }
}
