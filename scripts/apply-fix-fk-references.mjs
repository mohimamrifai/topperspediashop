// scripts/apply-fix-fk-references.mjs
//
// One-shot script untuk mengganti FK reference `auth.users` -> `profiles.id`
// di tabel `deposit_bank_accounts` dan `commission_settings`.
//
// Latar belakang: schema Drizzle lama merefer ke `auth.users` (sisa Supabase
// Auth). Setelah migrasi ke Better Auth, user ada di `public.user`, sehingga
// insert ke `deposit_bank_accounts` selalu gagal dengan error 23503.
//
// Idempotent: aman dijalankan berulang. Kalau FK baru sudah ada, di-skip.
//
// Jalankan dari root project:
//   node scripts/apply-fix-fk-references.mjs

import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });
config({ path: ".env" });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("[fix-fk] DATABASE_URL is not set");
  process.exit(1);
}

const client = postgres(url, { prepare: false, max: 1, search_path: "public" });

/**
 * Cari semua FK constraint pada kolom tertentu di tabel tertentu.
 * Return array nama constraint.
 *
 * Pakai schema-qualified name `public.<table>` di `regclass` cast supaya
 * tidak bergantung pada `search_path` (beberapa role DB tidak punya
 * `public` di search_path sehingga unqualified cast gagal dengan
 * "column X does not exist").
 */
async function findFkOnColumn({ table, column }) {
  const qualified = `public.${table}`;
  return await client`
    SELECT conname AS name,
           conrelid::regclass::text AS table_name,
           confrelid::regclass::text AS ref_table
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.contype = 'f'
      AND n.nspname = 'public'
      AND c.conrelid = ${qualified}::regclass
      AND c.conkey = ARRAY[
        (SELECT attnum FROM pg_attribute
         WHERE attrelid = ${qualified}::regclass
           AND attname = ${column})
      ]::smallint[]
  `;
}

/**
 * Cek apakah constraint tertentu sudah ada.
 */
async function constraintExists(name) {
  const rows = await client`
    SELECT 1 FROM pg_constraint WHERE conname = ${name} LIMIT 1
  `;
  return rows.length > 0;
}

async function ensureFkToProfiles({ table, column, constraintName }) {
  console.log(`[fix-fk] inspecting ${table}.${column}...`);

  // 1) Hapus semua FK existing di kolom ini (kalau ada).
  const existing = await findFkOnColumn({ table, column });
  if (existing.length === 0) {
    console.log(`[fix-fk]   no existing FK on ${table}.${column}, nothing to drop.`);
  } else {
    for (const row of existing) {
      console.log(
        `[fix-fk]   dropping FK ${row.name} (${table}.${column} -> ${row.ref_table})`
      );
      // Constraint name dan column name berasal dari DB (bukan input user),
      // jadi interpolasi langsung aman.
      await client.unsafe(
        `ALTER TABLE public.${table} DROP CONSTRAINT IF EXISTS "${row.name}"`
      );
    }
  }

  // 2) Tambah FK baru ke profiles.id (kalau belum ada).
  if (await constraintExists(constraintName)) {
    console.log(`[fix-fk]   constraint ${constraintName} already exists, skip.`);
    return;
  }

  console.log(
    `[fix-fk]   adding FK ${constraintName} (${table}.${column} -> profiles.id) ON DELETE SET NULL`
  );
  await client.unsafe(
    `ALTER TABLE public.${table}
     ADD CONSTRAINT "${constraintName}"
     FOREIGN KEY ("${column}") REFERENCES public.profiles(id) ON DELETE SET NULL`
  );
}

try {
  console.log("[fix-fk] mulai...");

  // Validasi tabel & kolom ada (supaya error-nya jelas kalau DB kosong).
  const required = [
    { table: "deposit_bank_accounts", column: "created_by" },
    { table: "commission_settings", column: "updated_by" },
  ];
  for (const { table, column } of required) {
    const colCheck = await client`
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = ${table}
        AND column_name = ${column}
      LIMIT 1
    `;
    if (colCheck.length === 0) {
      throw new Error(
        `kolom public.${table}.${column} tidak ditemukan — pastikan tabel sudah ada.`
      );
    }
  }

  // Sanity: profiles.id harus ada.
  const profileCheck = await client`
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'id'
    LIMIT 1
  `;
  if (profileCheck.length === 0) {
    throw new Error("tabel public.profiles tidak ditemukan — jalankan seed/migrasi awal dulu.");
  }

  await ensureFkToProfiles({
    table: "deposit_bank_accounts",
    column: "created_by",
    constraintName: "deposit_bank_accounts_created_by_profiles_id_fk",
  });

  await ensureFkToProfiles({
    table: "commission_settings",
    column: "updated_by",
    constraintName: "commission_settings_updated_by_profiles_id_fk",
  });

  // Sanity check akhir: tampilkan semua FK pada kolom yang baru saja kita fix.
  for (const { table, column } of required) {
    const final = await findFkOnColumn({ table, column });
    console.log(
      `[fix-fk] final state ${table}.${column}:`,
      final.length === 0
        ? "(no FK)"
        : final.map((r) => `${r.name} -> ${r.ref_table}`).join(", ")
    );
  }

  console.log("[fix-fk] selesai.");
} catch (err) {
  console.error("[fix-fk] gagal:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
} finally {
  await client.end();
}
