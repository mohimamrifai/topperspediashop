import { sql } from "drizzle-orm";
import {
  index,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { depositStatus } from "./enums";
import { profiles } from "./profiles";

export const deposits = pgTable(
  "deposits",
  {
    id: serial("id").primaryKey(),
    memberId: uuid("member_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
    proofUrl: text("proof_url"),
    status: depositStatus("status").notNull().default("pending"),
    notes: text("notes"),
    approvedBy: uuid("approved_by").references(() => profiles.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
  },
  (table) => [
    index("deposits_member_id_idx").on(table.memberId),
    index("deposits_member_created_idx").on(table.memberId, table.createdAt),
    index("deposits_status_idx").on(table.status),
    index("deposits_status_created_idx").on(table.status, table.createdAt),
    index("deposits_approved_by_idx").on(table.approvedBy),
  ],
);
