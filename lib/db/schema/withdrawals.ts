import { sql } from "drizzle-orm";
import {
  bigint,
  index,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { withdrawalStatus } from "./enums";
import { bankAccounts } from "./bank-accounts";
import { profiles } from "./profiles";

export const withdrawals = pgTable(
  "withdrawals",
  {
    id: serial("id").primaryKey(),
    memberId: uuid("member_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    bankAccountId: bigint("bank_account_id", { mode: "number" })
      .notNull()
      .references(() => bankAccounts.id, { onDelete: "restrict" }),
    amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
    status: withdrawalStatus("status").notNull().default("pending"),
    notes: text("notes"),
    processedBy: uuid("processed_by").references(() => profiles.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    processedAt: timestamp("processed_at", { withTimezone: true }),
  },
  (table) => [
    index("withdrawals_member_id_idx").on(table.memberId),
    index("withdrawals_member_created_idx").on(table.memberId, table.createdAt),
    index("withdrawals_status_idx").on(table.status),
    index("withdrawals_status_created_idx").on(table.status, table.createdAt),
    index("withdrawals_bank_account_id_idx").on(table.bankAccountId),
    index("withdrawals_processed_by_idx").on(table.processedBy),
  ],
);
