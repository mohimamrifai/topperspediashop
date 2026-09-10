import { sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import {
  userLevel,
  userRole,
  userStatus,
} from "./enums";
import { user } from "./better-auth";

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    username: text("username").notNull(),
    role: userRole("role").notNull().default("member"),
    level: userLevel("level").notNull().default("classic"),
    creditScore: integer("credit_score").notNull().default(100),
    balance: numeric("balance", { precision: 15, scale: 2 })
      .notNull()
      .default("0"),
    frozenBalance: numeric("frozen_balance", { precision: 15, scale: 2 })
      .notNull()
      .default("0"),
    phone: text("phone"),
    withdrawPasswordHash: text("withdraw_password_hash"),
    referralCode: text("referral_code"),
    referredBy: uuid("referred_by"),
    /**
     * Untuk role `admin_staff`: id leader yang menaungi staff ini.
     * Untuk role `admin_leader` / `super_admin` / `member`: NULL.
     * Leader melihat aggregate member dari SEMUA staff yang `leader_id` = leader.id.
     */
    leaderId: uuid("leader_id"),
    /**
     * Persentase komisi (0-100) yang dibagikan ke admin_staff dari profit
     * deposit/withdrawal anggota referensinya. NULL = tidak diaktifkan.
     * Hanya berlaku untuk role `admin_staff`.
     */
    commissionRate: numeric("commission_rate", { precision: 5, scale: 2 }),
    /**
     * Izin akses tambahan per-admin. Super Admin dapat menyetel flag ini untuk
     * memberikan/mencabut kemampuan tertentu di luar role default.
     *
     * Bentuk JSON:
     * {
     *   "fullAccess": boolean,        // lihat semua data seperti super admin
     *   "canCreateStaff": boolean,    // boleh buat admin_staff
     *   "canCreateLeader": boolean,   // boleh buat admin_leader
     *   "commissionEdit": boolean,    // boleh edit rate komisi
     *   "depositBankCrud": boolean,   // boleh CRUD rekening deposit
     *   "channelCrud": boolean        // boleh CRUD channel pelayanan
     * }
     */
    accessOverrides: jsonb("access_overrides").notNull().default({}),
    status: userStatus("status").notNull().default("online"),
    /**
     * Alasan pemblokiran penarikan yang diinput admin. NULL ketika penarikan
     * tidak diblokir (atau diblokir tanpa alasan).
     */
    withdrawLockReason: text("withdraw_lock_reason"),
    /** IP saat pertama kali mendaftar (untuk deteksi akun duplikat). */
    registrationIp: text("registration_ip"),
    /** IP terakhir terlihat saat login member. */
    lastSeenIp: text("last_seen_ip"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [
    uniqueIndex("profiles_username_idx").on(table.username),
    uniqueIndex("profiles_referral_code_idx").on(table.referralCode),
    index("profiles_referred_by_idx").on(table.referredBy),
    index("profiles_referred_by_created_at_idx").on(table.referredBy, table.createdAt),
    index("profiles_role_idx").on(table.role),
    index("profiles_role_created_at_idx").on(table.role, table.createdAt),
    index("profiles_leader_id_idx").on(table.leaderId),
    index("profiles_leader_id_role_idx").on(table.leaderId, table.role),
    index("profiles_registration_ip_idx").on(table.registrationIp),
    index("profiles_last_seen_ip_idx").on(table.lastSeenIp),
  ],
);
