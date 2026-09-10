import { sql } from "drizzle-orm";
import {
  bigint,
  index,
  integer,
  numeric,
  pgTable,
  serial,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { taskStatus } from "./enums";
import { products } from "./products";
import { profiles } from "./profiles";

export const tasks = pgTable(
  "tasks",
  {
    id: serial("id").primaryKey(),
    memberId: uuid("member_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    productId: bigint("product_id", { mode: "number" })
      .references(() => products.id, { onDelete: "restrict" }),
    price: numeric("price", { precision: 15, scale: 2 }).notNull(),
    commission: numeric("commission", { precision: 15, scale: 2 }).notNull(),
    status: taskStatus("status").notNull().default("menunggu"),
    queue: integer("queue"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    index("tasks_member_id_idx").on(table.memberId),
    index("tasks_product_id_idx").on(table.productId),
    index("tasks_status_idx").on(table.status),
    index("tasks_member_status_idx").on(table.memberId, table.status),
    index("tasks_created_at_idx").on(table.createdAt),
  ],
);
