import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { channelType } from "./enums";

export const customerServiceChannels = pgTable(
  "customer_service_channels",
  {
    id: serial("id").primaryKey(),
    type: channelType("type").notNull(),
    label: text("label").notNull(),
    url: text("url").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [
    index("channels_is_active_sort_idx").on(table.isActive, table.sortOrder),
  ],
);
