import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * POST /api/projects/[id]/request-budget-revision
 * Enter budget revision mode: any status (except DRAFT/STATUS_0/STATUS_99) → STATUS_99
 * Stores the previous status so we can restore it after editing.
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

    const blocked = ["DRAFT", "STATUS_0", "STATUS_99"];
    if (blocked.includes(project.currentStatusCode ?? "")) {
      return NextResponse.json(
        {
          error: "ไม่สามารถขอแก้ไขการเงินในสถานะนี้ได้",
        },
        { status: 400 },
      );
    }

    await prisma.project.update({
      where: { id },
      data: {
        previousStatusCode: project.currentStatusCode,
        currentStatusCode: "STATUS_99",
      },
    });

    return NextResponse.json({
      success: true,
      message: "เข้าสู่โหมดแก้ไขการเงินแล้ว",
    });
  } catch (error) {
    console.error("Request budget revision error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการส่งคำขอ" },
      { status: 500 },
    );
  }
}
