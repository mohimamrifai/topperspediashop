/**
 * Seed demo khusus halaman Semua Staff (/admin/staff).
 *
 * Tidak mengganti seed utama (db-seed.mjs). Jalankan setelah seed utama:
 *   pnpm db:seed
 *   pnpm db:seed:staff
 *
 * Mengisi:
 *  - 1 admin_leader tambahan (demo_leader)
 *  - 3 admin_staff (2 di bawah adminleader, 1 di bawah demo_leader)
 *  - Member + deposit/penarikan dengan tanggal bulan ini & bulan lalu
 *    agar filter periode bisa diuji oleh super_admin & admin_leader.
 */

import { randomUUID } from "node:crypto";

import bcrypt from "bcryptjs";
import { hashPassword } from "@better-auth/utils/password";
import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });
config({ path: ".env" });

const url = process.env.DATABASE_URL;

if (!url) {
  console.error("[seed-staff] DATABASE_URL is not set");
  process.exit(1);
}

const sql = postgres(url, {
  prepare: false,
  max: 1,
});

const DEFAULT_DEV_PASSWORD = "Password123";

const syntheticEmail = (username) =>
  `${username.toLowerCase()}@topperspediashop.app`;

function toLocalISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(12, 0, 0, 0);
  return d;
}

function lastMonthMid() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  d.setDate(15);
  d.setHours(12, 0, 0, 0);
  return d;
}

async function lookupProfileId(username) {
  const rows = await sql`
    SELECT id FROM profiles WHERE username = ${username} LIMIT 1
  `;
  return rows[0]?.id ?? null;
}

async function ensureAuthUser({ username, password, role }) {
  const existingRows = await sql`
    SELECT u.id, p.role AS profile_role
    FROM "user" u
    LEFT JOIN profiles p ON p.id = u.id
    WHERE u.username = ${username}
    LIMIT 1
  `;

  const existing = existingRows[0];
  const passwordHash = await hashPassword(password);

  if (existing) {
    await sql`
      UPDATE account
      SET password = ${passwordHash}, updated_at = ${new Date()}
      WHERE user_id = ${existing.id} AND provider_id = 'credential'
    `;
    console.log(`[seed-staff] skip @${username} — sudah ada`);
    return existing.id;
  }

  const userId = randomUUID();
  const email = syntheticEmail(username);
  const now = new Date();

  await sql`
    INSERT INTO "user" (
      id, name, email, email_verified, username, display_username, role, banned, created_at, updated_at
    ) VALUES (
      ${userId}, ${username}, ${email}, false, ${username}, ${username}, ${role}, false, ${now}, ${now}
    )
  `;

  await sql`
    INSERT INTO account (
      id, user_id, provider_id, account_id, password, created_at, updated_at
    ) VALUES (
      ${randomUUID()}, ${userId}, 'credential', ${email}, ${passwordHash}, ${now}, ${now}
    )
  `;

  console.log(`[seed-staff] created auth @${username} (${role})`);
  return userId;
}

async function ensureProfile({
  userId,
  username,
  role,
  leaderId = null,
  referredBy = null,
  referralCode = null,
  createdAt = new Date(),
}) {
  const existing = await sql`
    SELECT id FROM profiles WHERE id = ${userId} LIMIT 1
  `;

  if (existing.length > 0) {
    await sql`
      UPDATE profiles
      SET
        role = ${role},
        leader_id = ${leaderId},
        referred_by = ${referredBy},
        referral_code = COALESCE(${referralCode}, referral_code),
        updated_at = now()
      WHERE id = ${userId}
    `;
    return userId;
  }

  await sql`
    INSERT INTO profiles (
      id, username, role, level, credit_score, balance, frozen_balance,
      referral_code, referred_by, leader_id, access_overrides, status, created_at, updated_at
    ) VALUES (
      ${userId}, ${username}, ${role}, 'classic', 100, 0, 0,
      ${referralCode}, ${referredBy}, ${leaderId}, '{}'::jsonb, 'online', ${createdAt}, ${createdAt}
    )
  `;

  console.log(`[seed-staff] created profile @${username} (${role})`);
  return userId;
}

async function ensureMember({ username, staffId, createdAt }) {
  const userId = await ensureAuthUser({
    username,
    password: DEFAULT_DEV_PASSWORD,
    role: "member",
  });

  await ensureProfile({
    userId,
    username,
    role: "member",
    referredBy: staffId,
    createdAt,
  });

  const withdrawHash = await bcrypt.hash("123456", 10);
  await sql`
    UPDATE profiles
    SET withdraw_password_hash = ${withdrawHash}, balance = 500000, updated_at = now()
    WHERE id = ${userId}
  `;

  return userId;
}

async function ensureBankAccount(memberId) {
  const rows = await sql`
    SELECT id FROM bank_accounts WHERE user_id = ${memberId} LIMIT 1
  `;
  if (rows[0]) return rows[0].id;

  const inserted = await sql`
    INSERT INTO bank_accounts (
      user_id, bank_name, account_name, account_number, is_primary, created_at, updated_at
    ) VALUES (
      ${memberId}, 'BCA', 'Demo Rekening', ${`5270${String(memberId).slice(0, 8)}`}, true, now(), now()
    )
    RETURNING id
  `;
  return inserted[0].id;
}

async function clearDemoTransactions(memberIds) {
  if (memberIds.length === 0) return;
  await sql`
    DELETE FROM withdrawals WHERE member_id IN ${sql(memberIds)}
  `;
  await sql`
    DELETE FROM deposits WHERE member_id IN ${sql(memberIds)}
  `;
}

