import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { statusService } from "@/lib/status-service";

const reviewRecallSchema = z.object({
  reviewerId: z.string().min(1),
  actorRole: z.enum([
    "ภาควิชาวิทยาศาสตร์",
    "งานวิจัย",
    "งานแผน",
    "งานคลัง",
    "กายภาพ",
  ]),
  decision: z.enum(["APPROVE", "REJECT"]),
  note: z.string().optional(),
});

/**
 * POST /api/projects/[id]/recall/review
 * Department-head certification for recall request
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();
    const payload = reviewRecallSchema.parse(body);

    const result = await statusService.reviewRecallRequest(
      projectId,
      payload.reviewerId,
      payload.actorRole,
      payload.decision,
      payload.note,
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.statusCode ?? 400 },
      );
    }

    return NextResponse.json({
      success: true,
      transitioned: result.transitioned ?? false,
      message:
        payload.decision === "APPROVE"
          ? "หัวหน้าภาครับรองคำขอเรียกคืน และระบบเปลี่ยนสถานะเป็น RECALL"
          : "หัวหน้าภาคไม่รับรองคำขอเรียกคืน",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "ข้อมูลไม่ถูกต้อง", details: error.flatten() },
        { status: 400 },
      );
    }

    console.error("Recall review error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการพิจารณาคำขอเรียกคืน" },
      { status: 500 },
    );
  }
}
