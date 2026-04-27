import { NextRequest, NextResponse } from "next/server";
import { statusService } from "@/lib/status-service";

/**
 * POST /api/projects/[id]/recall
 * Request document recall (pending department-head certification)
 * Can only be requested from STATUS_1
 *
 * Body: {
 *   userId: string;
 *   reason?: string;
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();

    const { userId, reason } = body;

    if (!userId) {
      return NextResponse.json({ error: "ต้องระบุ userId" }, { status: 400 });
    }

    const result = await statusService.recallDocument(
      projectId,
      userId,
      reason,
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      requestId: result.requestId,
      message: "ส่งคำขอเรียกคืนเอกสารแล้ว รอหัวหน้าภาครับรอง",
    });
  } catch (error) {
    console.error("Recall document error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการเรียกคืนเอกสาร" },
      { status: 500 },
    );
  }
}
