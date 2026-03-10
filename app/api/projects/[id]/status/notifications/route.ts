import { NextRequest, NextResponse } from 'next/server';
import { statusService } from '@/lib/status-service';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/projects/[id]/status/notifications
 * Get notification checklist for STATUS_10
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;

    // Check if project is in STATUS_10
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { currentStatusCode: true }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'โครงการไม่พบในระบบ' },
        { status: 404 }
      );
    }

    if (project.currentStatusCode !== 'STATUS_10') {
      return NextResponse.json(
        { error: 'โครงการไม่อยู่ในขั้นตอนการแจ้งหน่วยงาน (STATUS_10)' },
        { status: 400 }
      );
    }

    const checklist = await statusService.getNotificationChecklist(projectId);

    // Check if all required notifications are complete
    const allRequiredComplete = await statusService.areAllRequiredNotificationsComplete(projectId);

    return NextResponse.json({
      checklist,
      canProceed: allRequiredComplete
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลการแจ้ง' },
      { status: 500 }
    );
  }
}
