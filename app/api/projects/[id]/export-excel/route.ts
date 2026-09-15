import { NextRequest } from "next/server";
import path from "path";
import ExcelJS from "exceljs";
import prisma from "@/lib/prisma";
import { errorResponse, handleApiError } from "@/lib/api-response";

const TEMPLATE_PATH = path.join(
  process.cwd(),
  "templates",
  "budget-template.xlsx",
);

type DecimalLike = { toNumber: () => number } | number | null | undefined;
const toNum = (value: DecimalLike) =>
  typeof value === "number" ? value : (value?.toNumber() ?? 0);

/**
 * GET /api/projects/[id]/export-excel
 * สร้างไฟล์ประมาณการรายรับ-รายจ่ายจาก template (คงหน้าตาเดิม) เติมยอดของโครงการ
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const project = await prisma.project.findUnique({
      where: { id },
      select: {
        projectCode: true,
        projectNameThai: true,
        expenseRemuneration: true,
        expenseSupplies: true,
        expenseMaterials: true,
        expenseUtilities: true,
        expenseSubsidy: true,
        expenseReserve: true,
        incomeItems: { select: { type: true, amount: true } },
      },
    });

    if (!project) {
      return errorResponse("Project not found", 404);
    }

    // รายรับ: แยกค่าลงทะเบียน (REGISTRATION) กับที่เหลือ (SUPPORT + OTHER = ค่าสนับสนุน)
    const registration = project.incomeItems
      .filter((item) => item.type === "REGISTRATION")
      .reduce((sum, item) => sum + toNum(item.amount), 0);
    const support = project.incomeItems
      .filter((item) => item.type !== "REGISTRATION")
      .reduce((sum, item) => sum + toNum(item.amount), 0);
    const incomeTotal = registration + support;

    const remuneration = toNum(project.expenseRemuneration);
    const supplies = toNum(project.expenseSupplies);
    const materials = toNum(project.expenseMaterials);
    const utilities = toNum(project.expenseUtilities);
    const subsidy = toNum(project.expenseSubsidy);
    const reserve = toNum(project.expenseReserve);
    const expenseTotal =
      remuneration + supplies + materials + utilities + subsidy + reserve;

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(TEMPLATE_PATH);
    const sheet = workbook.worksheets[0];

    // รายรับ
    sheet.getCell("E4").value = registration; // ค่าลงทะเบียน
    sheet.getCell("E5").value = support; // ค่าสนับสนุน
    sheet.getCell("F6").value = { formula: "SUM(E4:E5)", result: incomeTotal };

    // รายจ่าย 6 หมวด (ช่องรวมของแต่ละหมวด)
    sheet.getCell("F8").value = remuneration; // หมวดค่าตอบแทน
    sheet.getCell("F12").value = supplies; // หมวดค่าใช้สอย
    sheet.getCell("F17").value = materials; // หมวดค่าวัสดุ
    sheet.getCell("F21").value = utilities; // หมวดค่าสาธารณูปโภค
    sheet.getCell("F25").value = subsidy; // หมวดเงินอุดหนุน
    sheet.getCell("F27").value = reserve; // หมวดเงินสำรอง
    sheet.getCell("F30").value = {
      formula: "SUM(F8:F28)",
      result: expenseTotal,
    };

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `ประมาณการรายรับรายจ่าย-${project.projectCode || id}.xlsx`;

    return new Response(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
