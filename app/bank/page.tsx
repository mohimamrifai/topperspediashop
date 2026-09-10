import { eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { bankAccounts } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

import { BottomNav } from "../_components/bottom-nav";
import { BankContent } from "./_components/bank-content";

export default async function BankPage() {
  const user = await getCurrentUser();

  const rows = user
    ? await db
        .select({
          id: bankAccounts.id,
          bankName: bankAccounts.bankName,
          accountName: bankAccounts.accountName,
          accountNumber: bankAccounts.accountNumber,
          backupPhone: bankAccounts.backupPhone,
          isPrimary: bankAccounts.isPrimary,
        })
        .from(bankAccounts)
        .where(eq(bankAccounts.userId, user.id))
        .orderBy(sql`${bankAccounts.isPrimary} DESC, ${bankAccounts.createdAt} DESC`)
    : [];

  return (
    <div className="min-h-full bg-zinc-50 pb-24">
      <header className="sticky top-0 z-30 bg-emerald-600 text-white shadow-sm">
        <h1 className="mx-auto max-w-2xl px-4 py-3 text-center text-sm font-bold sm:px-6 sm:py-3.5 sm:text-base">
          Informasi Penarikan
        </h1>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-4 sm:px-6 sm:py-5">
        <BankContent
          banks={rows.map((r) => ({
            id: r.id,
            bankName: r.bankName,
            accountName: r.accountName,
            accountNumber: r.accountNumber,
            backupPhone: r.backupPhone,
            isPrimary: r.isPrimary,
          }))}
        />
      </div>

      <BottomNav />
    </div>
  );
}
