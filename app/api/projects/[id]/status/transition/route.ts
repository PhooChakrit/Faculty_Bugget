import { NextRequest, NextResponse } from 'next/server';
import { statusService } from '@/lib/status-service';
import type { StatusCode } from '@/app/generated/prisma/client';

/**
 * POST /api/projects/[id]/status/transition
 * Execute a status transition
 * 
 * Body: {
 *   toStatus: StatusCode;
 *   userId: string;
 *   branchChoice?: string;
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    const body = await request.json();

    const { toStatus, userId, branchChoice } = body;

    if (!toStatus || !userId) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ครบถ้วน: ต้องระบุ toStatus และ userId' },
        { status: 400 }
      );
    }

    // Validate transition first
    const validation = await statusService.canTransition(
      projectId,
      toStatus as StatusCode,
      userId
    );

    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: validation.reason,
          availableTransitions: validation.availableTransitions
        },
        { status: 400 }
      );
    }

    // Execute transition
    const result = await statusService.transitionStatus(
      projectId,
      toStatus as StatusCode,
      userId,
      branchChoice
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      statusRecord: result.statusRecord
    });
  } catch (error) {
    console.error('Status transition error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะ' },
      { status: 500 }
    );
  }
}
