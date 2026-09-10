import { redirect } from "next/navigation";

import { getScope } from "@/lib/access";
import { getCurrentProfile } from "@/lib/auth/session";
import {
  getDuplicateRegistrationIpGroups,
  getMembersByIp,
  type MemberIpRow,
} from "@/lib/member-ip";
import { getMemberReferrerMap } from "@/lib/member-referrer";

import { MemberIpTool } from "./_components/member-ip-tool";

async function attachReferrers(
  rows: MemberIpRow[],
  isSuperAdmin: boolean,
): Promise<MemberIpRow[]> {
  if (!isSuperAdmin || rows.length === 0) return rows;
  const referrerMap = await getMemberReferrerMap(rows.map((r) => r.id));
  return rows.map((r) => ({
    ...r,
    referrer: referrerMap.get(r.id) ?? null,
  }));
}

async function attachReferrersToGroups(
  groups: Awaited<ReturnType<typeof getDuplicateRegistrationIpGroups>>,
  isSuperAdmin: boolean,
) {
  if (!isSuperAdmin) return groups;
  const allMembers = groups.flatMap((g) => g.members);
  const enriched = await attachReferrers(allMembers, true);
  const byId = new Map(enriched.map((m) => [m.id, m]));
  return groups.map((g) => ({
    ...g,
    members: g.members.map((m) => byId.get(m.id) ?? m),
  }));
}

export default async function AdminMemberIpPage({
  searchParams,
}: {
  searchParams: Promise<{ ip?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role === "member") redirect("/admin/login");

  const isSuperAdmin = profile.role === "super_admin";
  const scope = await getScope(profile.id);
  const memberIds = scope?.unrestricted ? null : scope?.memberIds ?? [];

  const params = await searchParams;
  const ipQuery = params.ip?.trim() ?? "";

  const [duplicateGroups, searchResults] = await Promise.all([
    getDuplicateRegistrationIpGroups(memberIds),
    ipQuery ? getMembersByIp(ipQuery, memberIds) : Promise.resolve([]),
  ]);

  const [enrichedGroups, enrichedSearch] = await Promise.all([
    attachReferrersToGroups(duplicateGroups, isSuperAdmin),
    attachReferrers(searchResults, isSuperAdmin),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-4 sm:py-5">
      <MemberIpTool
        isSuperAdmin={isSuperAdmin}
        duplicateGroups={enrichedGroups}
        searchResults={enrichedSearch}
        initialQuery={ipQuery}
      />
    </div>
  );
}
