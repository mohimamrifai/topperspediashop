-- Menambahkan kolom withdraw_lock_reason di tabel profiles
-- untuk menyimpan alasan pemblokiran penarikan yang diinput admin.
-- NULL = penarikan tidak diblokir (atau alasan tidak diberikan).
ALTER TABLE "profiles"
ADD COLUMN "withdraw_lock_reason" text;
