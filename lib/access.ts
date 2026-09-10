/**
 * Helper untuk menentukan scope akses admin berdasarkan role.
 *
 * Aturan:
 * - `super_admin`  : full akses (semua member, semua admin)
 * - `admin_leader` : aggregate member dari staff-staf di bawahnya (`leader_id` = leader.id)
 * - `admin_staff`  : member yang direct referral ke staff (`referred_by` = staff.id)
 * - `member`       : tidak applicable (dipakai untuk cek akses)
 *
 * Super Admin juga dapat menyetel `access_overrides` JSON pada profil admin
 * untuk memberikan/mencabut kemampuan tertentu (lihat `AccessOverrides`).
 */

import { eq, inArray } from "drizzle-orm";
import { cache } from "react";

import { getCurrentProfile } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";

export type AdminRole = "super_admin" | "admin_leader" | "admin_staff" | "member";

/**
 * Sumber kebenaran untuk status lock penarikan member.
 *
 * `status = "banned"` digunakan untuk menandakan bahwa penarikan member
 * sedang di-block. Flag ini di-set oleh:
 * - `setMemberWithdrawLock` (admin toggle manual, bisa dengan/tanpa alasan)
 * - `withdrawals-admin.ts` (auto-ban saat reject withdrawal dengan alasan
 *   "rekening tidak valid" / "penipuan" / "akun mencurigakan")
 *
 * PENTING (design intent):
 * Status ini HANYA men-block penarikan, BUKAN akses tugas. Member yang
 * penarikannya dikunci tetap boleh request dan submit tugas via
 * `requestTask` / `submitTask` (lihat JSDoc di tasks-member.ts). Jangan
 * menambahkan check `status === "banned"` di alur tugas tanpa diskusi
 * dengan owner produk.
 */
export function isWithdrawLocked(
  profile: { status: string | null } | null | undefined,
): boolean {
  return profile?.status === "banned";
}

/**
 * Override flag yang dapat disetel Super Admin per-admin di `access_overrides`.
 */
export type AccessOverrides = {
  fullAccess?: boolean;
  canCreateStaff?: boolean;
  canCreateLeader?: boolean;
  commissionEdit?: boolean;
  depositBankCrud?: boolean;
  channelCrud?: boolean;
};

export type Scope = {
  /** ID admin yang login (atau null jika unauthenticated). */
  actorId: string;
  role: AdminRole;
  /**
   * Daftar UUID profile yang boleh diakses actor ini.
   * Untuk super_admin: tidak terisi (NULL = unrestricted, lihat `unrestricted`).
   * Untuk admin_leader: semua member di bawah staff-stafnya.
   * Untuk admin_staff: member yang direct referral.
   * Untuk member: hanya dirinya sendiri.
   */
  memberIds: string[] | null;
  /**
   * Jika true, actor boleh akses semua member tanpa filter.
   * (Hanya super_admin yang punya flag ini, atau override `fullAccess`.)
   */
  unrestricted: boolean;
  /** Override flag (lihat `AccessOverrides`). */
  overrides: AccessOverrides;
};

/**
 * Baca AccessOverrides dari row profile (aman jika null/undefined).
 */
function readOverrides(raw: unknown): AccessOverrides {
  if (!raw || typeof raw !== "object") return {};
  const obj = raw as Record<string, unknown>;
  return {
    fullAccess: obj.fullAccess === true,
    canCreateStaff: obj.canCreateStaff === true,
    canCreateLeader: obj.canCreateLeader === true,
    commissionEdit: obj.commissionEdit === true,
    depositBankCrud: obj.depositBankCrud === true,
    channelCrud: obj.channelCrud === true,
  };
}

/**
 * Ambil scope akses untuk user yang sedang login.
 * Mengembalikan null jika user tidak ditemukan.
 */
