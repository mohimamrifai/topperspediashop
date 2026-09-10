import { desc, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { bankAccounts, profiles } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { isWithdrawLocked } from "@/lib/access";

import { BottomNav } from "../_components/bottom-nav";
import { WithdrawContent } from "./_components/withdraw-content";

export default async function WithdrawPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="flex min-h-full items-center justify-center bg-zinc-50 p-4 text-sm text-zinc-600">
        Memuat...
      </div>
    );
  }

  const [profile, banks] = await Promise.all([
    db
      .select({
        username: profiles.username,
        balance: profiles.balance,
        frozenBalance: profiles.frozenBalance,
        status: profiles.status,
        withdrawLockReason: profiles.withdrawLockReason,
      })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1)
      .then((r) => r[0]),
    db
      .select({
        id: bankAccounts.id,
        bankName: bankAccounts.bankName,
        accountName: bankAccounts.accountName,
        accountNumber: bankAccounts.accountNumber,
        isPrimary: bankAccounts.isPrimary,
      })
      .from(bankAccounts)
      .where(eq(bankAccounts.userId, user.id))
      .orderBy(
        sql`${bankAccounts.isPrimary} DESC`,
        desc(bankAccounts.createdAt),
      ),
  ]);

  const isLocked = isWithdrawLocked(profile);
  const lockReason =
    isLocked && profile?.withdrawLockReason
      ? profile.withdrawLockReason
      : null;

  return (
    <div className="min-h-full bg-zinc-50 pb-24">
      <header className="sticky top-0 z-30 bg-emerald-600 text-white shadow-sm">
        <h1 className="mx-auto max-w-2xl px-4 py-3 text-center text-sm font-bold sm:px-6 sm:py-3.5 sm:text-base">
          Penarikan Saldo
        </h1>
      </header>

      <div className="mx-auto max-w-2xl space-y-3 px-4 py-4 sm:px-6 sm:py-5">
        <WithdrawContent
          username={profile?.username ?? "Pengguna"}
          balance={profile?.balance ?? "0"}
          frozenBalance={profile?.frozenBalance ?? "0"}
          banks={banks}
          isWithdrawLocked={isLocked}
          withdrawLockReason={lockReason}
        />
      </div>

      <BottomNav />
    </div>
  );
}
