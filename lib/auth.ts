/**
 * Better Auth server instance.
 *
 * Plugin:
 *  - `username` — auth via username + password (no email required).
 *  - `additionalFields.username` — agar field `username` tersedia di
 *    Better Auth user table (kita simpan di sini, lalu mirror ke profiles).
 *  - `databaseHooks.user.create.after` — auto-insert `profiles` row default
 *    `member` setiap ada user baru. Server action `createAdminUser` akan
 *    UPDATE profiles untuk set role/leader_id.
 */
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin as adminPlugin } from "better-auth/plugins/admin";
import { adminAc, userAc } from "better-auth/plugins/admin/access";
import { username } from "better-auth/plugins/username";

import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema/profiles";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  advanced: {
    database: {
      // Better Auth default pakai string id. Kita pakai UUID supaya cocok
      // dengan `profiles.id` dan semua FK existing yang bertipe uuid.
      generateId: "uuid",
    },
  },
  // Auto-create profiles row saat user baru daftar. Default role: 'member'
  // dengan saldo awal Rp30.000 sesuai PRD. Server action admin-users akan
  // UPDATE profiles untuk set role/leader_id setelah create.
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          const username = (user as unknown as { username?: string }).username
            ?? user.name;
          await db
            .insert(profiles)
            .values({
              id: user.id,
              username,
              role: "member",
              balance: "30000",
            })
            .onConflictDoNothing();
        },
      },
    },
  },
  emailAndPassword: {
    // Tetap aktif karena username plugin hanya menambah login-by-username.
    // Proses sign-up tetap melewati email+password dengan synthetic email.
    enabled: true,
    minPasswordLength: 6,
  },
  plugins: [
    username(),
    adminPlugin({
      defaultRole: "member",
      adminRoles: ["super_admin", "admin_leader", "admin_staff"],
      roles: {
        super_admin: adminAc,
        admin_leader: adminAc,
        admin_staff: adminAc,
        member: userAc,
      },
    }),
    nextCookies(),
  ], // nextCookies HARUS plugin terakhir
  user: {
    additionalFields: {
      /**
       * Disimpan di Better Auth `user` table sebagai mirror dari `profiles.username`.
       * Server action `createAdminUser` set ini via Better Auth signUp.
       */
      username: {
        type: "string",
        required: true,
        input: true,
      },
      role: {
        type: "string",
        required: false,
        input: false, // di-set via databaseHook, bukan dari input form
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 hari
    updateAge: 60 * 60 * 24, // refresh setiap 1 hari
  },
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!,
});

export type Auth = typeof auth;
