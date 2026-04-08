import { NextRequest } from "next/server";
import { z } from "zod";
import { successResponse, handleApiError } from "@/lib/api-response";
import { statusService } from "@/lib/status-service";

const completionSchema = z.object({
  role: z.enum(["RESEARCH", "PHYSICAL"]),
  isComplete: z.boolean(),
  notes: z.string().optional(),
  actorRole: z.enum(["ภาควิชา", "งานวิจัย", "งานแผน", "งานคลัง", "กายภาพ"]),
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
          : null;

    if (!roleByActor || roleByActor !== payload.role) {
      return Response.json(
        { error: "ไม่มีสิทธิ์ปรับสถานะความครบถ้วนของบทบาทนี้" },
        { status: 403 },
      );
    }

    const result = await statusService.setRoleCompletion(
      id,
      payload.role,
      payload.isComplete,
      payload.actorUserId,
      payload.notes,
    );

    if (!result.success) {
      return Response.json({ error: result.error }, { status: 400 });
    }

    return successResponse({
      success: true,
      progress: result.progress,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
