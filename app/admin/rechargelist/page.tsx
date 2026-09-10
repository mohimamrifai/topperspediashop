import { desc, eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";

import { getScope } from "@/lib/access";
import { db } from "@/lib/db";
import { deposits, profiles } from "@/lib/db/schema";
import { resolveProofUrl } from "@/lib/files/proof-url";
import { getCurrentUser } from "@/lib/auth/session";

import { RechargesTable } from "./_components/recharges-table";

export default async function AdminRechargeListPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  const scope = await getScope(user.id);
  const memberIds = scope?.memberIds ?? null;
  const unrestricted = scope?.unrestricted ?? false;

  const whereClause = unrestricted
    ? undefined
    : memberIds && memberIds.length > 0
      ? inArray(deposits.memberId, memberIds)
      : eq(deposits.memberId, "00000000-0000-0000-0000-000000000000");

  const baseQuery = db
    .select({
      id: deposits.id,
      amount: deposits.amount,
      status: deposits.status,
      proofUrl: deposits.proofUrl,
      notes: deposits.notes,
      createdAt: deposits.createdAt,
      memberUsername: profiles.username,
    })
    .from(deposits)
    .leftJoin(profiles, eq(deposits.memberId, profiles.id));

  const rows = whereClause
    ? await baseQuery.where(whereClause).orderBy(desc(deposits.createdAt))
    : await baseQuery.orderBy(desc(deposits.createdAt));

  // Resolve setiap proofUrl: URL lama (public) → signed URL baru; URL signed yang masih valid → as-is.
  const resolvedRecharges = await Promise.all(
    rows.map(async (r) => ({
      id: r.id,
      memberUsername: r.memberUsername ?? "(user dihapus)",
      amount: r.amount,
      status: r.status as "pending" | "approved" | "rejected",
      proofUrl: await resolveProofUrl(r.proofUrl),
      notes: r.notes,
      createdAt: r.createdAt.toISOString(),
    })),
  );

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-4 sm:space-y-5 sm:py-5">
      <RechargesTable initialRecharges={resolvedRecharges} />
    </div>
  );
}
