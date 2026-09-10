import { DashboardDateRange } from "./_components/dashboard-date-range";
import { PeriodCard } from "./_components/period-card";
import { StatCard } from "./_components/stat-card";
import { getDashboardStats, parseDateRange } from "@/lib/dashboard";
import { formatRupiah } from "@/lib/format-rupiah";
import { getScope } from "@/lib/access";
import { getCurrentUser } from "@/lib/auth/session";

type SearchParams = Promise<{ from?: string; to?: string }>;

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const range = parseDateRange(params.from, params.to);

  // Ambil scope admin yang login agar tiap akun lihat angkanya sendiri.
  const user = await getCurrentUser();
  const scope = user ? await getScope(user.id) : null;

  const stats = await getDashboardStats(range, scope);

  const periodLabel = range ? "Periode Dipilih" : "Sepanjang Waktu";
  const periodLabelToday = range ? "Periode Dipilih" : "Hari Ini";

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-4 sm:space-y-5 sm:py-5">
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/60 sm:p-5">
        <h1 className="text-base font-bold text-zinc-900 sm:text-lg">
          Dashboard
        </h1>
      </div>

      <DashboardDateRange />

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6">
        <StatCard
          label="Total Member"
          value={stats.totalMembers.toLocaleString("id-ID")}
          variant="indigo"
        />
        <StatCard
          label={`Pendaftaran (${periodLabelToday})`}
          value={stats.rangeRegistrations.toLocaleString("id-ID")}
          variant="amber"
        />
        <StatCard
          label={`Depo Awal (${periodLabelToday})`}
          value={stats.rangeDepositRequests.toLocaleString("id-ID")}
          variant="emerald"
        />
        <StatCard
          label={`Deposit (${periodLabelToday})`}
          value={formatRupiah(stats.rangeDepositAmount)}
          variant="blue"
        />
        <StatCard
          label={`Penarikan (${periodLabelToday})`}
          value={formatRupiah(stats.rangeWithdrawalAmount)}
          variant="rose"
        />
        <StatCard
          label={`Profit (${periodLabelToday})`}
          value={formatRupiah(stats.rangeProfit)}
          variant="emerald"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
        <PeriodCard
          title={`Total Isi Ulang (${periodLabel})`}
          amount={formatRupiah(stats.totalDepositAmount)}
          variant="blue"
        />
        <PeriodCard
          title={`Total Penarikan (${periodLabel})`}
          amount={formatRupiah(stats.totalWithdrawalAmount)}
          variant="red"
        />
      </div>
    </div>
  );
}
