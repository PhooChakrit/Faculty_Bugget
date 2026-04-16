import { PrismaClient } from "@/app/generated/prisma/client";

/**
 * Generates the next official project ID in the format YYxxxxx
 *   YY    = last 2 digits of the Buddhist Era year (CE + 543)
 *           e.g. 2026 CE → 2569 BE → "69"
 *   xxxxx = 5-digit zero-padded sequential number within the year (00001–99999)
 *
 * Example: 6900001, 6900002, …, 6999999, 7000001 (next year)
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

  if (nextNum > 99999) {
    throw new Error(
      `Project ID sequential limit (99999) reached for year ${prefix}`,
    );
  }

  return `${prefix}${String(nextNum).padStart(5, "0")}`;
}
