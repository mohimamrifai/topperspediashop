import { eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { profiles, tasks } from "@/lib/db/schema";
import { formatRupiah } from "@/lib/format-rupiah";
import { LEVEL_LABEL, LEVEL_RATE_PERCENT } from "@/lib/levels";
import { getCurrentUser } from "@/lib/auth/session";

import { TaskPageHeader } from "./_components/task-page-header";
import { InfoBox } from "./_components/info-box";
import { MemberCard } from "./_components/member-card";
import { StatGrid } from "./_components/stat-grid";
import { TaskBalanceCard } from "./_components/balance-card";
import { CommissionTicker } from "./_components/commission-ticker";
import { StartTaskButton } from "./_components/start-task-button";
import { BottomNav } from "../_components/bottom-nav";

// Halaman menampilkan saldo (utama + beku) yang sensitif terhadap perubahan
// di server actions lain. Paksa dynamic agar tidak menampilkan nilai stale.
export const dynamic = "force-dynamic";

export default async function TaskPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="min-h-full bg-zinc-50 pb-28">
        <div className="mx-auto max-w-2xl px-4 pt-5 sm:px-6 sm:pt-6">
          <p className="text-sm text-zinc-600">Silakan login untuk melihat tugas.</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  const [profile] = await db
    .select({
      balance: profiles.balance,
      frozenBalance: profiles.frozenBalance,
      level: profiles.level,
    })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  const [statsRow] = await db
    .select({
      totalCommission: sql<string>`COALESCE(SUM(CASE WHEN ${tasks.status} = 'selesai' THEN ${tasks.commission} ELSE 0 END), 0)`,
      totalDone: sql<number>`COUNT(*) FILTER (WHERE ${tasks.status} = 'selesai')::int`,
    })
    .from(tasks)
    .where(eq(tasks.memberId, user.id));

  const balance = Number(profile?.balance ?? 0);
  const totalCommission = Number(statsRow?.totalCommission ?? 0);
  const totalDone = statsRow?.totalDone ?? 0;
  const level = profile?.level ?? "classic";
  const levelLabel = LEVEL_LABEL[level] ?? "Classic";
  const levelRate = LEVEL_RATE_PERCENT[level] ?? 20;

  return (
    <div className="min-h-full bg-zinc-50 pb-28">
      <div className="mx-auto max-w-2xl px-4 pt-5 sm:px-6 sm:pt-6">
        <TaskPageHeader />

        <TaskBalanceCard
          label="Saldo Akun"
          amount={formatRupiah(balance)}
          topUpHref="/recharge"
          withdrawHref="/withdraw"
        />

        <StatGrid
          stats={[
            { label: "Total Komisi", value: formatRupiah(totalCommission) },
            { label: "Saldo Beku", value: formatRupiah(profile?.frozenBalance ?? 0) },
            { label: "Pendanaan", value: formatRupiah(0) },
            { label: "Tugas Selesai", value: String(totalDone) },
          ]}
        />

        <MemberCard
          title={`${levelLabel} Member`}
          subtitle={`Komisi: ${levelRate}%`}
        />

        <StartTaskButton orderHref="/order" />

        <CommissionTicker />

        <InfoBox label="Info:">
          {" "}Setiap pesanan di dalam platform akan di kirimkan secara acak
          kepada akun kerja anggota. Cegah aktivitas ilegal seperti pencucian
          uang dan penarikan dana untuk tujuan buruk setelah di kirim. Pengguna
          harus menyelesaikan pekerjaan setelah data kerja di mulai. Dan tidak
          mungkin untuk membatalkan pekerjaan di tengah jalan. Jika tidak,
          sistem tidak akan mengizinkan penarikan.
        </InfoBox>
      </div>

      <BottomNav />
    </div>
  );
}
