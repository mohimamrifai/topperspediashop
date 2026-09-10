import { and, desc, eq, isNull, or } from "drizzle-orm";
import { redirect } from "next/navigation";

import { BottomNav } from "../_components/bottom-nav";
import { db } from "@/lib/db";
import { depositBankAccounts, profiles } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

import { RechargeForm } from "./_components/recharge-form";

export default async function RechargePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [me] = await db
    .select({ role: profiles.role, referredBy: profiles.referredBy })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);
  // Hanya member yang boleh akses halaman deposit
  if (!me || me.role !== "member") redirect("/");

  // Resolve leader via chain: member.referredBy -> staff -> staff.leaderId.
  // Kolom `profiles.leaderId` hanya diisi untuk role `admin_staff`,
  // jadi untuk member harus lookup staff referrer dulu.
  let memberLeaderId: string | null = null;
  if (me.referredBy) {
    const [staff] = await db
      .select({ leaderId: profiles.leaderId, role: profiles.role })
      .from(profiles)
      .where(eq(profiles.id, me.referredBy))
      .limit(1);
    // Hanya percaya referredBy kalau dia staff (bukan profile sembarang).
    if (staff && staff.role === "admin_staff") {
      memberLeaderId = staff.leaderId;
    }
  }

  // Filter rekening: aktif AND (milik leader member ATAU global/NULL).
  // Member tanpa staff referrer / tanpa leader: hanya rekening global.
  const leaderFilter = memberLeaderId
    ? or(
        eq(depositBankAccounts.leaderId, memberLeaderId),
        isNull(depositBankAccounts.leaderId),
      )
    : isNull(depositBankAccounts.leaderId);

  const accounts = await db
    .select({
      id: depositBankAccounts.id,
      bankName: depositBankAccounts.bankName,
      accountName: depositBankAccounts.accountName,
      accountNumber: depositBankAccounts.accountNumber,
      notes: depositBankAccounts.notes,
    })
    .from(depositBankAccounts)
    .where(
      and(
        eq(depositBankAccounts.isActive, true),
        leaderFilter,
      ),
    )
    .orderBy(desc(depositBankAccounts.createdAt));

  return (
    <div className="min-h-full bg-zinc-50 pb-24">
      <header className="sticky top-0 z-30 bg-emerald-600 text-white shadow-sm">
        <h1 className="mx-auto max-w-2xl px-4 py-3 text-center text-sm font-bold sm:py-3.5 sm:text-base">
          Isi Ulang Saldo
        </h1>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-4 sm:px-6 sm:py-5">
        <RechargeForm
          accounts={accounts.map((a) => ({
            id: a.id,
            bankName: a.bankName,
            accountName: a.accountName,
            accountNumber: a.accountNumber,
            notes: a.notes,
          }))}
        />
      </div>

      <BottomNav />
    </div>
  );
}
