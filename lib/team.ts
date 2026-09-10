/**
 * Helper untuk query aggregate data per tim.
 *
 * - `getStaffUnderLeader(leaderId)` → list admin_staff yang leader_id = leaderId
 * - `getLeaderOfStaff(staffId)` → admin_leader yang menaungi staff
 * - `getTeamStats(leaderId)` → ringkasan (jumlah staff, jumlah member, total deposit, dll)
 */

import { and, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { deposits, profiles, withdrawals } from "@/lib/db/schema";
import { getMonthStart, parseLocalDateInput, toLocalISODate } from "@/lib/date-range";

// ===== Staff di bawah leader =====

export async function getStaffUnderLeader(leaderId: string) {
  return db
    .select({
      id: profiles.id,
      username: profiles.username,
      referralCode: profiles.referralCode,
      status: profiles.status,
      createdAt: profiles.createdAt,
    })
    .from(profiles)
    .where(and(eq(profiles.leaderId, leaderId), eq(profiles.role, "admin_staff")))
    .orderBy(profiles.username);
}

export async function getLeaderOfStaff(staffId: string) {
  const [row] = await db
    .select({
      id: profiles.id,
      username: profiles.username,
    })
    .from(profiles)
    .innerJoin(
      sql`profiles AS leader`,
      sql`leader.id = ${profiles.leaderId}`,
    )
    .where(eq(profiles.id, staffId))
    .limit(1);
  return row;
}

// ===== Stats aggregate =====

export type TeamStats = {
  staffCount: number;
  memberCount: number;
  totalDepositApproved: string;
  totalWithdrawalCompleted: string;
};

/**
 * Hitung statistik aggregate untuk scope:
 * - leader : aggregate dari staff + member di bawahnya
 * - staff  : langsung (member referral + transaksi mereka)
 */
export async function getTeamStatsForLeader(leaderId: string): Promise<TeamStats> {
  const staffRows = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(and(eq(profiles.leaderId, leaderId), eq(profiles.role, "admin_staff")));
  const staffIds = staffRows.map((s) => s.id);

  if (staffIds.length === 0) {
    return {
      staffCount: 0,
      memberCount: 0,
      totalDepositApproved: "0",
      totalWithdrawalCompleted: "0",
    };
  }

  const memberRows = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(inArray(profiles.referredBy, staffIds));
  const memberIds = memberRows.map((m) => m.id);

  if (memberIds.length === 0) {
    return {
      staffCount: staffIds.length,
      memberCount: 0,
      totalDepositApproved: "0",
      totalWithdrawalCompleted: "0",
    };
  }

  const [depAgg] = await db
    .select({
      total: sql<string>`coalesce(sum(${deposits.amount}), 0)::text`,
    })
    .from(deposits)
    .where(
      and(
        inArray(deposits.memberId, memberIds),
        eq(deposits.status, "approved"),
      ),
    );

  const [wdAgg] = await db
    .select({
      total: sql<string>`coalesce(sum(${withdrawals.amount}), 0)::text`,
    })
    .from(withdrawals)
    .where(
      and(
        inArray(withdrawals.memberId, memberIds),
        eq(withdrawals.status, "completed"),
      ),
    );

  return {
    staffCount: staffIds.length,
    memberCount: memberIds.length,
    totalDepositApproved: depAgg?.total ?? "0",
    totalWithdrawalCompleted: wdAgg?.total ?? "0",
  };
}

/**
 * Hitung statistik langsung untuk satu staff (member yang dia referensikan).
 */
export async function getStaffStats(staffId: string): Promise<TeamStats> {
  const memberRows = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.referredBy, staffId));
  const memberIds = memberRows.map((m) => m.id);

  if (memberIds.length === 0) {
    return {
      staffCount: 0,
      memberCount: 0,
      totalDepositApproved: "0",
      totalWithdrawalCompleted: "0",
    };
  }

  const [depAgg] = await db
    .select({
      total: sql<string>`coalesce(sum(${deposits.amount}), 0)::text`,
    })
    .from(deposits)
    .where(
      and(
        inArray(deposits.memberId, memberIds),
        eq(deposits.status, "approved"),
      ),
    );

  const [wdAgg] = await db
    .select({
      total: sql<string>`coalesce(sum(${withdrawals.amount}), 0)::text`,
    })
    .from(withdrawals)
    .where(
      and(
        inArray(withdrawals.memberId, memberIds),
        eq(withdrawals.status, "completed"),
      ),
    );

  return {
    staffCount: 0,
    memberCount: memberIds.length,
    totalDepositApproved: depAgg?.total ?? "0",
    totalWithdrawalCompleted: wdAgg?.total ?? "0",
  };
}

