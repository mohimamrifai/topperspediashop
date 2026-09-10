import { desc, eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";

import { getScope } from "@/lib/access";
import { getCurrentProfile } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { getMemberReferrerMap } from "@/lib/member-referrer";

import { MembersTable } from "./_components/members-table";

export default async function AdminUsersPage() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role === "member") redirect("/admin/login");

  const isSuperAdmin = profile.role === "super_admin";
  const scope = await getScope(profile.id);
  const memberIds = scope?.memberIds ?? null;
  const unrestricted = scope?.unrestricted ?? false;

  // Filter: hanya role=member, dan (kalau tidak unrestricted) sesuai scope
  const baseWhere = eq(profiles.role, "member");
  const whereClause = unrestricted
    ? baseWhere
    : memberIds && memberIds.length > 0
      ? inArray(profiles.id, memberIds)
      : eq(profiles.id, "00000000-0000-0000-0000-000000000000");

  const rows = await db
    .select({
      id: profiles.id,
      username: profiles.username,
      phone: profiles.phone,
      level: profiles.level,
      creditScore: profiles.creditScore,
      balance: profiles.balance,
      frozenBalance: profiles.frozenBalance,
      status: profiles.status,
      createdAt: profiles.createdAt,
    })
    .from(profiles)
    .where(whereClause)
    .orderBy(desc(profiles.createdAt));

  const referrerMap = isSuperAdmin
    ? await getMemberReferrerMap(rows.map((r) => r.id))
    : null;

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-4 sm:space-y-5 sm:py-5">
      <MembersTable
        isSuperAdmin={isSuperAdmin}
        initialMembers={rows.map((r) => ({
          id: r.id,
          username: r.username,
          phone: r.phone,
          level: r.level,
          creditScore: r.creditScore,
          balance: r.balance,
          frozenBalance: r.frozenBalance,
          status: r.status,
          createdAt: r.createdAt.toISOString(),
          ...(isSuperAdmin
            ? { referrer: referrerMap?.get(r.id) ?? null }
            : {}),
        }))}
      />
    </div>
  );
}
