import { sql } from "drizzle-orm";
import { numeric, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";

import { userLevel } from "./enums";
import { profiles } from "./profiles";

export const commissionSettings = pgTable("commission_settings", {
  level: userLevel("level").primaryKey(),
  percent: numeric("percent", { precision: 5, scale: 2 }).notNull(),
  updatedBy: uuid("updated_by").references(() => profiles.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
});

export type CommissionSetting = typeof commissionSettings.$inferSelect;
