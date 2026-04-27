import { NextRequest, NextResponse } from "next/server";
import { statusService } from "@/lib/status-service";
import type { StatusCode } from "@/app/generated/prisma/client";

const ACTIVE_WORKFLOW_STATUS_CODES = new Set([
  "DRAFT",
  "STATUS_0",
  "STATUS_1",
  "STATUS_2",
  "STATUS_3",
  "STATUS_4",
  "STATUS_5",
  "STATUS_6",
  "STATUS_7",
  "STATUS_8",
  "STATUS_9",
  "STATUS_10",
  "RECALL",
]);

/**
 * POST /api/projects/[id]/status/transition
 * Execute a status transition
 *
 * Body: {
 *   toStatus: StatusCode;
 *   userId: string;
 *   actorRole?: "USER" | "ภาควิชา" | "งานวิจัย" | "งานแผน" | "งานคลัง" | "กายภาพ";
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

    const { toStatus, userId, branchChoice } = body;
    const actorRole =
      typeof body?.actorRole === "string" && body.actorRole.trim() !== ""
        ? body.actorRole
        : "USER";

    if (!toStatus || !userId) {
      return NextResponse.json(
        {
          error:
            "ข้อมูลไม่ครบถ้วน: ต้องระบุ toStatus และ userId (actorRole ไม่ระบุได้ ระบบจะถือเป็น USER)",
        },
        { status: 400 },
      );
    }

    if (!ACTIVE_WORKFLOW_STATUS_CODES.has(toStatus)) {
      return NextResponse.json(
        { error: "สถานะนี้ไม่อยู่ใน workflow ปัจจุบัน" },
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

    if (isDraftSubmit || isDeptGateForward) {
      const hasAssignment =
        await statusService.hasDepartmentHeadAssignment(projectId);
      if (!hasAssignment) {
        return NextResponse.json(
          {
            error:
              "ไม่พบการกำหนดหัวหน้าภาคของภาควิชานี้ กรุณาให้งานวิจัยกำหนดก่อนส่งหรืออนุมัติ",
          },
          { status: 400 },
        );
      }
    }

    if (isDeptGateForward) {
      const isAssignedHead = await statusService.isAssignedDepartmentHead(
        projectId,
        userId,
      );
      if (!isAssignedHead) {
        return NextResponse.json(
          {
            error: "ผู้ใช้นี้ไม่ใช่หัวหน้าภาคที่ถูกกำหนดของภาควิชานี้",
          },
          { status: 403 },
        );
      }
    }

    let isAuthorized = false;
    if (isDeptGateForward) {
      isAuthorized = actorRole === "ภาควิชา";
    } else if (isDraftSubmit) {
      isAuthorized = actorRole === "USER";
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
