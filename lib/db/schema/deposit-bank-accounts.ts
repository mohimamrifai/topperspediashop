import { sql } from "drizzle-orm";
import {
  bigserial,
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { profiles } from "./profiles";

/**
 * Rekening tujuan DEPOSIT (bukan rekening penarikan member).
 * Ditampilkan ke member di halaman `/recharge`.
 *
 * Scoping per-leader: kolom `leader_id` (nullable) menentukan kepemilikan.
 * - `leader_id = NULL` → rekening global, dilihat semua member.
 * - `leader_id = <uuid leader>` → rekening hanya untuk anggota tim leader
 *   tersebut (di mana `profiles.leader_id = leader.id`).
 *
 * Hak akses:
 * - super_admin: CRUD semua rekening.
 * - admin_leader (dengan override `depositBankCrud`): CRUD rekening tim-nya
 *   sendiri (`leader_id = leader.id`); TIDAK boleh edit/hapus rekening NULL.
 * - admin_staff: tidak punya akses ke halaman ini.
 */
export const depositBankAccounts = pgTable(
  "deposit_bank_accounts",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    bankName: text("bank_name").notNull(),
    accountName: text("account_name").notNull(),
    accountNumber: text("account_number").notNull(),
    notes: text("notes"),
    isActive: boolean("is_active").notNull().default(true),
    /**
     * scoping per-leader. NULL = rekening global.
     */
    leaderId: uuid("leader_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    createdBy: uuid("created_by").references(() => profiles.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [
    index("deposit_bank_accounts_is_active_idx").on(table.isActive),
    index("deposit_bank_accounts_active_created_idx").on(
      table.isActive,
      table.createdAt,
    ),
    index("deposit_bank_accounts_leader_id_idx").on(table.leaderId),
  ],
);
