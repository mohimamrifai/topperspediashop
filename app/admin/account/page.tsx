import { desc, eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";

import { getScope } from "@/lib/access";
import { db } from "@/lib/db";
import { bankAccounts, profiles } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

import { AccountsTable } from "./_components/accounts-table";

export default async function AdminAccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  const scope = await getScope(user.id);
  const memberIds = scope?.memberIds ?? null;
  const unrestricted = scope?.unrestricted ?? false;

  const whereClause = unrestricted
    ? undefined
    : memberIds && memberIds.length > 0
      ? inArray(bankAccounts.userId, memberIds)
      : eq(bankAccounts.userId, "00000000-0000-0000-0000-000000000000");

  const baseQuery = db
    .select({
      id: bankAccounts.id,
      bankName: bankAccounts.bankName,
      accountName: bankAccounts.accountName,
      accountNumber: bankAccounts.accountNumber,
      backupPhone: bankAccounts.backupPhone,
      isPrimary: bankAccounts.isPrimary,
      createdAt: bankAccounts.createdAt,
      userId: profiles.id,
      username: profiles.username,
      role: profiles.role,
      phone: profiles.phone,
    })
    .from(bankAccounts)
    .innerJoin(profiles, eq(bankAccounts.userId, profiles.id));

  const rows = whereClause
    ? await baseQuery.where(whereClause).orderBy(desc(bankAccounts.createdAt))
    : await baseQuery.orderBy(desc(bankAccounts.createdAt));

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-4 sm:space-y-5 sm:py-5">
      <AccountsTable
        initialAccounts={rows.map((r) => ({
          id: r.id,
          userId: r.userId,
          username: r.username,
          role: r.role,
          phone: r.phone,
          bankName: r.bankName,
          accountName: r.accountName,
          accountNumber: r.accountNumber,
          backupPhone: r.backupPhone,
          isPrimary: r.isPrimary,
          createdAt: r.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