async function insertDeposit(memberId, amount, createdAt) {
  await sql`
    INSERT INTO deposits (
      member_id, amount, status, created_at, updated_at, approved_at
    ) VALUES (
      ${memberId}, ${amount}, 'approved', ${createdAt}, ${createdAt}, ${createdAt}
    )
  `;
}

async function insertWithdrawal(memberId, bankAccountId, amount, createdAt) {
  await sql`
    INSERT INTO withdrawals (
      member_id, bank_account_id, amount, status, created_at, updated_at, processed_at
    ) VALUES (
      ${memberId}, ${bankAccountId}, ${amount}, 'completed', ${createdAt}, ${createdAt}, ${createdAt}
    )
  `;
}

try {
  console.log("[seed-staff] mulai...");

  const adminLeaderId = await lookupProfileId("adminleader");
  if (!adminLeaderId) {
    console.error(
      "[seed-staff] adminleader tidak ditemukan. Jalankan pnpm db:seed terlebih dahulu.",
    );
    process.exit(1);
  }

  // Leader kedua — hanya terlihat oleh super_admin di halaman Semua Staff
  const demoLeaderId = await ensureAuthUser({
    username: "demo_leader",
    password: DEFAULT_DEV_PASSWORD,
    role: "admin_leader",
  });
  await ensureProfile({
    userId: demoLeaderId,
    username: "demo_leader",
    role: "admin_leader",
    createdAt: daysAgo(120),
  });

  const staffSpecs = [
    {
      username: "demo_staff_1",
      referralCode: "DEMO001",
      leaderId: adminLeaderId,
      createdAt: daysAgo(90),
    },
    {
      username: "demo_staff_2",
      referralCode: "DEMO002",
      leaderId: adminLeaderId,
      createdAt: daysAgo(60),
    },
    {
      username: "demo_staff_3",
      referralCode: "DEMO003",
      leaderId: demoLeaderId,
      createdAt: daysAgo(45),
    },
  ];

  const staffIds = [];
  for (const spec of staffSpecs) {
    const userId = await ensureAuthUser({
      username: spec.username,
      password: DEFAULT_DEV_PASSWORD,
      role: "admin_staff",
    });
    await ensureProfile({
      userId,
      username: spec.username,
      role: "admin_staff",
      leaderId: spec.leaderId,
      referralCode: spec.referralCode,
      createdAt: spec.createdAt,
    });
    staffIds.push(userId);
  }

  const [staff1, staff2, staff3] = staffIds;

  const memberSpecs = [
    {
      username: "demo_member_a1",
      staffId: staff1,
      createdAt: lastMonthMid(),
      deposits: [
        { amount: "1000000", at: lastMonthMid() },
        { amount: "500000", at: daysAgo(3) },
      ],
      withdrawals: [
        { amount: "200000", at: lastMonthMid() },
        { amount: "150000", at: daysAgo(2) },
      ],
    },
    {
      username: "demo_member_a2",
      staffId: staff1,
      createdAt: daysAgo(10),
      deposits: [{ amount: "300000", at: daysAgo(5) }],
      withdrawals: [],
    },
    {
      username: "demo_member_b1",
      staffId: staff2,
      createdAt: daysAgo(40),
      deposits: [
        { amount: "750000", at: lastMonthMid() },
        { amount: "250000", at: daysAgo(7) },
      ],
      withdrawals: [{ amount: "100000", at: daysAgo(1) }],
    },
    {
      username: "demo_member_c1",
      staffId: staff3,
      createdAt: daysAgo(20),
      deposits: [{ amount: "400000", at: daysAgo(4) }],
      withdrawals: [{ amount: "50000", at: lastMonthMid() }],
    },
  ];

  const memberIds = [];
  for (const spec of memberSpecs) {
    const memberId = await ensureMember({
      username: spec.username,
      staffId: spec.staffId,
      createdAt: spec.createdAt,
    });
    memberIds.push(memberId);
  }

  await clearDemoTransactions(memberIds);

  for (const spec of memberSpecs) {
    const memberId = await lookupProfileId(spec.username);
    const bankId = await ensureBankAccount(memberId);

    for (const dep of spec.deposits) {
      await insertDeposit(memberId, dep.amount, dep.at);
    }
    for (const wd of spec.withdrawals) {
      await insertWithdrawal(memberId, bankId, wd.amount, wd.at);
    }
  }

  const thisMonth = toLocalISODate(daysAgo(3));
  const lastMonth = toLocalISODate(lastMonthMid());

  // Demo IP duplikat untuk halaman /admin/member-ip
  const duplicateIp = "203.0.113.50";
  await sql`
    UPDATE profiles
    SET registration_ip = ${duplicateIp}, last_seen_ip = ${duplicateIp}, updated_at = now()
    WHERE username IN ('demo_member_a1', 'demo_member_a2')
  `;
  await sql`
    UPDATE profiles
    SET registration_ip = '203.0.113.99', last_seen_ip = '203.0.113.99', updated_at = now()
    WHERE username IN ('member', 'rinasyah')
  `;

  console.log("[seed-staff] selesai.");
  console.log("[seed-staff] Login super_admin: superadmin / Password123");
  console.log("[seed-staff] Login admin_leader: adminleader / Password123");
  console.log(
    `[seed-staff] Coba filter Bulan Ini (${thisMonth}) vs Bulan Lalu (${lastMonth}) di /admin/staff`,
  );
} catch (error) {
  console.error("[seed-staff] gagal:", error);
  process.exitCode = 1;
} finally {
  await sql.end();
}
