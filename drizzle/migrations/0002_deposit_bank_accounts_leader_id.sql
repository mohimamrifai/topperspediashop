-- Tambah kolom leader_id ke deposit_bank_accounts untuk scoping rekening per-leader.
-- Nullable + ON DELETE SET NULL agar rekening tidak hilang saat leader dihapus.
ALTER TABLE "deposit_bank_accounts"
ADD COLUMN "leader_id" uuid REFERENCES "profiles"("id") ON DELETE SET NULL;

-- Index untuk mempercepat filter berdasarkan leader.
CREATE INDEX "deposit_bank_accounts_leader_id_idx"
ON "deposit_bank_accounts" ("leader_id");
