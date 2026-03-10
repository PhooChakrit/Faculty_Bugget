import { NextRequest, NextResponse } from 'next/server';
import { statusService } from '@/lib/status-service';
import type { NotificationType } from '@/app/generated/prisma/client';

/**
 * POST /api/projects/[id]/status/notifications/[type]/complete
 * Mark a notification as complete
 * 
 * Body: {
 *   userId: string;
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; type: string } }
) {
  try {
    const projectId = params.id;
    const notificationType = params.type.toUpperCase() as NotificationType;

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'ต้องระบุ userId' },
        { status: 400 }
      );
    }

    // Validate notification type
    const validTypes = ['DEPT_HEAD', 'FINANCE', 'PLANNING', 'PHYSICAL'];
    if (!validTypes.includes(notificationType)) {
      return NextResponse.json(
        { error: 'ประเภทการแจ้งไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    const result = await statusService.completeNotification(
      projectId,
      notificationType,
      userId
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Check if all required notifications are now complete
    const allRequiredComplete = await statusService.areAllRequiredNotificationsComplete(projectId);

    return NextResponse.json({
      success: true,
      canProceedToNext: allRequiredComplete
    });
  } catch (error) {
    console.error('Complete notification error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการบันทึก' },
      { status: 500 }
    );
  }
}
