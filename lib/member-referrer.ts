import { eq, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";

export type MemberReferrerInfo = {
  staffId: string;
  staffUsername: string;
  referralCode: string | null;
  leaderUsername: string | null;
};

/**
 * Peta memberId → info staff pendaftar (dari `profiles.referred_by`).
 * Member tanpa referral atau staff tidak ditemukan → nilai `null`.
 */
export async function getMemberReferrerMap(
  memberIds: string[],
): Promise<Map<string, MemberReferrerInfo | null>> {
  const result = new Map<string, MemberReferrerInfo | null>();
  if (memberIds.length === 0) return result;

  const memberRows = await db
    .select({
      memberId: profiles.id,
      referredBy: profiles.referredBy,
    })
    .from(profiles)
    .where(inArray(profiles.id, memberIds));

  const staffIds = [
    ...new Set(
      memberRows
        .map((r) => r.referredBy)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const staff = alias(profiles, "staff");
  const leader = alias(profiles, "leader");

  const staffRows =
    staffIds.length > 0
      ? await db
          .select({
            id: staff.id,
            username: staff.username,
            referralCode: staff.referralCode,
            leaderUsername: leader.username,
          })
          .from(staff)
          .leftJoin(leader, eq(staff.leaderId, leader.id))
          .where(inArray(staff.id, staffIds))
      : [];

  const staffById = new Map(staffRows.map((s) => [s.id, s]));

  for (const row of memberRows) {
    if (!row.referredBy) {
      result.set(row.memberId, null);
      continue;
    }
    const s = staffById.get(row.referredBy);
    if (!s) {
      result.set(row.memberId, null);
      continue;
    }
    result.set(row.memberId, {
      staffId: s.id,
      staffUsername: s.username,
      referralCode: s.referralCode,
      leaderUsername: s.leaderUsername,
    });
  }

  return result;
}
