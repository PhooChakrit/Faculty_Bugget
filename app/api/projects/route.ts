import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, handleApiError } from "@/lib/api-response";
import {
  createProjectSchema,
  listProjectsQuerySchema,
  CreateProjectInput,
} from "./schema";

// GET /api/projects - List all projects
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = listProjectsQuerySchema.parse({
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 10,
      status: searchParams.get("status") || undefined,
      search: searchParams.get("search") || undefined,
    });

    const { page, limit, status, search } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where = {
      ...(status && { status }),
      ...(search && {
        OR: [
          {
            projectNameThai: { contains: search, mode: "insensitive" as const },
          },
          {
            projectNameEng: { contains: search, mode: "insensitive" as const },
          },
          { receiptNumber: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    };

    // Execute queries in parallel
    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          leader: { select: { id: true, name: true, email: true } },
          coLeader: { select: { id: true, name: true, email: true } },
          targetGroups: { include: { targetGroup: true } },
          strategies: { include: { strategy: true } },
          incomeItems: true,
          _count: {
            select: { collaborators: true, managers: true },
          },
        },
      }),
      prisma.project.count({ where }),
    ]);

    return successResponse({
      projects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createProjectSchema.parse(body) as CreateProjectInput;

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

    const project = await prisma.$transaction(
      async (tx) => {
        const id = crypto.randomUUID();

        return tx.project.create({
          data: {
            id,
            ...projectData,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            currentStatusCode: "DRAFT",
            status1: "DRAFT. แบบร่างโครงการ",
            draftState: "DRAFT",
            draftSavedAt: new Date(),
            // Create target group relations
            ...(targetGroupIds &&
              targetGroupIds.length > 0 && {
                targetGroups: {
                  create: targetGroupIds.map((targetGroupId) => ({
                    targetGroup: { connect: { id: targetGroupId } },
                  })),
                },
              }),
            // Create strategy relations
            ...(strategyIds &&
              strategyIds.length > 0 && {
                strategies: {
                  create: strategyIds.map((strategyId) => ({
                    strategy: { connect: { id: strategyId } },
                  })),
                },
              }),
            // Create income items
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
            // Create collaborators
            ...(collaborators &&
              collaborators.length > 0 && {
                collaborators: {
                  create: collaborators.map((c) => ({
                    name: c.name,
                  })),
                },
              }),
            // Create managers
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
      { isolationLevel: "Serializable" },
    );

    return successResponse(project, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
