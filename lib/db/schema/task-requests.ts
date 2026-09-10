import { sql } from "drizzle-orm";
import { index, integer, pgTable, serial, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { profiles } from "./profiles";

export const taskRequests = pgTable(
  "task_requests",
  {
    id: serial("id").primaryKey(),
    memberId: uuid("member_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    requestCount: integer("request_count").notNull().default(1),
    requestedAt: timestamp("requested_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [
    uniqueIndex("task_requests_member_id_unique").on(table.memberId),
    index("task_requests_requested_at_idx").on(table.requestedAt),
  ],
);
