CREATE INDEX IF NOT EXISTS "account_user_id_idx"
  ON "account" USING btree ("user_id");

CREATE INDEX IF NOT EXISTS "account_provider_account_idx"
  ON "account" USING btree ("provider_id", "account_id");

CREATE INDEX IF NOT EXISTS "session_user_id_idx"
  ON "session" USING btree ("user_id");

CREATE INDEX IF NOT EXISTS "session_expires_at_idx"
  ON "session" USING btree ("expires_at");

CREATE INDEX IF NOT EXISTS "session_impersonated_by_idx"
  ON "session" USING btree ("impersonated_by");

CREATE INDEX IF NOT EXISTS "verification_identifier_idx"
  ON "verification" USING btree ("identifier");

CREATE INDEX IF NOT EXISTS "verification_expires_at_idx"
  ON "verification" USING btree ("expires_at");

CREATE INDEX IF NOT EXISTS "profiles_referred_by_created_at_idx"
  ON "profiles" USING btree ("referred_by", "created_at");

CREATE INDEX IF NOT EXISTS "profiles_role_created_at_idx"
  ON "profiles" USING btree ("role", "created_at");

CREATE INDEX IF NOT EXISTS "profiles_leader_id_role_idx"
  ON "profiles" USING btree ("leader_id", "role");

CREATE INDEX IF NOT EXISTS "deposits_member_created_idx"
  ON "deposits" USING btree ("member_id", "created_at");

CREATE INDEX IF NOT EXISTS "withdrawals_member_created_idx"
  ON "withdrawals" USING btree ("member_id", "created_at");

CREATE INDEX IF NOT EXISTS "bank_accounts_user_created_idx"
  ON "bank_accounts" USING btree ("user_id", "created_at");

CREATE INDEX IF NOT EXISTS "deposit_bank_accounts_active_created_idx"
  ON "deposit_bank_accounts" USING btree ("is_active", "created_at");
