// One-shot script untuk apply migrasi kolom leader_id di tabel
// deposit_bank_accounts. Idempotent: aman dijalankan berulang.
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
  // 1) Cek apakah kolom leader_id sudah ada
  const existing = await sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'deposit_bank_accounts'
      AND column_name = 'leader_id'
  `;

  if (existing.length > 0) {
    console.log("[migrate] kolom leader_id sudah ada, skip ADD COLUMN.");
  } else {
    console.log("[migrate] menambah kolom leader_id...");
    await sql`
      ALTER TABLE "deposit_bank_accounts"
      ADD COLUMN "leader_id" uuid
      REFERENCES "profiles"("id") ON DELETE SET NULL
    `;
    console.log("[migrate] kolom leader_id ditambahkan.");
  }

  // 2) Cek + tambah index
  const indexExists = await sql`
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'deposit_bank_accounts'
      AND indexname = 'deposit_bank_accounts_leader_id_idx'
  `;

  if (indexExists.length > 0) {
    console.log("[migrate] index deposit_bank_accounts_leader_id_idx sudah ada, skip.");
  } else {
    console.log("[migrate] menambah index deposit_bank_accounts_leader_id_idx...");
    await sql`
      CREATE INDEX "deposit_bank_accounts_leader_id_idx"
      ON "deposit_bank_accounts" ("leader_id")
    `;
    console.log("[migrate] index ditambahkan.");
  }

  // 3) Backfill opsional: data existing sudah otomatis NULL (default untuk ADD COLUMN nullable).
  const nullCount = await sql`
    SELECT COUNT(*)::int AS n
    FROM deposit_bank_accounts
    WHERE leader_id IS NULL
  `;
  console.log(`[migrate] rekening dengan leader_id NULL: ${nullCount[0]?.n ?? 0}`);
  console.log("[migrate] selesai.");
} catch (err) {
  console.error("[migrate] gagal:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
} finally {
  await sql.end();
}
