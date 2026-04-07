/**
 * One-time migration script: convert existing Project IDs from cuid format
 * to the new YYxxxxx format (YY = last 2 digits of Buddhist Era year, xxxxx = 5-digit sequence).
 *
 * Run: npx tsx --tsconfig tsconfig.json scripts/migrate-project-ids.ts
 */
import "dotenv/config";
import { Pool } from "pg";

// Tables that have a "projectId" FK referencing Project.id
const CHILD_TABLES = [
  "ProjectTargetGroup",
  "ProjectStrategy",
  "IncomeItem",
  "ProjectCollaborator",
  "ProjectManager",
  "Meeting",
  "ProjectStatusRecord",
];

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");

  const pool = new Pool({ connectionString });
  const client = await pool.connect();

  try {
    // Fetch all projects ordered by createdAt so sequences are stable
    const { rows: projects } = await client.query<{
      id: string;
      createdAt: Date;
    }>(`SELECT id, "createdAt" FROM "Project" ORDER BY "createdAt" ASC`);

    if (projects.length === 0) {
      console.log("No projects found — nothing to migrate.");
      return;
    }

    console.log(`Found ${projects.length} project(s) to migrate.\n`);

    // Build per-year sequential counters
    const yearCounters = new Map<string, number>();
    const mapping = new Map<string, string>(); // oldId → newId

    for (const project of projects) {
      const ceYear = new Date(project.createdAt).getFullYear();
      const beYear = ceYear + 543;
      const yy = String(beYear).slice(-2); // e.g. "69"

      const seq = (yearCounters.get(yy) ?? 0) + 1;
      yearCounters.set(yy, seq);

      const newId = `${yy}${String(seq).padStart(5, "0")}`;
      mapping.set(project.id, newId);
      console.log(`  ${project.id}  →  ${newId}`);
    }

    console.log("\nApplying migration inside a transaction...");
    await client.query("BEGIN");

    // Disable FK trigger checks so we can freely update PKs and FKs
    await client.query(`ALTER TABLE "Project" DISABLE TRIGGER ALL`);
    for (const table of CHILD_TABLES) {
      await client.query(`ALTER TABLE "${table}" DISABLE TRIGGER ALL`);
    }

    for (const [oldId, newId] of mapping) {
      // Update FK columns in child tables first
      for (const table of CHILD_TABLES) {
        await client.query(
          `UPDATE "${table}" SET "projectId" = $1 WHERE "projectId" = $2`,
          [newId, oldId],
        );
      }

      // Update the primary key
      await client.query(`UPDATE "Project" SET id = $1 WHERE id = $2`, [
        newId,
        oldId,
      ]);
    }

    // Re-enable FK triggers
    await client.query(`ALTER TABLE "Project" ENABLE TRIGGER ALL`);
    for (const table of CHILD_TABLES) {
      await client.query(`ALTER TABLE "${table}" ENABLE TRIGGER ALL`);
    }

    await client.query("COMMIT");
    console.log("\nMigration completed successfully.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Migration failed — rolled back.", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
