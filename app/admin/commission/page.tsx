import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { getStaffCommissionSummary } from "@/lib/team";

import Link from "next/link";

import { CommissionTable } from "./_components/commission-table";

export default async function AdminCommissionPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  const [me] = await db
    .select({ id: profiles.id, role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (!me || (me.role !== "super_admin" && me.role !== "admin_leader")) {
    redirect("/admin/dashboard");
  }

  const isSuperAdmin = me.role === "super_admin";

  const rows = await getStaffCommissionSummary(
    isSuperAdmin ? "all" : "under_leader",
    isSuperAdmin ? undefined : me.id,
  );

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-4 sm:space-y-5 sm:py-5">
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/60 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-base font-bold text-zinc-900 sm:text-lg">
              Menu Komisi
            </h1>
            <p className="mt-1 text-[11px] text-zinc-600 sm:text-xs">
              {isSuperAdmin
                ? "Kelola rate komisi per staff dan persentase komisi per level. Rate menentukan persentase profit yang dibagikan ke staff dari transaksi anggota referensinya."
                : "Lihat ringkasan komisi per staff di bawah Anda. Pengaturan rate hanya dapat dilakukan oleh Super Admin."}
            </p>
          </div>
          {isSuperAdmin && (
            <Link
              href="/admin/commission/settings"
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 sm:text-sm"
            >
              Pengaturan Komisi (per Level)
            </Link>
          )}
        </div>
      </div>

      <CommissionTable
        initialRows={rows.map((r) => ({
          staffId: r.staffId,
          username: r.username,
          referralCode: r.referralCode,
          leaderUsername: r.leaderUsername,
          commissionRate: r.commissionRate,
          totalDeposit: r.totalDeposit,
          totalWithdrawal: r.totalWithdrawal,
        }))}
        isCurrentSuperAdmin={isSuperAdmin}
      />
    </div>
  );
}
