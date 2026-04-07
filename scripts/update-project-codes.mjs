import "dotenv/config";
import pg from "pg";
const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const res = await pool.query('UPDATE "Project" SET "projectCode" = id');
console.log(`Updated ${res.rowCount} row(s).`);

const { rows } = await pool.query(
  'SELECT id, "projectCode" FROM "Project" ORDER BY "createdAt" ASC',
);
console.log(JSON.stringify(rows, null, 2));

await pool.end();
