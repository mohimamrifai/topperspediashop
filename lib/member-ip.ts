import { and, eq, inArray, isNotNull, or, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import type { MemberReferrerInfo } from "@/lib/member-referrer";

export type MemberIpRow = {
  id: string;
  username: string;
  phone: string | null;
  level: string;
  creditScore: number;
  balance: string;
  frozenBalance: string;
  status: string;
  registrationIp: string | null;
  lastSeenIp: string | null;
  createdAt: string;
  referrer?: MemberReferrerInfo | null;
};

export type DuplicateIpGroup = {
  ip: string;
  memberCount: number;
  members: MemberIpRow[];
};

const memberSelect = {
  id: profiles.id,
  username: profiles.username,
  phone: profiles.phone,
  level: profiles.level,
  creditScore: profiles.creditScore,
  balance: profiles.balance,
  frozenBalance: profiles.frozenBalance,
  status: profiles.status,
  registrationIp: profiles.registrationIp,
  lastSeenIp: profiles.lastSeenIp,
  createdAt: profiles.createdAt,
};

function toMemberIpRow(row: {
  id: string;
  username: string;
  phone: string | null;
  level: string;
  creditScore: number;
  balance: string;
  frozenBalance: string;
  status: string;
  registrationIp: string | null;
  lastSeenIp: string | null;
  createdAt: Date;
}): MemberIpRow {
  return {
    id: row.id,
    username: row.username,
    phone: row.phone,
    level: row.level,
    creditScore: row.creditScore,
    balance: row.balance,
    frozenBalance: row.frozenBalance,
    status: row.status,
    registrationIp: row.registrationIp,
    lastSeenIp: row.lastSeenIp,
    createdAt: row.createdAt.toISOString(),
  };
}

function scopeWhere(memberIds: string[] | null) {
  const memberOnly = eq(profiles.role, "member");
  if (memberIds === null) return memberOnly;
  if (memberIds.length === 0) {
    return eq(profiles.id, "00000000-0000-0000-0000-000000000000");
  }
  return and(memberOnly, inArray(profiles.id, memberIds));
}

/**
 * Kelompok IP registrasi yang dipakai oleh lebih dari satu member.
 */
export async function getDuplicateRegistrationIpGroups(
  memberIds: string[] | null,
): Promise<DuplicateIpGroup[]> {
  const duplicateIps = await db
    .select({
      ip: profiles.registrationIp,
      memberCount: sql<number>`count(*)::int`,
    })
    .from(profiles)
    .where(
      and(scopeWhere(memberIds), isNotNull(profiles.registrationIp)),
    )
    .groupBy(profiles.registrationIp)
    .having(sql`count(*) > 1`)
    .orderBy(sql`count(*) DESC`, profiles.registrationIp);

  if (duplicateIps.length === 0) return [];

  const ips = duplicateIps
    .map((row) => row.ip)
    .filter((ip): ip is string => Boolean(ip));

  const memberRows = await db
    .select(memberSelect)
    .from(profiles)
    .where(
      and(scopeWhere(memberIds), inArray(profiles.registrationIp, ips)),
    )
    .orderBy(profiles.createdAt);

  const byIp = new Map<string, MemberIpRow[]>();
  for (const row of memberRows) {
    if (!row.registrationIp) continue;
    const list = byIp.get(row.registrationIp) ?? [];
    list.push(toMemberIpRow(row));
    byIp.set(row.registrationIp, list);
  }

  return duplicateIps
    .filter((row) => row.ip)
    .map((row) => ({
      ip: row.ip!,
      memberCount: row.memberCount,
      members: byIp.get(row.ip!) ?? [],
    }));
}

/**
 * Cari member berdasarkan IP registrasi atau IP login terakhir.
 */
export async function getMembersByIp(
  ip: string,
  memberIds: string[] | null,
): Promise<MemberIpRow[]> {
  const trimmed = ip.trim();
  if (!trimmed) return [];

  const rows = await db
    .select(memberSelect)
    .from(profiles)
    .where(
      and(
        scopeWhere(memberIds),
        or(
          eq(profiles.registrationIp, trimmed),
          eq(profiles.lastSeenIp, trimmed),
        ),
      ),
    )
    .orderBy(profiles.createdAt);

  return rows.map(toMemberIpRow);
}
