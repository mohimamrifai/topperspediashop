// scripts/db-seed.mjs

import { randomUUID } from "node:crypto";

import bcrypt from "bcryptjs";
import { hashPassword } from "@better-auth/utils/password";
import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });
config({ path: ".env" });

const url = process.env.DATABASE_URL;

if (!url) {
  console.error("[seed] DATABASE_URL is not set");
  process.exit(1);
}

const sql = postgres(url, {
  prepare: false,
  max: 1,
});

const syntheticEmail = (username) =>
  `${username.toLowerCase()}@topperspediashop.app`;

function generateReferralCode() {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "STAFF-";

  for (let i = 0; i < 6; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return out;
}

const DEFAULT_DEV_PASSWORD = "Password123";

const SEED_USERS = [
  {
    username: "superadmin",
    password: DEFAULT_DEV_PASSWORD,
    role: "super_admin",
  },
  {
    username: "adminleader",
    password: DEFAULT_DEV_PASSWORD,
    role: "admin_leader",
  },
  {
    username: "adminstaff",
    password: DEFAULT_DEV_PASSWORD,
    role: "admin_staff",
    leaderUsername: "adminleader",
    referralCode: "STAFF001",
  },
  {
    username: "member",
    password: DEFAULT_DEV_PASSWORD,
    role: "member",
    balance: "30000",
  },
  {
    username: "rinasyah",
    password: "jika123",
    role: "member",
    balance: "30000",
    referrerUsername: "adminstaff",
    withdrawPassword: "123456",
  },
];

async function lookupProfileId(username) {
  if (!username) return null;

  const rows = await sql`
    SELECT id 
    FROM profiles 
    WHERE username = ${username}
    LIMIT 1
  `;

  return rows[0]?.id ?? null;
}

async function ensureUser(spec) {
  const {
    username,
    password,
    role,
    leaderUsername,
    referrerUsername,
    referralCode: manualReferral,
    balance,
    withdrawPassword,
  } = spec;

  const existingRows = await sql`
    SELECT u.id, p.role AS profile_role
    FROM "user" u
    LEFT JOIN profiles p ON p.id = u.id
    WHERE u.username = ${username}
    LIMIT 1
  `;

  const existing = existingRows[0];

  if (existing) {
    const passwordHash = await hashPassword(password);
    await sql`
      UPDATE account
      SET password = ${passwordHash}, updated_at = ${new Date()}
      WHERE user_id = ${existing.id} AND provider_id = 'credential'
    `;

    console.log(
      `[seed] skip @${username} — sudah ada (profile role=${existing.profile_role ?? "?"}, password disinkronkan)`
    );

    return existing.id;
  }

  const passwordHash = await hashPassword(password);
  const userId = randomUUID();
  const email = syntheticEmail(username);
  const now = new Date();

  await sql`
    INSERT INTO "user" (
      id,
      name,
      email,
      email_verified,
      username,
      display_username,
      role,
      banned,
      created_at,
      updated_at
    )
    VALUES (
      ${userId},
      ${username},
      ${email},
      false,
      ${username},
      ${username},
      ${role},
      false,
      ${now},
      ${now}
    )
  `;

  await sql`
    INSERT INTO account (
      id,
      user_id,
      provider_id,
      account_id,
      password,
      created_at,
      updated_at
    )
    VALUES (
      ${randomUUID()},
      ${userId},
      'credential',
      ${email},
      ${passwordHash},
      ${now},
      ${now}
    )
  `;

  const leaderId = await lookupProfileId(leaderUsername);
  const referredBy = await lookupProfileId(referrerUsername);

  let resolvedReferral = null;

  if (role === "admin_staff") {
    resolvedReferral =
      manualReferral ?? generateReferralCode();
  }

  await sql`
    INSERT INTO profiles (
      id,
      username,
      role,
      level,
      credit_score,
      balance,
      frozen_balance,
      referral_code,
      referred_by,
      leader_id,
      access_overrides,
      status,
      created_at,
      updated_at
    )
    VALUES (
      ${userId},
      ${username},
      ${role},
      'classic',
      100,
      ${balance ?? 0},
      0,
      ${resolvedReferral},
      ${referredBy},
      ${leaderId},
      '{}'::jsonb,
      'online',
      ${now},
      ${now}
    )
  `;

  // 6. Set sandi penarikan (bcrypt via Node — sama dengan helper aplikasi,
  //    tidak butuh extension PostgreSQL apapun).
  if (withdrawPassword) {
    const withdrawHash = await bcrypt.hash(withdrawPassword, 10);
    await sql`
      UPDATE profiles
      SET withdraw_password_hash = ${withdrawHash}
      WHERE id = ${userId}
    `;
  }

  console.log(
    `[seed] created @${username} (${role})`
  );

  return userId;
}

// Daftar tabel yang di-reset setiap kali seed dijalankan. Urutan tidak
// penting karena `TRUNCATE ... CASCADE` menghapus dependensi FK secara
// otomatis. Tambahkan tabel baru di sini bila schema bertambah.
const RESET_TABLES = [
  "user",
  "session",
  "account",
  "verification",
  "profiles",
  "products",
  "uploaded_files",
  "task_requests",
  "tasks",
  "deposits",
  "withdrawals",
  "bank_accounts",
  "audit_logs",
  "customer_service_channels",
  "deposit_bank_accounts",
  "commission_settings",
];

async function resetDatabase() {
  const tableList = RESET_TABLES.map((t) => `"${t}"`).join(", ");
  await sql.unsafe(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE`);
  console.log(`[seed] reset ${RESET_TABLES.length} tabel (TRUNCATE CASCADE)`);
}

try {
  console.log("[seed] mulai...");

  await resetDatabase();

  // Hash sandi penarikan dilakukan di Node (bcryptjs) — tidak butuh extension
  // PostgreSQL apapun. Aman untuk semua provider Postgres standar.

  for (const spec of SEED_USERS) {
    await ensureUser(spec);
  }

  console.log("[seed] selesai.");
} catch (error) {
  console.error("[seed] gagal:", error);
  process.exitCode = 1;
} finally {
  await sql.end();
}