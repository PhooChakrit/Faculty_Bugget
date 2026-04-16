import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";
import {
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-response";
import {
  projectIdSchema,
  updateProjectSchema,
  UpdateProjectInput,
} from "../schema";
import { generateProjectId } from "@/lib/generate-project-id";

type RouteParams = {
  params: Promise<{ id: string }>;
};

// GET /api/projects/[id] - Get single project
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    projectIdSchema.parse({ id });

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        leader: { select: { id: true, name: true, email: true } },
        coLeader: { select: { id: true, name: true, email: true } },
        targetGroups: { include: { targetGroup: true } },
        strategies: { include: { strategy: true } },
        incomeItems: true,
        collaborators: true,
        managers: true,
      },
    });

    if (!project) {
      return errorResponse("Project not found", 404);
    }

    return successResponse(project);
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/projects/[id] - Update project
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    projectIdSchema.parse({ id });

    const body = await request.json();
    const data = updateProjectSchema.parse(body) as UpdateProjectInput;

    const {
      targetGroupIds,
      strategyIds,
      incomeItems,
      collaborators,
      managers,
      startDate,
      endDate,
      ...projectData
    } = data;

    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id },
    });

    if (!existingProject) {
      return errorResponse("Project not found", 404);
    }

    if (existingProject.currentStatusCode === "STATUS_13") {
      return errorResponse("Project is closed and cannot be edited", 409);
    }

    // Update project with transaction for relations
    const project = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        // Delete existing relations if new data provided
        if (targetGroupIds !== undefined) {
          await tx.projectTargetGroup.deleteMany({ where: { projectId: id } });
        }
        if (strategyIds !== undefined) {
          await tx.projectStrategy.deleteMany({ where: { projectId: id } });
        }
        if (incomeItems !== undefined) {
          await tx.incomeItem.deleteMany({ where: { projectId: id } });
        }
        if (collaborators !== undefined) {
          await tx.projectCollaborator.deleteMany({ where: { projectId: id } });
        }
        if (managers !== undefined) {
          await tx.projectManager.deleteMany({ where: { projectId: id } });
        }

        // Sync status1 display string when currentStatusCode is explicitly set
        const statusCodeToStatus1: Record<string, string> = {
          DRAFT: "DRAFT. แบบร่างโครงการ",
          STATUS_0: "0. แบบร่างโครงการ (รอดำเนินการ)",
          STATUS_1:
            "1. งานบริหารวิจัยและบริการวิชาการ รอดำเนินการตรวจสอบ/แก้ไข",
          STATUS_2:
            "2. งานบริหารวิจัยและบริการวิชาการ ตรวจสอบ/แก้ไข เรียบร้อยแล้ว",
          RECALL: "RECALL. ดึงกลับเอกสาร",
        };
        const derivedStatus1 = projectData.currentStatusCode
          ? (statusCodeToStatus1[projectData.currentStatusCode] ?? null)
          : null;

        // Assign projectCode = id when first transitioning to STATUS_1
        const needsProjectCode =
          projectData.currentStatusCode === "STATUS_1" &&
          !existingProject.projectCode;
        const newProjectCode = needsProjectCode ? id : null;

        // Update project
        return tx.project.update({
          where: { id },
          data: {
            ...projectData,
            ...(derivedStatus1 && { status1: derivedStatus1 }),
            ...(newProjectCode && { projectCode: newProjectCode }),
            ...(startDate && { startDate: new Date(startDate) }),
            ...(endDate && { endDate: new Date(endDate) }),
            // Recreate target group relations
            ...(targetGroupIds &&
              targetGroupIds.length > 0 && {
                targetGroups: {
                  create: targetGroupIds.map((targetGroupId) => ({
                    targetGroup: { connect: { id: targetGroupId } },
                  })),
                },
              }),
            // Recreate strategy relations
            ...(strategyIds &&
              strategyIds.length > 0 && {
                strategies: {
                  create: strategyIds.map((strategyId) => ({
                    strategy: { connect: { id: strategyId } },
                  })),
                },
              }),
            // Recreate income items
            ...(incomeItems &&
              incomeItems.length > 0 && {
                incomeItems: {
                  create: incomeItems.map((item) => ({
                    type: item.type,
                    name: item.name,
                    amount: item.amount,
                    categoryName: item.categoryName,
                  })),
                },
              }),
            // Recreate collaborators
            ...(collaborators &&
              collaborators.length > 0 && {
                collaborators: {
                  create: collaborators.map((c) => ({
                    name: c.name,
                  })),
                },
              }),
            // Recreate managers
            ...(managers &&
              managers.length > 0 && {
                managers: {
                  create: managers.map((m) => ({
                    name: m.name,
                    position: m.position,
                  })),
                },
              }),
          },
          include: {
            leader: { select: { id: true, name: true, email: true } },
            coLeader: { select: { id: true, name: true, email: true } },
            targetGroups: { include: { targetGroup: true } },
            strategies: { include: { strategy: true } },
            incomeItems: true,
            collaborators: true,
            managers: true,
          },
        });
      },
    );

    return successResponse(project);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/projects/[id] - Delete project
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    projectIdSchema.parse({ id });

    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id },
    });

    if (!existingProject) {
      return errorResponse("Project not found", 404);
    }

    // Delete project (cascade will handle relations)
    await prisma.project.delete({
      where: { id },
    });

    return successResponse({ message: "Project deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
