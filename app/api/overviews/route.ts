import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, handleApiError } from "@/lib/api-response";
import { listOverviewsQuerySchema } from "./schema";
import { Prisma, ProjectStatus } from "@/app/generated/prisma/client";

// Helper to format Decimal to string with 2 decimal places
function formatDecimal(
  value: { toFixed: (decimals: number) => string } | null | undefined,
): string {
  if (!value) return "0.00";
  return value.toFixed(2);
}

// Helper to format date to Thai format
function formatThaiDate(date: Date | null | undefined): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

// GET /api/overviews - List all projects in overview format
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = listOverviewsQuerySchema.parse({
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 100,
      department: searchParams.get("department") || undefined,
      search: searchParams.get("search") || undefined,
      status: searchParams.get("status") || undefined,
    });

    const { page, limit, department, search, status } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.ProjectWhereInput = {
      ...(department && department !== "all" && { department }),
      ...(status && { status: status as ProjectStatus }),
      ...(search && {
        OR: [
          { projectCode: { contains: search, mode: "insensitive" as const } },
          { memoTitle: { contains: search, mode: "insensitive" as const } },
          {
            projectNameThai: { contains: search, mode: "insensitive" as const },
          },
          { vendorCode: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    };

    // Execute query
    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          meetings: {
            orderBy: { date: "asc" },
          },
          leader: {
            select: { id: true, name: true, email: true },
          },
          coLeader: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      prisma.project.count({ where }),
    ]);

    // Transform projects to overview format
    const overviewData = projects.map((project) => {
      // Calculate total budget from expenses
      const totalBudget =
        (project.expenseRemuneration?.toNumber() || 0) +
        (project.expenseSupplies?.toNumber() || 0) +
        (project.expenseMaterials?.toNumber() || 0) +
        (project.expenseUtilities?.toNumber() || 0) +
        (project.expenseSubsidy?.toNumber() || 0) +
        (project.expenseReserve?.toNumber() || 0);

      // Find latest meeting for purpose
      const latestMeeting =
        project.meetings.length > 0
          ? project.meetings[project.meetings.length - 1]
          : null;

      // Find board and dean meetings
      const boardMeeting = project.meetings.find((m) => m.type === "BOARD");
      const deanMeeting = project.meetings.find((m) => m.type === "DEAN");

      return {
        id: project.id,
        receiptNumber: project.receiptNumber || "",
        projectCode: project.projectCode || "",
        memoTitle: project.memoTitle || project.projectNameThai,
        department: project.department,
        purpose: latestMeeting?.purpose || "-",

        // Meeting data
        boardMeetingNo: boardMeeting?.no || "",
        boardMeetingDate: boardMeeting ? formatThaiDate(boardMeeting.date) : "",
        deanDecisionNo: deanMeeting?.no || "",
        deanDecisionDate: deanMeeting ? formatThaiDate(deanMeeting.date) : "",

        // Budget fields (calculated)
        totalBudget: totalBudget.toFixed(2),
        compensation: formatDecimal(project.expenseRemuneration),
        operatingCost: formatDecimal(project.expenseSupplies),
        materialCost: formatDecimal(project.expenseMaterials),
        utilities: formatDecimal(project.expenseUtilities),
        academicFund: formatDecimal(project.expenseSubsidy),
        generalReserve: formatDecimal(project.expenseReserve),

        // Proposal vs Actual fees
        maintenanceFeeProposal: formatDecimal(project.maintenanceFeeProposal),
        electricityFeeProposal: formatDecimal(project.electricityFeeProposal),

        // Finance fields
        vendorCode: project.vendorCode || "",
        fundOwner: project.fundOwner || "",

        // Other fields
        projectHead: project.leader.name || "",
        startDate: formatThaiDate(project.startDate),
        endDate: formatThaiDate(project.endDate),
        serviceType: project.serviceType || "",
        participantCount: project.participantCount?.toString() || "",
        projectDescription: project.projectDetails || "",

        // Budget sources
        amountGovExternal: formatDecimal(project.budgetSourceExtGov),
        amountPrivateExternal: formatDecimal(project.budgetSourceExtPrivate),
        amountForeignExternal: formatDecimal(project.budgetSourceExtForeign),
        amountUnivRevenue: formatDecimal(project.budgetSourceInternal),

        // Status tracking
        status1: project.status1 || "",
        status1Date: project.status1Date
          ? formatThaiDate(project.status1Date)
          : "",
        status2: project.status2 || "",
        status2Date: project.status2Date
          ? formatThaiDate(project.status2Date)
          : "",
        status3: project.status3 || "",
        status3Date: project.status3Date
          ? formatThaiDate(project.status3Date)
          : "",
        status4: project.status4 || "",
        status4Date: project.status4Date
          ? formatThaiDate(project.status4Date)
          : "",
        status5: project.status5 || "",
        status5Date: project.status5Date
          ? formatThaiDate(project.status5Date)
          : "",
        responsible: project.responsible || "",
        docNumber: project.docNumber || "",
        docDate: project.docDate ? formatThaiDate(project.docDate) : "",
        docLink: project.docLink || "",

        // Enhanced fields for overview table
        _projectStatus: project.status1 || "",
        _meetings: project.meetings.map((m) => ({
          id: m.id,
          type: m.type,
          no: m.no,
          date: formatThaiDate(m.date),
          purpose: m.purpose || "",
        })),
        _costCenter: project.costCenter || "",
        _maintenanceFee: formatDecimal(project.maintenanceFeeActual),
        _electricityFeeActual: formatDecimal(project.electricityFeeActual),

        // Additional required fields (placeholders for now)
        strategyType: "",
        targetGroup: "",
      };
    });

    return successResponse({
      projects: overviewData,
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
