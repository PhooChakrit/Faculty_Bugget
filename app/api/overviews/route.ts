import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, handleApiError } from "@/lib/api-response";
import { listOverviewsQuerySchema } from "./schema";
import { Prisma, ProjectStatus } from "@/app/generated/prisma/client";
import { actorRoles, mockActorByRole, type ActorRole } from "@/lib/mock-actors";
import { formatStatusDisplay } from "@/lib/status-constants";

const INTERNAL_REVIEW_CHECKED_NOTE = "INTERNAL_REVIEW_CHECKED";
const SCIENCE_DEPARTMENT_CODE = "sci";
const SCIENCE_DEPARTMENT_LABEL = "ภาควิชาวิทยาศาสตร์";

// Typed project payload used in this route
type ProjectWithRelations = Prisma.ProjectGetPayload<{
  include: {
    meetings: true;
    leader: { select: { id: true; name: true; email: true } };
    coLeader: { select: { id: true; name: true; email: true } };
    currentStatus: {
      include: {
        notifications: true;
        actionLogs: {
          include: {
            actorUser: { select: { id: true; name: true; email: true } };
          };
        };
      };
    };
    roleCompletions: true;
    budgetRevisions: {
      include: {
        actionLogs: {
          orderBy: { createdAt: "desc" };
          take: 1;
        };
      };
    };
  };
}>;

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

