import { and, eq, gte, inArray, lte, sql, type SQL } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";

import { db } from "@/lib/db";
import { deposits, profiles, withdrawals } from "@/lib/db/schema";
import { parseLocalDateInput } from "@/lib/date-range";
import type { Scope } from "@/lib/access";

export type DateRange = {
  from: Date;
  to: Date;
};

export type DashboardStats = {
  totalMembers: number;
  rangeRegistrations: number;
  /**
   * Jumlah member UNIK yang punya deposit `approved` dalam range.
   * Reject tidak dihitung; 1 member yang deposit berkali-kali tetap dihitung 1.
   */
  rangeDepositRequests: number;
  rangeDepositAmount: number;
  rangeWithdrawalAmount: number;
  rangeProfit: number;
  totalDepositAmount: number;
  totalWithdrawalAmount: number;
};

const EMPTY_STATS: DashboardStats = {
  totalMembers: 0,
  rangeRegistrations: 0,
  rangeDepositRequests: 0,
  rangeDepositAmount: 0,
  rangeWithdrawalAmount: 0,
  rangeProfit: 0,
  totalDepositAmount: 0,
  totalWithdrawalAmount: 0,
};

function getTodayRange(): DateRange {
  const from = new Date();
  from.setHours(0, 0, 0, 0);

  const to = new Date();
  to.setHours(23, 59, 59, 999);

  return { from, to };
}

export function parseDateRange(
  from: string | undefined,
  to: string | undefined,
): DateRange | null {
  if (!from || !to) return null;
  const fromDate = parseLocalDateInput(from);
  const toDate = parseLocalDateInput(to, true);
  if (!fromDate || !toDate) return null;
  if (fromDate > toDate) return null;
  return { from: fromDate, to: toDate };
}

// Filter helper: jika admin punya scope terbatas, tambahkan inArray(memberId, ...).
// Kalau unrestricted (super_admin) atau scope null, return undefined (no filter).
function scopeFilter(
  scope: Scope | null,
  col: AnyPgColumn,
): SQL | undefined {
  if (!scope || scope.unrestricted) return undefined;
  if (scope.memberIds === null) return undefined; // safety
  return inArray(col, scope.memberIds);
}

/**
 * Ambil statistik dashboard dengan filter sesuai scope admin.
 *
 * - super_admin / scope.unrestricted: global (semua member)
 * - admin_leader: hanya member yang ada di staff-staf di bawahnya
 * - admin_staff: hanya member yang ia referensikan langsung
 *
 * `totalMembers` dihitung sebagai jumlah member dalam scope (bukan global),
 * supaya tiap admin lihat angka yang relevan dengan akunnya.
 */
export async function getDashboardStats(
  range: DateRange | null,
  scope: Scope | null,
): Promise<DashboardStats> {
  // Jika scope dibatasi tapi tidak ada member sama sekali → langsung nol.
  if (scope && !scope.unrestricted && scope.memberIds !== null) {
    if (scope.memberIds.length === 0) {
      return { ...EMPTY_STATS };
    }
  }

  const memberFilter = scopeFilter(scope, profiles.id);
  const depositMemberFilter = scopeFilter(scope, deposits.memberId);
  const withdrawalMemberFilter = scopeFilter(scope, withdrawals.memberId);
  const activityRange = range ?? getTodayRange();

  const inRange = (col: AnyPgColumn): SQL | undefined =>
    and(gte(col, activityRange.from), lte(col, activityRange.to));
  const profileRangeCondition = inRange(profiles.createdAt) ?? sql`false`;
  // Filter "Depo Awal": hanya deposit `approved` (reject di-skip) dan
  // dihitung per-member unik (1 member yang deposit 3x tetap 1).
  const depositRangeCondition = and(
    inRange(deposits.createdAt),
    depositMemberFilter,
    eq(deposits.status, "approved"),
  ) ?? sql`false`;
  const approvedDepositRangeCondition = and(
    eq(deposits.status, "approved"),
    inRange(deposits.createdAt),
    depositMemberFilter,
  ) ?? sql`false`;
  const approvedDepositTotalCondition = and(
    eq(deposits.status, "approved"),
    range ? inRange(deposits.createdAt) : undefined,
    depositMemberFilter,
  ) ?? sql`false`;
  const completedWithdrawalRangeCondition = and(
    eq(withdrawals.status, "completed"),
    inRange(withdrawals.createdAt),
    withdrawalMemberFilter,
  ) ?? sql`false`;
  const completedWithdrawalTotalCondition = and(
    eq(withdrawals.status, "completed"),
    range ? inRange(withdrawals.createdAt) : undefined,
    withdrawalMemberFilter,
  ) ?? sql`false`;

  const [memberAggRows, depositAggRows, withdrawalAggRows] = await Promise.all([
    db
      .select({
        totalMembers: sql<number>`COUNT(*)::int`,
        rangeRegistrations: sql<number>`COUNT(*) FILTER (WHERE ${profileRangeCondition})::int`,
      })
      .from(profiles)
      .where(and(eq(profiles.role, "member"), memberFilter)),
    db
      .select({
        rangeDepositRequests: sql<number>`COUNT(DISTINCT ${deposits.memberId}) FILTER (WHERE ${depositRangeCondition})::int`,
        rangeDepositAmount: sql<string>`COALESCE(SUM(${deposits.amount}) FILTER (WHERE ${approvedDepositRangeCondition}), 0)`,
        totalDepositAmount: sql<string>`COALESCE(SUM(${deposits.amount}) FILTER (WHERE ${approvedDepositTotalCondition}), 0)`,
      })
      .from(deposits),
    db
      .select({
        rangeWithdrawalAmount: sql<string>`COALESCE(SUM(${withdrawals.amount}) FILTER (WHERE ${completedWithdrawalRangeCondition}), 0)`,
        totalWithdrawalAmount: sql<string>`COALESCE(SUM(${withdrawals.amount}) FILTER (WHERE ${completedWithdrawalTotalCondition}), 0)`,
      })
      .from(withdrawals),
  ]);

  const memberAgg = memberAggRows[0];
  const depositAgg = depositAggRows[0];
  const withdrawalAgg = withdrawalAggRows[0];

  const totalMembers = memberAgg?.totalMembers ?? 0;
  const rangeDeposit = Number(depositAgg?.rangeDepositAmount ?? 0);
  const rangeWithdrawal = Number(withdrawalAgg?.rangeWithdrawalAmount ?? 0);
  return {
    totalMembers,
    rangeRegistrations: memberAgg?.rangeRegistrations ?? 0,
    rangeDepositRequests: depositAgg?.rangeDepositRequests ?? 0,
    rangeDepositAmount: rangeDeposit,
    rangeWithdrawalAmount: rangeWithdrawal,
    rangeProfit: Math.max(0, rangeDeposit - rangeWithdrawal),
    totalDepositAmount: Number(depositAgg?.totalDepositAmount ?? 0),
    totalWithdrawalAmount: Number(withdrawalAgg?.totalWithdrawalAmount ?? 0),
  };
}
