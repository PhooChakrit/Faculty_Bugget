import { NextRequest } from "next/server";
import { z } from "zod";
import { successResponse, handleApiError } from "@/lib/api-response";
import { statusService } from "@/lib/status-service";
import { actorRoles } from "@/lib/mock-actors";
import { ensureMockActor } from "@/lib/ensure-mock-actor";

const completionSchema = z.object({
  role: z.enum(["RESEARCH", "PHYSICAL", "FINANCE"]),
  isComplete: z.boolean(),
  notes: z.string().optional(),
  actorRole: z.enum(actorRoles),
  actorUserId: z.string().min(1),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const payload = completionSchema.parse(body);

    const roleByActor =
      payload.actorRole === "งานวิจัย"
        ? "RESEARCH"
        : payload.actorRole === "กายภาพ"
          ? "PHYSICAL"
          : payload.actorRole === "งานคลัง"
            ? "FINANCE"
            : null;

    if (!roleByActor || roleByActor !== payload.role) {
      return Response.json(
        { error: "ไม่มีสิทธิ์ปรับสถานะความครบถ้วนของบทบาทนี้" },
        { status: 403 },
      );
    }

    const actorUser = await ensureMockActor(payload.actorUserId);
    if (!actorUser) {
      return Response.json(
        { error: "ไม่พบผู้ใช้สำหรับบันทึกความครบถ้วน" },
        { status: 400 },
      );
    }

    const result = await statusService.setRoleCompletion(
      id,
      payload.role,
      payload.isComplete,
      actorUser.id,
      payload.notes,
    );

    if (!result.success) {
      return Response.json({ error: result.error }, { status: 400 });
    }

    // ครบ 3 ฝ่าย → แจ้งงานคลังให้ปิดโครงการ
    await statusService.notifyOnClosureProgress(id);

    return successResponse({
      success: true,
      progress: result.progress,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
