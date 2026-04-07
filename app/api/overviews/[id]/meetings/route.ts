import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, handleApiError } from "@/lib/api-response";
import { updateMeetingsSchema } from "../../schema";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

// PATCH /api/overviews/[id]/meetings - Update project meetings
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { meetings } = updateMeetingsSchema.parse(body);

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id },
      include: { meetings: true },
    });

    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    // Use a transaction to update meetings atomically
    const result = await prisma.$transaction(async (tx) => {
      // Delete all existing meetings
      await tx.meeting.deleteMany({
        where: { projectId: id },
      });

      // Create new meetings
      if (meetings.length > 0) {
        await tx.meeting.createMany({
          data: meetings.map((m) => ({
            projectId: id,
            type: m.type,
            no: m.no,
            date: new Date(m.date),
            purpose: m.purpose || null,
          })),
        });
      }

      // Fetch updated project with meetings
      const updatedProject = await tx.project.findUnique({
        where: { id },
        include: {
          meetings: {
            orderBy: { date: "asc" },
          },
        },
      });

      return updatedProject;
    });

    return successResponse({
      success: true,
      project: result,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
