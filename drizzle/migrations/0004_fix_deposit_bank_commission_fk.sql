-- Migrasi 0004: Fix FK reference di deposit_bank_accounts dan commission_settings.
--
-- Latar belakang: schema Drizzle sebelumnya merefer ke tabel `auth.users`
-- (sisa dari Supabase Auth) untuk kolom `created_by` / `updated_by`.
-- Setelah migrasi ke Better Auth, user disimpan di `public.user` (lowercase
-- singular), sehingga FK ke `auth.users` selalu gagal (error 23503:
-- "Key (created_by)=(...) is not present in table 'users'").
--
-- Fix: ganti reference dari `auth.users.id` ke `profiles.id` agar konsisten
-- dengan domain table lain (audit_logs, withdrawals, deposits, dll).

BEGIN;

-- =============================================================
-- 1. deposit_bank_accounts.created_by -> profiles.id
-- =============================================================

-- Hapus SEMUA constraint FK pada kolom created_by (tanpa memandang nama
-- atau tabel referensi), supaya migrasi aman untuk DB lama maupun baru.
DO $$
DECLARE
  constraint_record RECORD;
BEGIN
  FOR constraint_record IN
    SELECT conname
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.contype = 'f'
      AND n.nspname = 'public'
      AND c.conrelid = 'public.deposit_bank_accounts'::regclass
      AND c.conkey = ARRAY[
        (SELECT attnum FROM pg_attribute
         WHERE attrelid = 'public.deposit_bank_accounts'::regclass
           AND attname = 'created_by')
      ]::smallint[]
  LOOP
    EXECUTE format(
      'ALTER TABLE public.deposit_bank_accounts DROP CONSTRAINT IF EXISTS %I',
      constraint_record.conname
    );
    RAISE NOTICE '[migrate] dropped constraint % on deposit_bank_accounts.created_by',
      constraint_record.conname;
  END LOOP;
END $$;

-- Tambah constraint baru: created_by -> profiles.id (ON DELETE SET NULL)
ALTER TABLE "deposit_bank_accounts"
ADD CONSTRAINT "deposit_bank_accounts_created_by_profiles_id_fk"
FOREIGN KEY ("created_by") REFERENCES "profiles"("id") ON DELETE SET NULL;

-- =============================================================
-- 2. commission_settings.updated_by -> profiles.id
-- =============================================================

DO $$
DECLARE
  constraint_record RECORD;
BEGIN
  FOR constraint_record IN
    SELECT conname
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.contype = 'f'
      AND n.nspname = 'public'
      AND c.conrelid = 'public.commission_settings'::regclass
      AND c.conkey = ARRAY[
        (SELECT attnum FROM pg_attribute
         WHERE attrelid = 'public.commission_settings'::regclass
           AND attname = 'updated_by')
      ]::smallint[]
  LOOP
    EXECUTE format(
      'ALTER TABLE public.commission_settings DROP CONSTRAINT IF EXISTS %I',
      constraint_record.conname
    );
    RAISE NOTICE '[migrate] dropped constraint % on commission_settings.updated_by',
      constraint_record.conname;
  END LOOP;
END $$;

ALTER TABLE "commission_settings"
ADD CONSTRAINT "commission_settings_updated_by_profiles_id_fk"
FOREIGN KEY ("updated_by") REFERENCES "profiles"("id") ON DELETE SET NULL;

COMMIT;
