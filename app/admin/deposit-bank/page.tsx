import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { getScope } from "@/lib/access";
import { db } from "@/lib/db";
import { depositBankAccounts, profiles } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

import { DepositBankTable } from "./_components/deposit-bank-table";

export default async function AdminDepositBankPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  const [me] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);
  if (!me || me.role === "member") redirect("/admin/login");

  // Super admin selalu boleh akses. Admin leader butuh override `depositBankCrud`.
  if (me.role === "admin_staff") redirect("/admin/dashboard");
  if (me.role === "admin_leader") {
    const scope = await getScope(user.id);
    if (scope?.overrides.depositBankCrud !== true) {
      redirect("/admin/dashboard");
    }
  }

  const scope = await getScope(user.id);
  if (!scope) redirect("/admin/login");

  // Query rekening dengan join ke profiles untuk nama leader.
  // Super admin: semua rekening.
  // Leader: hanya rekening tim-nya (leader_id = actor.id) — rekening global (NULL)
  // TIDAK ditampilkan di halaman leader.
  const where =
    scope.role === "super_admin"
      ? undefined
      : eq(depositBankAccounts.leaderId, scope.actorId);

  const baseQuery = db
    .select({
      id: depositBankAccounts.id,
      bankName: depositBankAccounts.bankName,
      accountName: depositBankAccounts.accountName,
      accountNumber: depositBankAccounts.accountNumber,
      notes: depositBankAccounts.notes,
      isActive: depositBankAccounts.isActive,
      leaderId: depositBankAccounts.leaderId,
      leaderUsername: profiles.username,
    })
    .from(depositBankAccounts)
    .leftJoin(profiles, eq(profiles.id, depositBankAccounts.leaderId))
    .orderBy(desc(depositBankAccounts.createdAt));

  const rows = where ? await baseQuery.where(where) : await baseQuery;

  // Untuk super admin, ambil daftar leader untuk dropdown "Untuk Tim" di form.
  let leaderOptions: { id: string; username: string }[] = [];
  if (scope.role === "super_admin") {
    const leaders = await db
      .select({ id: profiles.id, username: profiles.username })
      .from(profiles)
      .where(eq(profiles.role, "admin_leader"))
      .orderBy(profiles.username);
    leaderOptions = leaders;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-4 sm:space-y-5 sm:py-5">
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/60 sm:p-5">
        <h1 className="text-base font-bold text-zinc-900 sm:text-lg">
          Rekening Tujuan Deposit
        </h1>
        <p className="mt-1 text-[11px] text-zinc-600 sm:text-xs">
          {scope.role === "super_admin"
            ? "Daftar rekening yang ditampilkan ke member. Setiap leader bisa punya rekening sendiri-sendiri, atau gunakan rekening global untuk semua."
            : "Daftar rekening untuk tim Anda. Hanya rekening untuk tim ini yang ditampilkan."}
        </p>
      </div>

      <DepositBankTable
        initialAccounts={rows.map((r) => ({
          id: r.id,
          bankName: r.bankName,
          accountName: r.accountName,
          accountNumber: r.accountNumber,
          notes: r.notes,
          isActive: r.isActive,
          leaderId: r.leaderId,
          leaderUsername: r.leaderUsername,
        }))}
        actorRole={scope.role}
        leaderOptions={leaderOptions}
        currentLeaderUsername={
          scope.role === "admin_leader"
            ? leaderOptions.find((l) => l.id === scope.actorId)?.username ?? null
            : null
        }
      />
    </div>
  );
}
