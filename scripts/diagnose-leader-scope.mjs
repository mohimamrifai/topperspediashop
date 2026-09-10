// scripts/diagnose-leader-scope.mjs
//
// Script diagnostik ONE-OFF (tidak untuk di-commit) untuk inspeksi data VPS
// setelah migrasi dari Supabase. Output JSON agar mudah di-paste ke chat.
//
// Jalankan:
//   node scripts/diagnose-leader-scope.mjs
//
// Bagian yang diinspeksi:
//   1) Daftar admin (super_admin, admin_leader, admin_staff) + access_overrides
//   2) Aggregasi member per leader (direct referred_by + via staff)
//   3) Aggregasi member per staff
//   4) Member tanpa referred_by (orphan)
//   5) Distribusi status deposit 30 hari terakhir

import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });
config({ path: ".env" });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = postgres(url, { prepare: false, max: 1, search_path: "public" });

try {
  const result = {};

  // 1) Admin accounts
  result.admins = await sql`
    SELECT id, username, role, leader_id, access_overrides
    FROM profiles
    WHERE role IN ('super_admin', 'admin_leader', 'admin_staff')
    ORDER BY role, username
  `;

  // 2) Member aggregation per leader
  result.leaderAggregate = await sql`
    SELECT
      l.id AS leader_id,
      l.username AS leader_username,
      COUNT(DISTINCT m_direct.id) AS direct_member_count,
      COUNT(DISTINCT m_staff.id) AS via_staff_member_count
    FROM profiles l
    LEFT JOIN profiles s
      ON s.leader_id = l.id AND s.role = 'admin_staff'
    LEFT JOIN profiles m_staff
      ON m_staff.referred_by = s.id AND m_staff.role = 'member'
    LEFT JOIN profiles m_direct
      ON m_direct.referred_by = l.id AND m_direct.role = 'member'
    WHERE l.role = 'admin_leader'
    GROUP BY l.id, l.username
    ORDER BY l.username
  `;

  // 3) Member aggregation per staff
  result.staffAggregate = await sql`
    SELECT
      s.id AS staff_id,
      s.username AS staff_username,
      s.leader_id,
      l.username AS leader_username,
      COUNT(m.id) AS member_count
    FROM profiles s
    LEFT JOIN profiles l ON l.id = s.leader_id
    LEFT JOIN profiles m
      ON m.referred_by = s.id AND m.role = 'member'
    WHERE s.role = 'admin_staff'
    GROUP BY s.id, s.username, s.leader_id, l.username
    ORDER BY s.username
  `;

  // 4) Orphan members (no referred_by)
  result.orphanMembers = await sql`
    SELECT role, COUNT(*) AS total,
           COUNT(*) FILTER (WHERE referred_by IS NULL) AS no_referrer
    FROM profiles
    GROUP BY role
    ORDER BY role
  `;

  // 5) Deposit status distribution (last 30 days)
  result.depositStatus = await sql`
    SELECT status, COUNT(*) AS count
    FROM deposits
    WHERE created_at > NOW() - INTERVAL '30 days'
    GROUP BY status
    ORDER BY count DESC
  `;

  // 6) Sample deposits untuk cek pattern "depo awal 3x"
  result.depositSample = await sql`
    SELECT
      member_id,
      status,
      amount,
      created_at
    FROM deposits
    WHERE created_at > NOW() - INTERVAL '30 days'
    ORDER BY member_id, created_at DESC
    LIMIT 30
  `;

  console.log(JSON.stringify(result, null, 2));
} catch (err) {
  console.error("[diagnose] gagal:", err);
  process.exitCode = 1;
} finally {
  await sql.end();
}
