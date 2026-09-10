import { and, asc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { db } from "@/lib/db";
import { deposits, profiles, withdrawals } from "@/lib/db/schema";
import { getMonthStart, parseLocalDateInput, toLocalISODate } from "@/lib/date-range";
import { getCurrentUser } from "@/lib/auth/session";

import { StaffsTable } from "./_components/staffs-table";
import { StaffDateRange } from "./_components/staff-date-range";

function getThisMonthRange(): {
  fromDate: Date;
  toDate: Date;
  from: string;
  to: string;
} {
  const now = new Date();
  const fromDate = getMonthStart(now);
  return {
    fromDate,
    toDate: now,
    from: toLocalISODate(fromDate),
    to: toLocalISODate(now),
  };
}

function formatDateID(d: Date): string {
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function AdminStaffsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  const [me] = await db
    .select({ id: profiles.id, role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  // Hanya super_admin & admin_leader yang boleh akses
  if (!me || (me.role !== "super_admin" && me.role !== "admin_leader")) {
    redirect("/admin/dashboard");
  }

  const isSuperAdmin = me.role === "super_admin";

  // 1. Tentukan rentang tanggal. Default = bulan ini.
  const params = await searchParams;
  const thisMonth = getThisMonthRange();
  let fromDate: Date | null = parseLocalDateInput(params.from ?? thisMonth.from);
  let toDate: Date | null = parseLocalDateInput(params.to ?? thisMonth.to, true);
  if (!fromDate) fromDate = thisMonth.fromDate;
  if (!toDate) toDate = thisMonth.toDate;
  if (fromDate > toDate) {
    fromDate = thisMonth.fromDate;
    toDate = thisMonth.toDate;
  }

  // 2. Tentukan scope staff:
  //  - super admin: semua staff
  //  - leader: staff dengan leader_id = leader.id
  const staffWhere = isSuperAdmin
    ? eq(profiles.role, "admin_staff")
    : and(eq(profiles.role, "admin_staff"), eq(profiles.leaderId, me.id));

  const staffRows = await db
    .select({
      id: profiles.id,
      username: profiles.username,
      referralCode: profiles.referralCode,
      status: profiles.status,
      createdAt: profiles.createdAt,
      leaderId: profiles.leaderId,
    })
    .from(profiles)
    .where(staffWhere)
    .orderBy(asc(profiles.username));

  const staffIds = staffRows.map((s) => s.id);

  // 3. Aggregate per staff dalam rentang tanggal yang dipilih.
  //    Total deposit & penarikan dihitung dari member yang referred oleh
  //    staff, dengan `created_at` di antara [fromDate, toDate].
  const statsByStaff = new Map<
    string,
    { memberCount: number; totalDeposit: string; totalWithdrawal: string }
  >();

  for (const s of staffRows) {
    statsByStaff.set(s.id, {
      memberCount: 0,
      totalDeposit: "0",
      totalWithdrawal: "0",
    });
  }

  if (staffIds.length > 0) {
    // Member count dalam rentang tanggal (member baru yang terdaftar di periode).
    const memberAgg = await db
      .select({
        staffId: profiles.referredBy,
        total: sql<number>`count(*)::int`,
      })
      .from(profiles)
      .where(
        and(
          inArray(profiles.referredBy, staffIds),
          eq(profiles.role, "member"),
          gte(profiles.createdAt, fromDate),
          lte(profiles.createdAt, toDate),
        ),
      )
      .groupBy(profiles.referredBy);

    for (const r of memberAgg) {
      if (!r.staffId) continue;
      const cur = statsByStaff.get(r.staffId);
      if (cur) cur.memberCount = Number(r.total);
    }

    // Deposit approved per staff, filtered by date range
    const depAgg = await db
      .select({
        staffId: profiles.referredBy,
        total: sql<string>`coalesce(sum(${deposits.amount}), 0)::text`,
      })
      .from(deposits)
      .innerJoin(profiles, eq(profiles.id, deposits.memberId))
      .where(
        and(
          inArray(profiles.referredBy, staffIds),
          eq(deposits.status, "approved"),
          gte(deposits.createdAt, fromDate),
          lte(deposits.createdAt, toDate),
        ),
      )
      .groupBy(profiles.referredBy);

    for (const r of depAgg) {
      if (!r.staffId) continue;
      const cur = statsByStaff.get(r.staffId);
      if (cur) cur.totalDeposit = r.total;
    }

    // Withdrawal completed per staff, filtered by date range
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
          gte(withdrawals.createdAt, fromDate),
          lte(withdrawals.createdAt, toDate),
        ),
      )
      .groupBy(profiles.referredBy);

    for (const r of wdAgg) {
      if (!r.staffId) continue;
      const cur = statsByStaff.get(r.staffId);
      if (cur) cur.totalWithdrawal = r.total;
    }
  }

  // Ambil leader usernames untuk ditampilkan di kolom Leader
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

  const periodLabel = `${formatDateID(fromDate)} – ${formatDateID(toDate)}`;

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-4 sm:space-y-5 sm:py-5">
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/60 sm:p-5">
        <h1 className="text-base font-bold text-zinc-900 sm:text-lg">
          Semua Staff
        </h1>
        <p className="mt-1 text-[11px] text-zinc-600 sm:text-xs">
          {isSuperAdmin
            ? "Daftar seluruh Admin Staff beserta ringkasan pencapaian anggota mereka. Klik username untuk melihat detail per bulan."
            : "Daftar staff di bawah Anda beserta ringkasan pencapaian anggota mereka. Klik username untuk melihat detail per bulan."}
        </p>
      </div>

      <Suspense
        fallback={
          <div className="rounded-xl bg-white p-4 text-xs text-zinc-500 shadow-sm ring-1 ring-zinc-200/60 sm:text-sm">
            Memuat filter periode...
          </div>
        }
      >
        <StaffDateRange />
      </Suspense>

      <StaffsTable
        staffs={staffRows.map((r) => {
          const s = statsByStaff.get(r.id)!;
          return {
            id: r.id,
            username: r.username,
            referralCode: r.referralCode,
            status: r.status,
            createdAt: r.createdAt.toISOString(),
            memberCount: s.memberCount,
            totalDeposit: s.totalDeposit,
            totalWithdrawal: s.totalWithdrawal,
            leaderUsername: r.leaderId
              ? leaderNameById.get(r.leaderId) ?? null
              : null,
          };
        })}
        periodLabel={periodLabel}
      />
    </div>
  );
}
