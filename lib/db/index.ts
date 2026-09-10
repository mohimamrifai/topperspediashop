import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is not set");
}

declare global {
  var __pg__: ReturnType<typeof postgres> | undefined;
}

const queryClient =
  global.__pg__ ??
  postgres(url, {
    prepare: false,
    max: 10,
  });

if (process.env.NODE_ENV !== "production") {
  global.__pg__ = queryClient;
}

export const db = drizzle(queryClient, { schema, casing: "snake_case" });

export type Database = typeof db;
export { schema };
