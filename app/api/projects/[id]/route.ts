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
import { formatStatusDisplay } from "@/lib/status-constants";

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
        meetings: { orderBy: { date: "asc" } },
        roleCompletions: true,
        currentStatus: {
          include: {
            actionLogs: {
              orderBy: { createdAt: "desc" },
              take: 5,
              include: {
                actorUser: { select: { id: true, name: true, email: true } },
              },
            },
          },
        },
        budgetRevisions: {
          where: {
            status: {
              notIn: ["BR_APPLIED", "BR_REJECTED", "BR_CANCELLED"],
            },
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
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
      leaderId,
      coLeaderId,
      ...projectData
    } = data;

    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id },
    });

    if (!existingProject) {
      return errorResponse("Project not found", 404);
    }

    if (existingProject.currentStatusCode === "STATUS_10") {
      return errorResponse("Project has ended and cannot be edited", 409);
    }

    if (
      projectData.currentStatusCode &&
      projectData.currentStatusCode !== existingProject.currentStatusCode
    ) {
      return errorResponse(
        "Workflow status must be changed through the status transition API",
        400,
      );
    }

    // Update project with transaction for relations
    const project = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const updateData: Prisma.ProjectUpdateInput = {
          ...projectData,
          ...(startDate && { startDate: new Date(startDate) }),
          ...(endDate && { endDate: new Date(endDate) }),
        };

        if (typeof leaderId === "string") {
          const nextLeaderId = leaderId.trim();
          if (!nextLeaderId) {
            // Keep current leader when client sends empty string.
            updateData.leader = { connect: { id: existingProject.leaderId } };
          } else {
            const leaderExists = await tx.user.findUnique({
              where: { id: nextLeaderId },
              select: { id: true },
            });

            if (!leaderExists) {
              // Fall back to existing leader to avoid FK violation during draft autosave.
              updateData.leader = {
                connect: { id: existingProject.leaderId },
              };
            } else {
              updateData.leader = { connect: { id: nextLeaderId } };
            }
          }
        }

        if (typeof coLeaderId === "string") {
          const nextCoLeaderId = coLeaderId.trim();
          if (!nextCoLeaderId) {
            updateData.coLeader = { disconnect: true };
          } else {
            const coLeaderExists = await tx.user.findUnique({
              where: { id: nextCoLeaderId },
              select: { id: true },
            });

            updateData.coLeader = coLeaderExists
              ? { connect: { id: nextCoLeaderId } }
              : { disconnect: true };
          }
        }

        const validTargetGroupIds =
          targetGroupIds && targetGroupIds.length > 0
            ? (
                await tx.targetGroup.findMany({
                  where: { id: { in: targetGroupIds } },
                  select: { id: true },
                })
              ).map((row) => row.id)
            : [];

        const validStrategyIds =
          strategyIds && strategyIds.length > 0
            ? (
                await tx.strategy.findMany({
                  where: { id: { in: strategyIds } },
                  select: { id: true },
                })
              ).map((row) => row.id)
            : [];

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
        const derivedStatus1 = projectData.currentStatusCode
          ? formatStatusDisplay(projectData.currentStatusCode)
          : null;

        if (derivedStatus1) {
          updateData.status1 = derivedStatus1;
        }

        // Update project
        return tx.project.update({
          where: { id },
          data: {
            ...updateData,
            // Recreate target group relations
            ...(validTargetGroupIds.length > 0 && {
              targetGroups: {
                create: validTargetGroupIds.map((targetGroupId) => ({
                  targetGroup: { connect: { id: targetGroupId } },
                })),
              },
            }),
            // Recreate strategy relations
            ...(validStrategyIds.length > 0 && {
              strategies: {
                create: validStrategyIds.map((strategyId) => ({
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
