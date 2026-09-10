/**
 * Drizzle schema untuk tabel Better Auth.
 *
 * Generated manually (bukan via CLI karena CLI gagal resolve auth.ts yang
 * import dari `lib/db` — module resolution bermasalah saat CLI run). Skema
 * sesuai konvensi Better Auth v1.6 (lihat https://better-auth.com/docs).
 *
 * Tabel:
 *   - user         — akun utama (mirror ke profiles untuk field custom)
 *   - session      — sesi login (DB-backed)
 *   - account      — kredensial per provider (username/password di sini)
 *   - verification — token untuk email/phone verification (tidak dipakai
 *                    karena kita disable email verification, tapi tabel
 *                    tetap di-generate sesuai schema Better Auth)
 *
 * Catatan:
 *   - `id` bertipe `uuid` (bukan text) supaya match dengan `profiles.id`
 *     dan FK di domain tables. Better Auth di-config pakai
 *     `database.generateId: "uuid"` di `lib/auth.ts`.
 */
import { boolean, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  /** additionalField: mirror dari profiles.username */
  username: text("username").notNull().unique(),
  /** Dibutuhkan plugin username Better Auth */
  displayUsername: text("display_username"),
  /** additionalField: role (member/admin_staff/admin_leader/super_admin) */
  role: text("role"),
  /** Dibutuhkan plugin admin Better Auth */
  banned: boolean("banned").notNull().default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const session = pgTable(
  "session",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    impersonatedBy: uuid("impersonated_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("session_user_id_idx").on(table.userId),
    index("session_expires_at_idx").on(table.expiresAt),
    index("session_impersonated_by_idx").on(table.impersonatedBy),
  ],
);

export const account = pgTable(
  "account",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /**
     * Provider credential: "credential" untuk username/password
     * (lihat konvensi Better Auth username plugin).
     */
    providerId: text("provider_id").notNull(),
    /**
     * Untuk "credential" provider, ini = email (atau identifier) user.
     */
    accountId: text("account_id").notNull(),
    /** scrypt-hashed password (Better Auth default). */
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("account_user_id_idx").on(table.userId),
    index("account_provider_account_idx").on(table.providerId, table.accountId),
  ],
);

export const verification = pgTable(
  "verification",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("verification_identifier_idx").on(table.identifier),
    index("verification_expires_at_idx").on(table.expiresAt),
  ],
);
