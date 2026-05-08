import { PrismaClient } from "@/app/generated/prisma/client";

/**
 * Generates the next official project code in the format YYxxxxx
 *   YY    = last 2 digits of the Buddhist Era year (CE + 543)
 *           e.g. 2026 CE → 2569 BE → "69"
 *   xxx = 3-digit zero-padded sequential number within the year (001–999)
 *
 * Example: 69001, 69002, …, 69999, 70001 (next year)
 *
 * Must be called inside a serializable transaction to avoid race conditions.
 */
export async function generateProjectId(
  tx: Omit<
    PrismaClient,
    "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
  >,
): Promise<string> {
  const beYear = new Date().getFullYear() + 543;
  const yy = String(beYear).slice(-2); // e.g. "69"
  const prefix = yy;

  // New rows store the official number in projectCode. The id fallback keeps
  // the sequence compatible with legacy rows that used the code as Project.id.
  const existing = await tx.project.findMany({
    where: {
      OR: [
        { projectCode: { startsWith: prefix } },
        { id: { startsWith: prefix } },
      ],
    },
    select: { id: true, projectCode: true },
  });

  let nextNum = 1;
  for (const project of existing) {
    const officialCode = project.projectCode ?? project.id;
    if (!officialCode.startsWith(prefix)) continue;

    const currentNum = parseInt(officialCode.slice(2), 10);
    if (!isNaN(currentNum) && currentNum >= nextNum) {
      nextNum = currentNum + 1;
    }
  }

  if (nextNum > 999) {
    throw new Error(
      `Project ID sequential limit (999) reached for year ${prefix}`,
    );
  }

  return `${prefix}${String(nextNum).padStart(3, "0")}`;
}
