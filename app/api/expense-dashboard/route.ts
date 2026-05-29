import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import {
  errorResponse,
  handleApiError,
  successResponse,
} from "@/lib/api-response";
import { formatStatusDisplay } from "@/lib/status-constants";

const APPROVED_STATUS_CODES = ["STATUS_6", "STATUS_7", "STATUS_8"] as const;
const STATUS_FILTERS = new Set<string>(APPROVED_STATUS_CODES);

const expenseCategories = [
  { key: "expenseRemuneration", label: "หมวดค่าตอบแทน" },
  { key: "expenseSupplies", label: "หมวดค่าใช้สอย" },
  { key: "expenseMaterials", label: "หมวดค่าวัสดุ" },
  { key: "expenseUtilities", label: "หมวดค่าสาธารณูปโภค" },
  { key: "expenseSubsidy", label: "หมวดเงินอุดหนุน" },
  { key: "expenseReserve", label: "หมวดเงินสำรอง" },
] as const;

type ExpenseCategoryKey = (typeof expenseCategories)[number]["key"];

function decimalToNumber(
  value: { toNumber: () => number } | number | null | undefined,
) {
  if (typeof value === "number") return value;
  return value?.toNumber() ?? 0;
}

function getThaiFiscalYear(date: Date) {
  return date.getMonth() >= 9
    ? date.getFullYear() + 544
    : date.getFullYear() + 543;
}

function getFiscalYearRange(fiscalYear: number) {
  return {
    start: new Date(fiscalYear - 544, 9, 1),
    end: new Date(fiscalYear - 543, 9, 1),
  };
}

// GET /api/expense-dashboard - approved project expense dashboard
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const department = searchParams.get("department")?.trim() || "all";
    const status = searchParams.get("status")?.trim() || "APPROVED";
    const fiscalYear = searchParams.get("fiscalYear")?.trim() || "all";

    if (status !== "APPROVED" && !STATUS_FILTERS.has(status)) {
      return errorResponse("Invalid status filter", 400);
    }

    const fiscalYearNumber =
      fiscalYear !== "all" ? Number.parseInt(fiscalYear, 10) : null;
    if (
      fiscalYear !== "all" &&
      (!fiscalYearNumber || fiscalYearNumber < 2400 || fiscalYearNumber > 2700)
    ) {
      return errorResponse("Invalid fiscal year filter", 400);
    }

    const statusCodes =
      status === "APPROVED" ? [...APPROVED_STATUS_CODES] : [status];
    const fiscalYearRange = fiscalYearNumber
      ? getFiscalYearRange(fiscalYearNumber)
      : null;

    const where = {
      currentStatusCode: { in: statusCodes },
      ...(department !== "all" ? { department } : {}),
      ...(fiscalYearRange
        ? {
            startDate: {
              gte: fiscalYearRange.start,
              lt: fiscalYearRange.end,
            },
          }
        : {}),
    };

    const [projects, allApprovedDepartments, allApprovedFiscalYears] =
      await Promise.all([
        prisma.project.findMany({
          where,
          orderBy: [{ department: "asc" }, { projectNameThai: "asc" }],
          select: {
            id: true,
            projectCode: true,
            projectNameThai: true,
            memoTitle: true,
            department: true,
            startDate: true,
            currentStatusCode: true,
            expenseRemuneration: true,
            expenseSupplies: true,
            expenseMaterials: true,
            expenseUtilities: true,
            expenseSubsidy: true,
            expenseReserve: true,
          },
        }),
        prisma.project.findMany({
          where: { currentStatusCode: { in: [...APPROVED_STATUS_CODES] } },
          distinct: ["department"],
          orderBy: { department: "asc" },
          select: { department: true },
        }),
        prisma.project.findMany({
          where: { currentStatusCode: { in: [...APPROVED_STATUS_CODES] } },
          orderBy: { startDate: "desc" },
          select: { startDate: true },
        }),
      ]);

    const categoryTotals = expenseCategories.map((category) => ({
      key: category.key,
      label: category.label,
      total: projects.reduce(
        (sum, project) =>
          sum + decimalToNumber(project[category.key as ExpenseCategoryKey]),
        0,
      ),
    }));
    const totalExpense = categoryTotals.reduce(
      (sum, category) => sum + category.total,
      0,
    );
    const topCategory =
      categoryTotals.length > 0
        ? categoryTotals.reduce((top, category) =>
            category.total > top.total ? category : top,
          )
        : null;

    const departmentMap = new Map<
      string,
      { department: string; projectCount: number; totalExpense: number }
    >();
    const fiscalYearMap = new Map<
      number,
      { fiscalYear: number; projectCount: number; totalExpense: number }
    >();
    const projectRows = projects.map((project) => {
      const total = expenseCategories.reduce(
        (sum, category) =>
          sum + decimalToNumber(project[category.key as ExpenseCategoryKey]),
        0,
      );
      const departmentSummary = departmentMap.get(project.department) ?? {
        department: project.department,
        projectCount: 0,
        totalExpense: 0,
      };
      departmentSummary.projectCount += 1;
      departmentSummary.totalExpense += total;
      departmentMap.set(project.department, departmentSummary);
      const projectFiscalYear = getThaiFiscalYear(project.startDate);
      const fiscalYearSummary = fiscalYearMap.get(projectFiscalYear) ?? {
        fiscalYear: projectFiscalYear,
        projectCount: 0,
        totalExpense: 0,
      };
      fiscalYearSummary.projectCount += 1;
      fiscalYearSummary.totalExpense += total;
      fiscalYearMap.set(projectFiscalYear, fiscalYearSummary);

      return {
        id: project.id,
        projectCode: project.projectCode ?? "",
        projectName: project.memoTitle || project.projectNameThai,
        department: project.department,
        fiscalYear: projectFiscalYear,
        statusCode: project.currentStatusCode,
        statusLabel: formatStatusDisplay(project.currentStatusCode),
        totalExpense: total,
      };
    });

    const categories = categoryTotals.map((category) => ({
      ...category,
      percent:
        totalExpense > 0
          ? Number(((category.total / totalExpense) * 100).toFixed(2))
          : 0,
    }));

    return successResponse({
      summary: {
        projectCount: projects.length,
        totalExpense,
        averageExpense: projects.length > 0 ? totalExpense / projects.length : 0,
        topCategory: topCategory
          ? {
              key: topCategory.key,
              label: topCategory.label,
              total: topCategory.total,
            }
          : null,
      },
      categories,
      departments: Array.from(departmentMap.values()).sort(
        (a, b) => b.totalExpense - a.totalExpense,
      ),
      fiscalYears: Array.from(fiscalYearMap.values()).sort(
        (a, b) => b.fiscalYear - a.fiscalYear,
      ),
      projects: projectRows.sort((a, b) => b.totalExpense - a.totalExpense),
      filters: {
        departments: allApprovedDepartments
          .map((item) => item.department)
          .filter(Boolean),
        fiscalYears: Array.from(
          new Set(
            allApprovedFiscalYears.map((project) =>
              getThaiFiscalYear(project.startDate),
            ),
          ),
        )
          .sort((a, b) => b - a)
          .map((year) => ({
            value: year.toString(),
            label: `ปีงบประมาณ ${year}`,
          })),
        statuses: [
          { value: "APPROVED", label: "อนุมัติแล้วทั้งหมด" },
          ...APPROVED_STATUS_CODES.map((code) => ({
            value: code,
            label: formatStatusDisplay(code),
          })),
        ],
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