function formatDateInput(date: Date | null | undefined): string {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

function toDisplayStatus(statusCode: string | null | undefined): string {
  return formatStatusDisplay(statusCode);
}

function getStatusGroup(
  statusCode: string | null | undefined,
):
  | "DRAFT"
  | "DEPT_HEAD"
  | "RESEARCH_REVIEW"
  | "WAITING_MEETING"
  | "WAITING_UNIT_DATA"
  | "ACTIVE"
  | "CLOSED"
  | "OTHER" {
  if (statusCode === "DRAFT" || statusCode === "RECALL") return "DRAFT";
  if (statusCode === "STATUS_0") return "DEPT_HEAD";
  if (statusCode === "STATUS_1" || statusCode === "STATUS_2") {
    return "RESEARCH_REVIEW";
  }
  if (statusCode === "STATUS_3") return "WAITING_MEETING";
  if (statusCode === "STATUS_4" || statusCode === "STATUS_5") {
    return "WAITING_UNIT_DATA";
  }
  if (statusCode === "STATUS_6" || statusCode === "STATUS_7") return "ACTIVE";
  if (statusCode === "STATUS_8" || statusCode === "STATUS_13") return "CLOSED";
  return "OTHER";
}

function getRouteType(
  statusCode: string | null | undefined,
): "BOARD" | "DEAN" | "NONE" {
  if (statusCode === "STATUS_4" || statusCode === "STATUS_6") return "BOARD";
  if (statusCode === "STATUS_5" || statusCode === "STATUS_7") return "DEAN";
  return "NONE";
}

function getNextWorkInfo({
  statusCode,
  hasVendor,
  hasCostCenter,
  hasDeanApproval,
  hasDocLink,
  researchComplete,
  physicalComplete,
  financeComplete,
  hasPhysicalData,
  hasActiveBudgetRevision,
}: {
  statusCode: string | null | undefined;
  hasVendor: boolean;
  hasCostCenter: boolean;
  hasDeanApproval: boolean;
  hasDocLink: boolean;
  researchComplete: boolean;
  physicalComplete: boolean;
  financeComplete: boolean;
  hasPhysicalData: boolean;
  hasActiveBudgetRevision: boolean;
}): { label: string; needsActionBy: ActorRole[] } {
  if (statusCode === "DRAFT" || statusCode === "RECALL") {
    return {
      label: "รอเจ้าของโครงการแก้ไขและยื่นเสนอ",
      needsActionBy: ["USER"],
    };
  }
  if (statusCode === "STATUS_0") {
    return {
      label: "รอหัวหน้าภาควิชาอนุมัติ",
      needsActionBy: ["ภาควิชาวิทยาศาสตร์"],
    };
  }
  if (statusCode === "STATUS_1") {
    return {
      label: "รอฝ่ายวิจัยตรวจสอบข้อมูล",
      needsActionBy: ["งานวิจัย"],
    };
  }
  if (statusCode === "STATUS_2") {
    return {
      label: "รอหัวหน้าฝ่ายวิจัยพิจารณา",
      needsActionBy: ["หัวหน้าฝ่ายวิจัย"],
    };
  }
  if (statusCode === "STATUS_3") {
    return {
      label: "รอฝ่ายวิจัยบันทึกมติ",
      needsActionBy: ["งานวิจัย"],
    };
  }
  if (statusCode === "STATUS_4" || statusCode === "STATUS_5") {
    const missing: string[] = [];
    const roles: ActorRole[] = [];
    if (!hasVendor) {
      missing.push("รอรหัสเจ้าหนี้จากงานคลัง");
      roles.push("งานคลัง");
    }
    if (!hasCostCenter) {
      missing.push("รอศูนย์ต้นทุนจากงานแผน");
      roles.push("งานแผน");
    }
    if (statusCode === "STATUS_5" && !hasDeanApproval) {
      missing.push("รอเอกสารอนุมัติคณบดีจากฝ่ายวิจัย");
      roles.push("งานวิจัย");
    }
    if (missing.length > 0) {
      return { label: missing.join(" · "), needsActionBy: [...new Set(roles)] };
    }
    return {
      label: "รอฝ่ายวิจัยอนุมัติให้ดำเนินโครงการ",
      needsActionBy: ["งานวิจัย"],
    };
  }
  if (statusCode === "STATUS_6" || statusCode === "STATUS_7") {
    if (hasActiveBudgetRevision) {
      return {
        label: "มีคำขอแก้ไขงบประมาณ",
        needsActionBy: ["งานวิจัย"],
      };
    }

    const missing: string[] = [];
    const roles: ActorRole[] = [];
    if (!hasDocLink) {
      missing.push("รอรายงานผลจากเจ้าของโครงการ");
      roles.push("USER");
    }
    if (!researchComplete) {
      missing.push("ฝ่ายวิจัยยังไม่บันทึก");
      roles.push("งานวิจัย");
    }
    if (hasPhysicalData && !physicalComplete) {
      missing.push("งานกายภาพยังไม่บันทึก");
      roles.push("กายภาพ");
    }
    if (!financeComplete) {
      missing.push("งานคลังยังไม่ยืนยัน");
      roles.push("งานคลัง");
    }
    if (missing.length > 0) {
      return { label: missing.join(" · "), needsActionBy: [...new Set(roles)] };
    }
    return { label: "พร้อมให้งานคลังปิดโครงการ", needsActionBy: ["งานคลัง"] };
  }
  if (statusCode === "STATUS_8" || statusCode === "STATUS_13") {
    return { label: "ปิดโครงการแล้ว", needsActionBy: [] };
  }

  return { label: "ตรวจสอบสถานะโครงการ", needsActionBy: [] };
}

function buildRolePriority(
  statusCode: string | null | undefined,
  needsActionBy: ActorRole[],
  activeBudgetRevisionStatus: string | null | undefined,
): Record<ActorRole, number> {
  const priorities = actorRoles.reduce(
    (acc, role) => {
      acc[role] = needsActionBy.includes(role) ? 0 : 3;
      return acc;
    },
    {} as Record<ActorRole, number>,
  );

  if (statusCode === "DRAFT" || statusCode === "RECALL") priorities.USER = 0;
  if (statusCode === "STATUS_1" || statusCode === "STATUS_3") {
    priorities["งานวิจัย"] = 0;
  }
  if (statusCode === "STATUS_2") priorities["หัวหน้าฝ่ายวิจัย"] = 0;
  if (statusCode === "STATUS_4" || statusCode === "STATUS_5") {
    priorities["งานวิจัย"] = Math.min(priorities["งานวิจัย"], 1);
  }
  if (statusCode === "STATUS_6" || statusCode === "STATUS_7") {
    priorities.USER = Math.min(priorities.USER, 1);
  }

  if (activeBudgetRevisionStatus) {
    if (activeBudgetRevisionStatus === "BR_SUBMITTED") {
      priorities["งานวิจัย"] = 0;
    } else if (activeBudgetRevisionStatus === "BR_RESEARCH_CHECKED") {
      priorities["หัวหน้าฝ่ายวิจัย"] = 0;
    } else if (
      activeBudgetRevisionStatus === "BR_WAITING_MEETING" ||
      activeBudgetRevisionStatus === "BR_BOARD_APPROVED" ||
      activeBudgetRevisionStatus === "BR_DEAN_APPROVED"
    ) {
      priorities["งานวิจัย"] = 0;
    } else if (activeBudgetRevisionStatus === "BR_DRAFT") {
      priorities.USER = 0;
    }
  }

  return priorities;
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
          currentStatus: {
            include: {
              notifications: true,
              actionLogs: {
                orderBy: { createdAt: "desc" },
                include: {
                  actorUser: {
                    select: { id: true, name: true, email: true },
                  },
                },
              },
            },
          },
          roleCompletions: true,
          budgetRevisions: {
            where: {
              status: {
                notIn: ["BR_APPLIED", "BR_REJECTED", "BR_CANCELLED"],
              },
            },
            orderBy: { createdAt: "desc" },
            take: 1,
            include: {
              actionLogs: {
                orderBy: { createdAt: "desc" },
                take: 1,
              },
            },
          },
        },
      }),
      prisma.project.count({ where }),
    ]);

    const departments = Array.from(
      new Set(projects.map((project) => project.department).filter(Boolean)),
    );
    const departmentAssignments =
      departments.length > 0
        ? await prisma.departmentHeadAssignment.findMany({
            where: { department: { in: departments } },
            include: {
              headUser: { select: { id: true, name: true, email: true } },
            },
          })
        : [];
    const assignmentByDepartment = new Map(
      departmentAssignments.map((assignment) => [
        assignment.department,
        assignment,
      ]),
    );

    // Transform projects to overview format
    const overviewData = projects.map((project: ProjectWithRelations) => {
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
      const researchCompletion = project.roleCompletions.find(
        (row) => row.role === "RESEARCH",
      );
      const physicalCompletion = project.roleCompletions.find(
        (row) => row.role === "PHYSICAL",
      );
      const financeCompletion = project.roleCompletions.find(
        (row) => row.role === "FINANCE",
      );
      const activeBudgetRevision = project.budgetRevisions[0] ?? null;
      const latestInternalReviewAction = project.currentStatus?.actionLogs.find(
        (log) => log.actionType === INTERNAL_REVIEW_CHECKED_NOTE,
      );
      const departmentHeadAssignment = assignmentByDepartment.get(
        project.department,
      );
      const scienceDepartmentHead =
        project.department === SCIENCE_DEPARTMENT_CODE
          ? mockActorByRole[SCIENCE_DEPARTMENT_LABEL]
          : null;
      const departmentHeadUserId =
        departmentHeadAssignment?.headUserId ?? scienceDepartmentHead?.id ?? "";
      const departmentHeadName =
        departmentHeadAssignment?.headUser.name ??
        scienceDepartmentHead?.name ??
        "";

      const releaseChecklist = {
        hasProjectCode:
          Boolean(project.projectCode?.trim()) ||
          project.currentStatusCode === "STATUS_4" ||
          project.currentStatusCode === "STATUS_5",
        hasVendor: Boolean(project.vendorCode?.trim()),
        hasCostCenter: Boolean(
          project.costCenter?.trim() || project.costCenterFileName?.trim(),
        ),
        hasDeanApproval:
          project.currentStatusCode !== "STATUS_5" ||
          Boolean(project.docLink?.trim()),
      };
      const canReleaseProject =
        releaseChecklist.hasProjectCode &&
        releaseChecklist.hasVendor &&
        releaseChecklist.hasCostCenter &&
        releaseChecklist.hasDeanApproval;
      // เจ้าของอัปโหลดไฟล์รายงานแล้วปิดได้เลย (ไม่ต้องรอ 3 ฝ่ายยืนยัน)
      const canCloseProject = Boolean(
        project.reportFileName?.trim() || project.docLink?.trim(),
      );
      const hasPhysicalData =
        Boolean(project.maintenanceFeeActual) ||
        Boolean(project.electricityFeeActual) ||
        Boolean(project.maintenanceFeeActualFileName) ||
        Boolean(project.electricityFeeActualFileName);
      const nextWork = getNextWorkInfo({
        statusCode: project.currentStatusCode,
        hasVendor: releaseChecklist.hasVendor,
        hasCostCenter: releaseChecklist.hasCostCenter,
        hasDeanApproval: releaseChecklist.hasDeanApproval,
        hasDocLink: Boolean(project.docLink?.trim()),
        researchComplete: !!researchCompletion?.isComplete,
        physicalComplete: !!physicalCompletion?.isComplete,
        financeComplete: !!financeCompletion?.isComplete,
        hasPhysicalData,
        hasActiveBudgetRevision: Boolean(activeBudgetRevision),
      });
      const rolePriority = buildRolePriority(
        project.currentStatusCode,
        nextWork.needsActionBy,
        activeBudgetRevision?.status,
      );
      const routeType = getRouteType(project.currentStatusCode);

      return {
        id: project.id,
        createdAt: project.createdAt.toISOString(),
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
        _projectStatus:
          toDisplayStatus(project.currentStatusCode) || project.status1 || "",
        _meetings: project.meetings.map((m) => ({
          id: m.id,
          type: m.type,
          no: m.no,
          date: formatDateInput(m.date),
          purpose: m.purpose || "",
          decisionStatusCode: m.decisionStatusCode || null,
        })),
        _meetingSummary: {
          board: boardMeeting
            ? {
                id: boardMeeting.id,
                no: boardMeeting.no,
                date: formatThaiDate(boardMeeting.date),
                purpose: boardMeeting.purpose || "",
              }
            : null,
          dean: deanMeeting
            ? {
                id: deanMeeting.id,
                no: deanMeeting.no,
                date: formatThaiDate(deanMeeting.date),
                purpose: deanMeeting.purpose || "",
                approvalLink: project.docLink || "",
              }
            : null,
        },
        _costCenter: project.costCenter || "",
        _costCenterFileName: project.costCenterFileName || "",
        _costCenterFileType: project.costCenterFileType || "",
        _costCenterUploadedAt: project.costCenterUploadedAt
          ? formatThaiDate(project.costCenterUploadedAt)
          : "",
        _costCenterDownloadUrl: project.costCenterFileName
          ? `/api/overviews/${project.id}/cost-center-file`
          : "",
        _maintenanceFee: formatDecimal(project.maintenanceFeeActual),
        _maintenanceFeeFileName: project.maintenanceFeeActualFileName || "",
        _maintenanceFeeFileType: project.maintenanceFeeActualFileType || "",
        _maintenanceFeeUploadedAt: project.maintenanceFeeActualUploadedAt
          ? formatThaiDate(project.maintenanceFeeActualUploadedAt)
          : "",
        _maintenanceFeeDownloadUrl: project.maintenanceFeeActualFileName
          ? `/api/overviews/${project.id}/physical-fee-file?kind=maintenance`
          : "",
        _electricityFeeActual: formatDecimal(project.electricityFeeActual),
        _electricityFeeActualFileName:
          project.electricityFeeActualFileName || "",
        _electricityFeeActualFileType:
          project.electricityFeeActualFileType || "",
        _electricityFeeActualUploadedAt:
          project.electricityFeeActualUploadedAt
            ? formatThaiDate(project.electricityFeeActualUploadedAt)
            : "",
        _electricityFeeActualDownloadUrl: project.electricityFeeActualFileName
          ? `/api/overviews/${project.id}/physical-fee-file?kind=electricity`
          : "",
        _researchComplete: !!researchCompletion?.isComplete,
        _physicalComplete: !!physicalCompletion?.isComplete,
        _closureCompleteFinance: !!financeCompletion?.isComplete,
        _canReleaseProject: canReleaseProject,
        _canCloseProject: canCloseProject,
        _releaseChecklist: releaseChecklist,
        _currentStatusCode: project.currentStatusCode,
        _statusGroup: getStatusGroup(project.currentStatusCode),
        _routeType: routeType,
        _nextWorkLabel: nextWork.label,
        _needsActionBy: nextWork.needsActionBy,
        _rolePriority: rolePriority,
        _activeBudgetRevision: activeBudgetRevision
          ? {
              id: activeBudgetRevision.id,
              status: activeBudgetRevision.status,
              reason: activeBudgetRevision.reason,
              closeAfterApproval: activeBudgetRevision.closeAfterApproval,
              meetingNo: activeBudgetRevision.meetingNo,
              meetingDate: activeBudgetRevision.meetingDate
                ? formatThaiDate(activeBudgetRevision.meetingDate)
                : "",
              meetingNote: activeBudgetRevision.meetingNote,
              approvalRoute: activeBudgetRevision.approvalRoute,
              affectsCostCenter: activeBudgetRevision.affectsCostCenter,
              affectsVendor: activeBudgetRevision.affectsVendor,
              deanApprovalFileUrl: activeBudgetRevision.deanApprovalFileUrl,
              latestAction: activeBudgetRevision.actionLogs[0] ?? null,
            }
          : null,
        _internalReviewChecked:
          project.currentStatusCode === "STATUS_1" &&
          !!project.currentStatus?.notes?.includes(
            INTERNAL_REVIEW_CHECKED_NOTE,
          ),
        _latestInternalReviewAction: latestInternalReviewAction
          ? {
              actorRole: latestInternalReviewAction.actorRole,
              actorName: latestInternalReviewAction.actorUser.name,
              createdAt: formatThaiDate(latestInternalReviewAction.createdAt),
            }
          : null,
        _departmentHeadUserId: departmentHeadUserId,
        _departmentHeadName: departmentHeadName,
        _draftState: project.draftState,

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
