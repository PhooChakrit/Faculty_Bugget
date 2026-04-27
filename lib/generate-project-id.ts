import { PrismaClient } from "@/app/generated/prisma/client";

/**
 * Generates the next official project ID in the format YYxxxxx
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

  // Find the highest existing id for this year (covers both draft rows and
  // approved projects; projectCode is only set post-approval and would miss drafts)
  const latest = await tx.project.findFirst({
    where: {
      id: {
        startsWith: prefix,
      },
    },
    orderBy: { id: "desc" },
    select: { id: true },
  });

  let nextNum = 1;
  if (latest?.id) {
    const currentNum = parseInt(latest.id.slice(2), 10);
    if (!isNaN(currentNum)) {
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
