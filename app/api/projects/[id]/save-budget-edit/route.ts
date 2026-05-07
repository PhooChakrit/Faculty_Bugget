import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";

/** Budget fields that can be edited in STATUS_99 mode */
const BUDGET_FIELDS = [
  "budgetSourceExtGov",
  "budgetSourceExtPrivate",
  "budgetSourceExtForeign",
  "budgetSourceInternal",
  "expenseRemuneration",
  "expenseSupplies",
  "expenseMaterials",
  "expenseUtilities",
  "expenseSubsidy",
  "expenseReserve",
] as const;

type BudgetField = (typeof BUDGET_FIELDS)[number];

/**
 * POST /api/projects/[id]/save-budget-edit
 * Save edited budget fields, log changes, restore previous status.
 *
 * Body: { budgetSourceExtGov?: number, expenseRemuneration?: number, ... }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const project = await prisma.project.findUnique({
      where: { id },
      select: {
        currentStatusCode: true,
        previousStatusCode: true,
        budgetSourceExtGov: true,
        budgetSourceExtPrivate: true,
        budgetSourceExtForeign: true,
        budgetSourceInternal: true,
        expenseRemuneration: true,
        expenseSupplies: true,
        expenseMaterials: true,
        expenseUtilities: true,
        expenseSubsidy: true,
        expenseReserve: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "ไม่พบโครงการ" }, { status: 404 });
    }

    if (project.currentStatusCode !== "STATUS_99") {
      return NextResponse.json(
        { error: "โครงการไม่อยู่ในโหมดแก้ไขการเงิน" },
        { status: 400 },
      );
    }

    const body = await request.json();

    // Filter only allowed budget fields and build update + logs
    const updateData: Record<string, Prisma.Decimal | null> = {};
    const logEntries: {
      projectId: string;
      fieldName: string;
      oldValue: Prisma.Decimal | null;
      newValue: Prisma.Decimal | null;
    }[] = [];

    for (const field of BUDGET_FIELDS) {
      if (field in body) {
        const rawValue = body[field];
        const newValue =
          rawValue !== null && rawValue !== undefined && rawValue !== ""
            ? new Prisma.Decimal(rawValue)
            : null;

        const oldValue = project[field as BudgetField] as Prisma.Decimal | null;

        // Only log if value actually changed
        const oldStr = oldValue?.toString() ?? "";
        const newStr = newValue?.toString() ?? "";
        if (oldStr !== newStr) {
          logEntries.push({
            projectId: id,
            fieldName: field,
            oldValue,
            newValue,
          });
          updateData[field] = newValue;
        }
      }
    }

    if (Object.keys(updateData).length === 0 && logEntries.length === 0) {
      // Nothing changed — just restore status
      await prisma.project.update({
        where: { id },
        data: {
          currentStatusCode: project.previousStatusCode || "STATUS_1",
          previousStatusCode: null,
        },
      });

      return NextResponse.json({
        success: true,
        message: "ไม่มีการเปลี่ยนแปลง — กลับสถานะเดิม",
        changedFields: 0,
      });
    }

    // Transaction: update budget + create logs + restore status
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Update project budget fields + restore status
      await tx.project.update({
        where: { id },
        data: {
          ...updateData,
          currentStatusCode: project.previousStatusCode || "STATUS_1",
          previousStatusCode: null,
        } as Prisma.ProjectUpdateInput,
      });

      // Create edit logs
      if (logEntries.length > 0) {
        await tx.budgetEditLog.createMany({
          data: logEntries,
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: `บันทึกการแก้ไขการเงินเรียบร้อย (${logEntries.length} รายการ)`,
      changedFields: logEntries.length,
      changes: logEntries.map((l) => ({
        field: l.fieldName,
        oldValue: l.oldValue?.toString() ?? null,
        newValue: l.newValue?.toString() ?? null,
      })),
    });
  } catch (error) {
    console.error("Save budget edit error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการบันทึก" },
      { status: 500 },
    );
  }
}