const loadScopeProfile = cache(async (userId: string) => {
  const currentProfile = await getCurrentProfile();
  if (currentProfile?.id === userId) {
    return {
      id: currentProfile.id,
      role: currentProfile.role,
      accessOverrides: currentProfile.accessOverrides,
    };
  }

  const [profile] = await db
    .select({
      id: profiles.id,
      role: profiles.role,
      accessOverrides: profiles.accessOverrides,
    })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  return profile ?? null;
});

const loadMemberIdsByReferrer = cache(async (referrerId: string) => {
  const members = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.referredBy, referrerId));

  return members.map((member) => member.id);
});

const loadStaffIdsByLeader = cache(async (leaderId: string) => {
  const staffRows = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.leaderId, leaderId));

  return staffRows.map((staff) => staff.id);
});

export const getScope = cache(async (userId: string | null): Promise<Scope | null> => {
  if (!userId) return null;

  const profile = await loadScopeProfile(userId);
  if (!profile) {
    return null;
  }

  const role = profile.role as AdminRole;
  const overrides = readOverrides(profile.accessOverrides);

  if (role === "super_admin") {
    return {
      actorId: profile.id,
      role,
      memberIds: null,
      unrestricted: true,
      overrides,
    };
  }

  if (role === "admin_staff") {
    const memberIds = await loadMemberIdsByReferrer(profile.id);
    return {
      actorId: profile.id,
      role,
      memberIds,
      unrestricted: overrides.fullAccess === true,
      overrides,
    };
  }

  if (role === "admin_leader") {
    const staffIds = await loadStaffIdsByLeader(profile.id);
    if (staffIds.length === 0) {
      return {
        actorId: profile.id,
        role,
        memberIds: [],
        unrestricted: overrides.fullAccess === true,
        overrides,
      };
    }
    const members = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(inArray(profiles.referredBy, staffIds));
    return {
      actorId: profile.id,
      role,
      memberIds: members.map((m) => m.id),
      unrestricted: overrides.fullAccess === true,
      overrides,
    };
  }

  // member
  return {
    actorId: profile.id,
    role,
    memberIds: [profile.id],
    unrestricted: false,
    overrides,
  };
});

/**
 * Cek apakah actor boleh mengakses target member.
 * Return true kalau target termasuk dalam scope, atau actor unrestricted.
 */
export function canAccessMember(
  scope: Scope,
  targetMemberId: string,
): boolean {
  if (scope.unrestricted) return true;
  if (scope.memberIds === null) return false; // safety: tidak ada unrestricted eksplisit
  return scope.memberIds.includes(targetMemberId);
}

/**
 * Throw error kalau scope tidak boleh akses target member.
 * Dipakai di server action sebelum mutate data member.
 */
export function assertCanAccessMember(
  scope: Scope,
  targetMemberId: string,
): void {
  if (!canAccessMember(scope, targetMemberId)) {
    throw new Error("FORBIDDEN_SCOPE");
  }
}

/**
 * Cek apakah actor boleh memanage (edit/hapus/toggle) rekening deposit
 * tertentu berdasarkan `leader_id` rekening.
 *
 * Aturan:
 * - super_admin: selalu boleh.
 * - admin_leader dengan override `depositBankCrud`: hanya rekening dengan
 *   `leader_id = leader.id`. TIDAK boleh rekening global (NULL).
 * - lainnya: tidak boleh.
 */
export function canManageDepositBankAccount(
  scope: Scope,
  accountLeaderId: string | null,
): boolean {
  if (scope.role === "super_admin") return true;

  if (
    scope.role === "admin_leader" &&
    scope.overrides.depositBankCrud === true
  ) {
    // Leader hanya boleh manage rekening tim-nya sendiri (leader_id = leader.id).
    // NULL (global) hanya super admin yang boleh.
    return accountLeaderId !== null && accountLeaderId === scope.actorId;
  }

  return false;
}

/**
 * Throw error kalau scope tidak boleh memanage rekening deposit.
 */
export function assertCanManageDepositBankAccount(
  scope: Scope,
  accountLeaderId: string | null,
): void {
  if (!canManageDepositBankAccount(scope, accountLeaderId)) {
    throw new Error("FORBIDDEN_SCOPE");
  }
}
