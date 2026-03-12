import { NextRequest, NextResponse } from "next/server";
import { statusService } from "@/lib/status-service";
import { statusLabels, statusColors } from "@/lib/status-constants";

/**
 * GET /api/projects/[id]/status/history
 * Get complete status history for a project
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params;

    const history = await statusService.getStatusHistory(projectId);

    // Format response
    const formattedHistory = history.map((record) => ({
      id: record.id,
      statusCode: record.statusCode,
      label: statusLabels[record.statusCode],
      color: statusColors[record.statusCode],
      enteredAt: record.enteredAt,
      exitedAt: record.exitedAt,
      duration: record.exitedAt
        ? Math.floor(
            (record.exitedAt.getTime() - record.enteredAt.getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : null, // duration in days
      enteredBy: record.enteredBy,
      branchChoice: record.branchChoice,
      notifications: record.notifications.map((n) => ({
        type: n.notificationType,
        isRequired: n.isRequired,
        isCompleted: n.isCompleted,
        completedAt: n.completedAt,
        completedBy: n.completedBy,
      })),
    }));

    return NextResponse.json({
      history: formattedHistory,
    });
  } catch (error) {
    console.error("Get status history error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงประวัติสถานะ" },
      { status: 500 },
    );
  }
}
