import { desc, eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";

import { getScope } from "@/lib/access";
import { db } from "@/lib/db";
import { bankAccounts, profiles, withdrawals } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

import { WithdrawsTable } from "./_components/withdraws-table";

export default async function AdminWithdrawListPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  const scope = await getScope(user.id);
  const memberIds = scope?.memberIds ?? null;
  const unrestricted = scope?.unrestricted ?? false;

  const whereClause = unrestricted
    ? undefined
    : memberIds && memberIds.length > 0
      ? inArray(withdrawals.memberId, memberIds)
      : eq(withdrawals.memberId, "00000000-0000-0000-0000-000000000000");

  const baseQuery = db
    .select({
      id: withdrawals.id,
      amount: withdrawals.amount,
      status: withdrawals.status,
      notes: withdrawals.notes,
      createdAt: withdrawals.createdAt,
      memberUsername: profiles.username,
      bankName: bankAccounts.bankName,
      accountName: bankAccounts.accountName,
      accountNumber: bankAccounts.accountNumber,
    })
    .from(withdrawals)
    .leftJoin(profiles, eq(withdrawals.memberId, profiles.id))
    .leftJoin(bankAccounts, eq(withdrawals.bankAccountId, bankAccounts.id));

  const rows = whereClause
    ? await baseQuery.where(whereClause).orderBy(desc(withdrawals.createdAt))
    : await baseQuery.orderBy(desc(withdrawals.createdAt));

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-4 sm:space-y-5 sm:py-5">
      <WithdrawsTable
        initialWithdraws={rows.map((r) => ({
          id: r.id,
          memberUsername: r.memberUsername ?? "(user dihapus)",
          bankName: r.bankName ?? "—",
          accountName: r.accountName ?? "—",
          accountNumber: r.accountNumber ?? "—",
          amount: r.amount,
          status: r.status as "pending" | "completed" | "rejected",
          notes: r.notes,
          createdAt: r.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
