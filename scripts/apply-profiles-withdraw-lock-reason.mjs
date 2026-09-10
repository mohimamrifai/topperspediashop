// One-shot script untuk apply migrasi kolom withdraw_lock_reason di tabel
// profiles. Idempotent: aman dijalankan berulang.
import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });
config({ path: ".env" });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = postgres(url, { prepare: false, max: 1 });

try {
  const existing = await sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'withdraw_lock_reason'
  `;

  if (existing.length > 0) {
    console.log("[migrate] kolom withdraw_lock_reason sudah ada, skip ADD COLUMN.");
  } else {
    console.log("[migrate] menambah kolom withdraw_lock_reason...");
    await sql`
      ALTER TABLE "profiles"
      ADD COLUMN "withdraw_lock_reason" text
    `;
    console.log("[migrate] kolom withdraw_lock_reason ditambahkan.");
  }

  console.log("[migrate] selesai.");
} catch (err) {
  console.error("[migrate] gagal:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
} finally {
  await sql.end();
}
