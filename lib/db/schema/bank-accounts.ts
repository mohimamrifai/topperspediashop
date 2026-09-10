import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { profiles } from "./profiles";

export const bankAccounts = pgTable(
  "bank_accounts",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    bankName: text("bank_name").notNull(),
    accountName: text("account_name").notNull(),
    accountNumber: text("account_number").notNull(),
    backupPhone: text("backup_phone"),
    isPrimary: boolean("is_primary").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [
    index("bank_accounts_user_id_idx").on(table.userId),
    index("bank_accounts_user_created_idx").on(table.userId, table.createdAt),
    uniqueIndex("bank_accounts_primary_idx")
      .on(table.userId)
      .where(sql`${table.isPrimary} = true`),
  ],
);
