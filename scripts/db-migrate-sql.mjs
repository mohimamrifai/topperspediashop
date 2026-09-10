/**
 * Apply incremental SQL files in drizzle/migrations/ that are not yet recorded.
 * Run after `pnpm db:push` on a fresh database.
 */
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });
config({ path: ".env" });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("[migrate-sql] DATABASE_URL is not set");
  process.exit(1);
}

const migrationsDir = join(process.cwd(), "drizzle", "migrations");
const sql = postgres(url, { prepare: false, max: 1 });

try {
  await sql`
    CREATE TABLE IF NOT EXISTS _sql_migrations (
      id text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  const applied = new Set(
    (await sql`SELECT id FROM _sql_migrations`).map((row) => row.id),
  );

  const files = (await readdir(migrationsDir))
    .filter((name) => name.endsWith(".sql"))
    .sort();

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`[migrate-sql] skip ${file}`);
      continue;
    }

    const body = await readFile(join(migrationsDir, file), "utf8");
    console.log(`[migrate-sql] apply ${file}`);
    await sql.unsafe(body);
    await sql`INSERT INTO _sql_migrations (id) VALUES (${file})`;
  }

  console.log("[migrate-sql] done");
} finally {
  await sql.end({ timeout: 5 });
}
