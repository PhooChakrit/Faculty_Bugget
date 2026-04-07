import { NextRequest, NextResponse } from "next/server";
import { statusService } from "@/lib/status-service";
import { prisma } from "@/lib/prisma";
import { statusLabels, statusColors } from "@/lib/status-constants";

/**
 * GET /api/projects/[id]/status
 * Get current status and available transitions
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params;

    // Get project with current status
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        currentStatus: {
          include: {
            enteredByUser: {
              select: { id: true, name: true, email: true },
            },
            notifications: {
              include: {
                completer: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "โครงการไม่พบในระบบ" },
        { status: 404 },
      );
    }

    // Get available transitions
    const availableTransitions =
      await statusService.getAvailableTransitions(projectId);

    // Format response
    const currentStatus = project.currentStatus
      ? {
          code: project.currentStatus.statusCode,
          label: statusLabels[project.currentStatus.statusCode],
          color: statusColors[project.currentStatus.statusCode],
          enteredAt: project.currentStatus.enteredAt,
          enteredBy: project.currentStatus.enteredByUser,
          notifications: project.currentStatus.notifications.map((n) => ({
            type: n.notificationType,
            isRequired: n.isRequired,
            isCompleted: n.isCompleted,
            completedAt: n.completedAt,
            completedBy: n.completer,
          })),
        }
      : null;

    return NextResponse.json({
      currentStatus,
      availableTransitions: availableTransitions.map((t) => ({
        toStatus: t.toStatus,
        label: t.label,
        color: statusColors[t.toStatus],
        condition: t.condition,
      })),
    });
  } catch (error) {
    console.error("Get status error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูลสถานะ" },
      { status: 500 },
    );
  }
}