// ===== Per-bulan stats untuk detail staff =====

export type StaffMonthlyPoint = {
  /** YYYY-MM-01 ISO date string */
  month: string;
  depositCount: number;
  depositAmount: string;
  withdrawalCount: number;
  withdrawalAmount: string;
  /** Jumlah member baru yang di-refer pada bulan tersebut */
  newMemberCount: number;
};

export type StaffDetailStats = {
  staffId: string;
  totalMembers: number;
  totalDepositApproved: string;
  totalWithdrawalCompleted: string;
  /** Ringkasan per bulan (12 bulan terakhir atau sesuai filter). */
  monthly: StaffMonthlyPoint[];
};

/**
 * Ambil stats detail per staff dengan breakdown per bulan.
 * Filter `range` opsional: `{ from, to }` ISO date string (inclusive).
 */
export async function getStaffDetailStats(
  staffId: string,
  range?: { from?: string; to?: string },
): Promise<StaffDetailStats> {
  const memberRows = await db
    .select({
      id: profiles.id,
      createdAt: profiles.createdAt,
    })
    .from(profiles)
    .where(eq(profiles.referredBy, staffId));
  const memberIds = memberRows.map((m) => m.id);

  let totalDep = "0";
  let totalWd = "0";

  if (memberIds.length > 0) {
    const [depAgg] = await db
      .select({
        total: sql<string>`coalesce(sum(${deposits.amount}), 0)::text`,
      })
      .from(deposits)
      .where(
        and(
          inArray(deposits.memberId, memberIds),
          eq(deposits.status, "approved"),
        ),
      );
    totalDep = depAgg?.total ?? "0";

    const [wdAgg] = await db
      .select({
        total: sql<string>`coalesce(sum(${withdrawals.amount}), 0)::text`,
      })
      .from(withdrawals)
      .where(
        and(
          inArray(withdrawals.memberId, memberIds),
          eq(withdrawals.status, "completed"),
        ),
      );
    totalWd = wdAgg?.total ?? "0";
  }

  // Tentukan range 12 bulan terakhir (atau sesuai filter)
  const now = new Date();
  const fromDefault = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const fromDate = parseLocalDateInput(range?.from) ?? fromDefault;
  const toDate = parseLocalDateInput(range?.to, true) ?? now;

  // Normalize to date-only (no time)
  const fromStr = toLocalISODate(fromDate);
  const toStr = toLocalISODate(toDate);

  // Hitung semua bulan dalam range
  const months: string[] = [];
  const cursor = getMonthStart(fromDate);
  const end = getMonthStart(toDate);
  while (cursor <= end) {
    months.push(toLocalISODate(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }

  // Aggregate deposits by month
  const monthly: StaffMonthlyPoint[] = months.map((m) => ({
    month: m,
    depositCount: 0,
    depositAmount: "0",
    withdrawalCount: 0,
    withdrawalAmount: "0",
    newMemberCount: 0,
  }));

  if (memberIds.length > 0) {
    const depByMonth = await db
      .select({
        month: sql<string>`to_char(date_trunc('month', ${deposits.createdAt}), 'YYYY-MM-DD')`,
        count: sql<number>`count(*)::int`,
        total: sql<string>`coalesce(sum(${deposits.amount}), 0)::text`,
      })
      .from(deposits)
      .where(
        and(
          inArray(deposits.memberId, memberIds),
          eq(deposits.status, "approved"),
          sql`${deposits.createdAt} >= ${fromStr}::date`,
          sql`${deposits.createdAt} <= (${toStr}::date + interval '1 day')`,
        ),
      )
      .groupBy(sql`date_trunc('month', ${deposits.createdAt})`);

    for (const row of depByMonth) {
      const idx = monthly.findIndex((m) => m.month === row.month);
      if (idx >= 0) {
        monthly[idx].depositCount = Number(row.count);
        monthly[idx].depositAmount = row.total;
      }
    }

    const wdByMonth = await db
      .select({
        month: sql<string>`to_char(date_trunc('month', ${withdrawals.createdAt}), 'YYYY-MM-DD')`,
        count: sql<number>`count(*)::int`,
        total: sql<string>`coalesce(sum(${withdrawals.amount}), 0)::text`,
      })
      .from(withdrawals)
      .where(
        and(
          inArray(withdrawals.memberId, memberIds),
          eq(withdrawals.status, "completed"),
          sql`${withdrawals.createdAt} >= ${fromStr}::date`,
          sql`${withdrawals.createdAt} <= (${toStr}::date + interval '1 day')`,
        ),
      )
      .groupBy(sql`date_trunc('month', ${withdrawals.createdAt})`);

    for (const row of wdByMonth) {
      const idx = monthly.findIndex((m) => m.month === row.month);
      if (idx >= 0) {
        monthly[idx].withdrawalCount = Number(row.count);
        monthly[idx].withdrawalAmount = row.total;
      }
    }
  }

  // New member per bulan
  for (const m of memberRows) {
    const created = m.createdAt instanceof Date ? m.createdAt : new Date(m.createdAt);
    const monthStr = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, "0")}-01`;
    const idx = monthly.findIndex((mm) => mm.month === monthStr);
    if (idx >= 0) monthly[idx].newMemberCount += 1;
  }

  return {
    staffId,
    totalMembers: memberIds.length,
    totalDepositApproved: totalDep,
    totalWithdrawalCompleted: totalWd,
    monthly,
  };
}

// ===== Commission summary per staff =====

export type StaffCommissionRow = {
  staffId: string;
  username: string;
  referralCode: string | null;
  leaderUsername: string | null;
  commissionRate: string | null;
  totalDeposit: string;
  totalWithdrawal: string;
};

/**
 * Ambil ringkasan data untuk halaman komisi:
 *  - Total deposit approved per staff
 *  - Total withdrawal completed per staff
 *  - Rate komisi (dari profile)
 */
export async function getStaffCommissionSummary(
  scope: "all" | "under_leader",
  leaderId?: string,
): Promise<StaffCommissionRow[]> {
  const where =
    scope === "all"
      ? eq(profiles.role, "admin_staff")
      : and(eq(profiles.role, "admin_staff"), eq(profiles.leaderId, leaderId!));

  const staffRows = await db
    .select({
      id: profiles.id,
      username: profiles.username,
      referralCode: profiles.referralCode,
      leaderId: profiles.leaderId,
      commissionRate: profiles.commissionRate,
    })
    .from(profiles)
    .where(where)
    .orderBy(profiles.username);

  if (staffRows.length === 0) return [];

  const staffIds = staffRows.map((s) => s.id);

  // Aggregate deposit per staff
  const depAgg = await db
    .select({
      staffId: profiles.referredBy,
      total: sql<string>`coalesce(sum(${deposits.amount}), 0)::text`,
    })
    .from(deposits)
    .innerJoin(profiles, eq(profiles.id, deposits.memberId))
    .where(
      and(inArray(profiles.referredBy, staffIds), eq(deposits.status, "approved")),
    )
    .groupBy(profiles.referredBy);

  const depByStaff = new Map<string, string>();
  for (const r of depAgg) {
    if (r.staffId) depByStaff.set(r.staffId, r.total);
  }

  // Aggregate withdrawal per staff
  const wdAgg = await db
    .select({
      staffId: profiles.referredBy,
      total: sql<string>`coalesce(sum(${withdrawals.amount}), 0)::text`,
    })
    .from(withdrawals)
    .innerJoin(profiles, eq(profiles.id, withdrawals.memberId))
    .where(
      and(
        inArray(profiles.referredBy, staffIds),
        eq(withdrawals.status, "completed"),
      ),
    )
    .groupBy(profiles.referredBy);

  const wdByStaff = new Map<string, string>();
  for (const r of wdAgg) {
    if (r.staffId) wdByStaff.set(r.staffId, r.total);
  }

  // Map leader usernames
  const leaderIds = Array.from(
    new Set(staffRows.map((s) => s.leaderId).filter((x): x is string => !!x)),
  );
  const leaderNameById = new Map<string, string>();
  if (leaderIds.length > 0) {
    const leaderRows = await db
      .select({ id: profiles.id, username: profiles.username })
      .from(profiles)
      .where(inArray(profiles.id, leaderIds));
    for (const l of leaderRows) leaderNameById.set(l.id, l.username);
  }

  return staffRows.map((s) => ({
    staffId: s.id,
    username: s.username,
    referralCode: s.referralCode,
    leaderUsername: s.leaderId ? leaderNameById.get(s.leaderId) ?? null : null,
    commissionRate: s.commissionRate,
    totalDeposit: depByStaff.get(s.id) ?? "0",
    totalWithdrawal: wdByStaff.get(s.id) ?? "0",
  }));
}
