import { NextRequest } from "next/server";
import {
  Prisma,
  ProjectStatus,
  StatusCode,
} from "@/app/generated/prisma/client";
import prisma from "@/lib/prisma";
import { successResponse, handleApiError } from "@/lib/api-response";
import {
  createProjectSchema,
  createDraftProjectSchema,
  listProjectsQuerySchema,
  CreateProjectInput,
} from "./schema";

const DEV_LEADER_USER_ID = "cmlfoz51o0000voxek4yjqxhg";
const DEV_LEADER_EMAIL = "dev-leader@faculty.local";
const DEV_LEADER_NAME = "หัวหน้าโครงการ (dev seed)";

// GET /api/projects - List all projects
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = listProjectsQuerySchema.parse({
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 10,
      status: searchParams.get("status") || undefined,
      search: searchParams.get("search") || undefined,
      leaderId: searchParams.get("leaderId") || undefined,
      actorRole: searchParams.get("actorRole") || "USER",
    });

    const { page, limit, status, search, leaderId, actorRole } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.ProjectWhereInput = {
      ...(status && { status }),
      ...(leaderId && { leaderId }),
      ...(actorRole === "งานวิจัย" && {
        currentStatusCode: {
          notIn: ["DRAFT", "STATUS_0"],
        },
      }),
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

// POST /api/projects - Create a new project (or empty draft when body.draft is true)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body && typeof body === "object" && body.draft === true) {
      const { leaderId } = createDraftProjectSchema.parse(body);
      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);

      const project = await prisma.$transaction(
        async (tx) => {
          const requestedLeader = await tx.user.findUnique({
            where: { id: leaderId },
            select: { id: true },
          });

          const fallbackLeader =
            requestedLeader ??
            (await tx.user.findFirst({
              orderBy: { createdAt: "asc" },
              select: { id: true },
            })) ??
            (await tx.user.upsert({
              where: { id: DEV_LEADER_USER_ID },
              update: {},
              create: {
                id: DEV_LEADER_USER_ID,
                email: DEV_LEADER_EMAIL,
                name: DEV_LEADER_NAME,
              },
              select: { id: true },
            }));

          const id = crypto.randomUUID();
          return tx.project.create({
            data: {
              id,
              leaderId: fallbackLeader.id,
              status: ProjectStatus.DRAFT,
              currentStatusCode: StatusCode.DRAFT,
              status1: "DRAFT. แบบร่างโครงการ",
              draftState: "DRAFT",
              draftSavedAt: new Date(),
              projectNameThai: "(แบบร่าง)",
              leaderPosition: "-",
              department: "-",
              startDate,
              endDate,
              venue: "-",
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
    }

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
            currentStatusCode: StatusCode.DRAFT,
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
