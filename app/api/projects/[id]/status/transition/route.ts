import { NextRequest, NextResponse } from "next/server";
import { statusService } from "@/lib/status-service";
import type { StatusCode } from "@/app/generated/prisma/client";

/**
 * POST /api/projects/[id]/status/transition
 * Execute a status transition
 *
 * Body: {
 *   toStatus: StatusCode;
 *   userId: string;
 *   actorRole: "ภาควิชา" | "งานวิจัย" | "งานแผน" | "งานคลัง" | "กายภาพ";
 *   branchChoice?: string;
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();

    const { toStatus, userId, actorRole, branchChoice } = body;

    if (!toStatus || !userId || !actorRole) {
      return NextResponse.json(
        { error: "ข้อมูลไม่ครบถ้วน: ต้องระบุ toStatus, userId และ actorRole" },
        { status: 400 },
      );
    }

    const project = await statusService.getCurrentStatus(projectId);
    if (!project?.currentStatusCode) {
      return NextResponse.json(
        { error: "โครงการยังไม่มีสถานะปัจจุบัน" },
        { status: 400 },
      );
    }

    const fromStatus = project.currentStatusCode;

    const isDeptGateForward =
      fromStatus === "STATUS_0" && toStatus === "STATUS_1";
    const isDraftSubmit = fromStatus === "DRAFT" && toStatus === "STATUS_0";
    const isClose = toStatus === "STATUS_13";

    let isAuthorized = false;
    if (isDeptGateForward || isDraftSubmit) {
      isAuthorized = actorRole === "ภาควิชา";
    } else if (isClose) {
      isAuthorized = actorRole === "งานวิจัย" || actorRole === "กายภาพ";
    } else {
      isAuthorized = actorRole === "งานวิจัย";
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์เปลี่ยนสถานะ" },
        { status: 403 },
      );
    }

    // Validate transition first
    const validation = await statusService.canTransition(
      projectId,
      toStatus as StatusCode,
    );

    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: validation.reason,
          availableTransitions: validation.availableTransitions,
        },
        { status: 400 },
      );
    }

    // Execute transition
    const result = await statusService.transitionStatus(
      projectId,
      toStatus as StatusCode,
      userId,
      branchChoice,
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      statusRecord: result.statusRecord,
    });
  } catch (error) {
    console.error("Status transition error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการเปลี่ยนสถานะ" },
      { status: 500 },
    );
  }
}
