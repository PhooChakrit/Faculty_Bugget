import { NextRequest, NextResponse } from 'next/server';
import { statusService } from '@/lib/status-service';

/**
 * POST /api/projects/[id]/recall
 * Request document recall (transition to RECALL status)
 * Can only be done from STATUS_1
 * 
 * Body: {
 *   userId: string;
 *   reason?: string;
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    const body = await request.json();

    const { userId, reason } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'ต้องระบุ userId' },
        { status: 400 }
      );
    }

    const result = await statusService.recallDocument(projectId, userId, reason);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'เรียกคืนเอกสารเรียบร้อย'
    });
  } catch (error) {
    console.error('Recall document error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการเรียกคืนเอกสาร' },
      { status: 500 }
    );
  }
}
