"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath, refresh } from "next/cache";
import { z } from "zod";

import { getScope } from "@/lib/access";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { auditLogs, profiles } from "@/lib/db/schema";

export type AdminUserState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
  success?: boolean;
  message?: string;
  /** Dikirim sekali saat create/reset password berhasil. */
  generatedPassword?: string;
  /** Referral code final (berguna untuk create & update). */
  generatedReferralCode?: string;
  /** ID target yang baru diupdate/buat, untuk highlight baris. */
  targetId?: string;
};

function generateReferralCode(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "STAFF-";
  for (let i = 0; i < 6; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

/**
 * Pemeriksaan peran untuk aksi tim:
 *  - `super_admin` boleh create/update/delete baik leader maupun staff.
 *  - `admin_leader` hanya boleh create/update/delete admin_staff di bawahnya.
 * Return `{ actorId, role, scope }`.
 *
 * `scope` dipakai untuk enforce izin tambahan dari `access_overrides` (override flags).
 * Untuk super_admin: scope penuh (canCreateStaff & canCreateLeader = true).
 * Untuk admin_leader: canCreateStaff = true, canCreateLeader = false (overrideable).
 */
async function requireTeamManager(): Promise<{
  actorId: string;
  role: "super_admin" | "admin_leader";
  scope: Awaited<ReturnType<typeof getScope>>;
}> {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;
  if (!user) throw new Error("UNAUTHENTICATED");

  const scope = await getScope(user.id);
  if (!scope) throw new Error("FORBIDDEN");
  if (scope.role !== "super_admin" && scope.role !== "admin_leader") {
    throw new Error("FORBIDDEN");
  }
  return { actorId: user.id, role: scope.role, scope };
}

function syntheticEmail(username: string) {
  return `${username.toLowerCase()}@topperspediashop.app`;
}

function describeBetterAuthError(err: unknown): string {
  if (!err) return "kesalahan tidak diketahui";
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message || err.toString();
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

const createSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3, "Username minimal 3 karakter.")
      .max(20, "Username maksimal 20 karakter.")
      .regex(/^[a-zA-Z0-9_]+$/, "Hanya huruf, angka, dan underscore."),
    role: z.enum(["admin_leader", "admin_staff"], {
      message: "Role harus Leader atau Staff.",
    }),
    /**
     * Wajib untuk role `admin_staff`: pilih leader yang menaungi.
     * Untuk role `admin_leader`, abaikan.
     * Jika actor=admin_leader, leaderId akan diabaikan dan dipaksa ke actor.id.
     */
    leaderId: z.string().uuid("ID leader tidak valid.").optional().or(z.literal("")),
    /**
     * Referral manual (custom) untuk role `admin_staff`. Boleh angka, huruf,
     * underscore, atau hyphen. Jika kosong, sistem auto-generate.
     * Tidak berlaku untuk role `admin_leader`.
     */
    referralCode: z
      .string()
      .trim()
      .max(20)
      .optional()
      .or(z.literal(""))
      .refine(
        (v) => !v || /^[a-zA-Z0-9_-]+$/.test(v),
        "Referral hanya huruf, angka, underscore, dan hyphen.",
      ),
    /**
     * Password diisi manual oleh admin (tidak di-generate sistem).
     * Wajib diisi, minimal 6 karakter, harus sama dengan `passwordConfirmation`.
     */
    password: z
      .string()
      .min(6, "Password minimal 6 karakter.")
      .max(72, "Password maksimal 72 karakter."),
    passwordConfirmation: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Password dan konfirmasi tidak cocok.",
    path: ["passwordConfirmation"],
  });

export async function createAdminUser(
  _prev: AdminUserState,
  formData: FormData,
): Promise<AdminUserState> {
  let actor: Awaited<ReturnType<typeof requireTeamManager>>;
  try {
    actor = await requireTeamManager();
  } catch {
    return { error: "Anda tidak memiliki akses untuk aksi ini." };
  }

  const parsed = createSchema.safeParse({
    username: formData.get("username"),
    role: formData.get("role"),
    leaderId: formData.get("leaderId") || undefined,
    referralCode: formData.get("referralCode") || "",
    password: formData.get("password") || "",
    passwordConfirmation: formData.get("passwordConfirmation") || "",
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const username = parsed.data.username;
  const role = parsed.data.role;
  const leaderIdRaw = parsed.data.leaderId && parsed.data.leaderId !== "" ? parsed.data.leaderId : null;
  const manualReferral =
    parsed.data.referralCode && parsed.data.referralCode.length >= 3
      ? parsed.data.referralCode
      : null;
  const password = parsed.data.password;

  // Enforce izin override flags (access_overrides):
  //  - super_admin selalu boleh keduanya.
  //  - admin_leader: canCreateStaff selalu true (dari role), canCreateLeader butuh override.
  const isSuper = actor.role === "super_admin";
  const canCreateStaff = isSuper || (actor.scope?.overrides.canCreateStaff === true);
  const canCreateLeader = isSuper || (actor.scope?.overrides.canCreateLeader === true);

  // Pembatasan hak akses (role + override):
  if (role === "admin_staff" && !canCreateStaff) {
    return { fieldErrors: { role: ["Anda tidak memiliki izin untuk membuat Admin Staff."] } };
  }
  if (role === "admin_leader" && !canCreateLeader) {
    return { fieldErrors: { role: ["Anda tidak memiliki izin untuk membuat Admin Leader."] } };
  }
  if (actor.role === "admin_leader" && role === "admin_leader") {
    return { fieldErrors: { role: ["Leader tidak dapat membuat Admin Leader lain."] } };
  }

  // Untuk role=admin_staff, leaderId WAJIB ada & valid.
  // Jika actor=admin_leader, leaderId dipaksa ke actor.id (abaikan input).
  let resolvedLeaderId: string | null = null;
  if (role === "admin_staff") {
    if (actor.role === "admin_leader") {
      resolvedLeaderId = actor.actorId;
    } else {
      if (!leaderIdRaw) {
        return { fieldErrors: { leaderId: ["Pilih leader untuk staff ini."] } };
      }
      const [leader] = await db
        .select({ id: profiles.id, role: profiles.role })
        .from(profiles)
        .where(eq(profiles.id, leaderIdRaw))
        .limit(1);
      if (!leader) {
        return { fieldErrors: { leaderId: ["Leader tidak ditemukan."] } };
      }
      if (leader.role !== "admin_leader") {
        return { fieldErrors: { leaderId: ["User yang dipilih bukan Admin Leader."] } };
      }
      resolvedLeaderId = leader.id;
    }
  }

  // Cek username sudah dipakai
  const [existing] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.username, username))
    .limit(1);
  if (existing) {
    return { fieldErrors: { username: ["Username sudah dipakai."] } };
  }

  // Referral code hanya untuk staff; untuk leader NULL.
  // Jika admin menginput referral manual, pakai itu. Validasi keunikan.
  let referralCode: string | null = null;
  if (role === "admin_staff") {
    if (manualReferral) {
      const [taken] = await db
        .select({ id: profiles.id })
        .from(profiles)
        .where(eq(profiles.referralCode, manualReferral))
        .limit(1);
      if (taken) {
        return { fieldErrors: { referralCode: ["Referral sudah dipakai."] } };
      }
      referralCode = manualReferral;
    } else {
      // Auto-generate sampai dapat yang unik (safety, biasanya cukup 1 try)
      let attempts = 0;
      while (attempts < 5) {
        const candidate = generateReferralCode();
        const [taken] = await db
          .select({ id: profiles.id })
          .from(profiles)
          .where(eq(profiles.referralCode, candidate))
          .limit(1);
        if (!taken) {
          referralCode = candidate;
          break;
        }
        attempts++;
      }
      if (!referralCode) {
        return { error: "Gagal generate referral unik. Coba lagi." };
      }
    }
  }

  let createdUser: { id: string; email?: string } | null = null;
  let createErr: unknown = null;
  try {
    const data = await auth.api.createUser({
      headers: await headers(),
      body: {
        email: syntheticEmail(username),
        password,
        name: username,
        role,
        data: { username },
      },
    });
    createdUser = { id: data.user.id, email: data.user.email ?? undefined };
  } catch (e) {
    createErr = e;
  }

  if (!createdUser) {
    console.error("[createAdminUser] createUser error:", createErr);
    return { error: `Gagal membuat akun admin: ${describeBetterAuthError(createErr)}.` };
  }

  // Better Auth hook membuat `profiles` default sebagai `member`.
  // Pastikan row ini selalu tersinkron ke role admin final supaya daftar
  // `/admin/team` langsung membaca data yang benar setelah create.
  const now = new Date();
  await db
    .insert(profiles)
    .values({
      id: createdUser.id,
      username,
      role,
      leaderId: resolvedLeaderId,
      referralCode,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: profiles.id,
      set: {
        username,
        role,
        leaderId: resolvedLeaderId,
        referralCode,
        updatedAt: now,
      },
    });

  // Tulis audit log
  await db.insert(auditLogs).values({
    actorId: actor.actorId,
    targetId: createdUser.id,
    action: "create_admin",
    note: `Akun admin ${role} @${username} dibuat.`,
    metadata: JSON.stringify({ username, role, referralCode, leaderId: resolvedLeaderId, byRole: actor.role }),
  });

  revalidatePath("/admin/team");
  refresh();
  return {
    success: true,
    message: `Akun ${role === "admin_leader" ? "Admin Leader" : "Admin Staff"} berhasil dibuat.`,
    generatedReferralCode: referralCode ?? undefined,
    targetId: createdUser.id,
  };
}

// ===== updateAdminUser =====

const updateSchema = z.object({
  adminId: z.string().uuid("ID admin tidak valid."),
  newUsername: z
    .string()
    .trim()
    .min(3, "Username minimal 3 karakter.")
    .max(20, "Username maksimal 20 karakter.")
    .regex(/^[a-zA-Z0-9_]+$/, "Hanya huruf, angka, dan underscore."),
  newRole: z.enum(["admin_leader", "admin_staff"]),
  newLeaderId: z.string().uuid("ID leader tidak valid.").optional().or(z.literal("")),
  /**
   * Referral manual (custom) untuk role `admin_staff`. Boleh angka, huruf,
   * underscore, atau hyphen. Jika kosong, referral yang ada tetap dipakai
   * (tidak auto-regenerate).
   */
  newReferralCode: z
    .string()
    .trim()
    .max(20)
    .optional()
    .or(z.literal(""))
    .refine(
      (v) => !v || /^[a-zA-Z0-9_-]+$/.test(v),
      "Referral hanya huruf, angka, underscore, dan hyphen.",
    ),
});

export async function updateAdminUser(
  _prev: AdminUserState,
  formData: FormData,
): Promise<AdminUserState> {
  let actor: {
    actorId: string;
    role: "super_admin" | "admin_leader";
    scope: Awaited<ReturnType<typeof getScope>>;
  };
  try {
    actor = await requireTeamManager();
  } catch {
    return { error: "Anda tidak memiliki akses untuk aksi ini." };
  }

  const parsed = updateSchema.safeParse({
    adminId: formData.get("adminId"),
    newUsername: formData.get("newUsername"),
    newRole: formData.get("newRole"),
    newLeaderId: formData.get("newLeaderId") || undefined,
    newReferralCode: formData.get("newReferralCode") || "",
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { adminId, newUsername, newRole, newLeaderId, newReferralCode } = parsed.data;

  // Cari admin target
  const [target] = await db
    .select({
      id: profiles.id,
      role: profiles.role,
      username: profiles.username,
      referralCode: profiles.referralCode,
      leaderId: profiles.leaderId,
    })
    .from(profiles)
    .where(eq(profiles.id, adminId))
    .limit(1);

  if (!target) return { error: "Admin tidak ditemukan." };
  if (target.role === "super_admin") {
    return { error: "Tidak dapat mengedit akun Super Admin lain." };
  }
  if (adminId === actor.actorId) {
    return { error: "Tidak dapat mengedit akun Anda sendiri di sini." };
  }

  // Pembatasan hak akses: leader hanya boleh edit staff di bawahnya.
  if (actor.role === "admin_leader") {
    if (target.role !== "admin_staff" || target.leaderId !== actor.actorId) {
      return { error: "Anda hanya dapat mengedit staff di bawah Anda." };
    }
    if (newRole === "admin_leader") {
      return { fieldErrors: { newRole: ["Leader tidak dapat mengangkat Admin Leader."] } };
    }
  }

  // Cek username bentrok
  if (newUsername !== target.username) {
    const [conflict] = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.username, newUsername))
      .limit(1);
    if (conflict) {
      return { fieldErrors: { newUsername: ["Username sudah dipakai."] } };
    }
  }

  // Resolve leaderId target.
  // Jika role baru = admin_staff, leaderId WAJIB valid admin_leader.
  // Jika role baru = admin_leader, leaderId dipaksa NULL.
  // Jika actor=admin_leader, leaderId dipaksa ke actor.id (abaikan input).
  let resolvedLeaderId: string | null = target.leaderId;
  if (newRole === "admin_leader") {
    resolvedLeaderId = null;
  } else if (actor.role === "admin_leader") {
    resolvedLeaderId = actor.actorId;
  } else {
    const incomingLeaderId = newLeaderId && newLeaderId !== "" ? newLeaderId : null;
    if (!incomingLeaderId) {
      return { fieldErrors: { newLeaderId: ["Pilih leader untuk staff ini."] } };
    }
    if (incomingLeaderId !== target.leaderId) {
      const [leader] = await db
        .select({ id: profiles.id, role: profiles.role })
        .from(profiles)
        .where(eq(profiles.id, incomingLeaderId))
        .limit(1);
      if (!leader) {
        return { fieldErrors: { newLeaderId: ["Leader tidak ditemukan."] } };
      }
      if (leader.role !== "admin_leader") {
        return { fieldErrors: { newLeaderId: ["User yang dipilih bukan Admin Leader."] } };
      }
      resolvedLeaderId = leader.id;
    }
  }

  // Tentukan referral code final:
  //  - role baru admin_leader → NULL
  //  - role admin_staff + ada input manual → pakai itu (validasi unik)
  //  - role admin_staff + tidak ada input manual → pertahankan yang lama
  let resolvedReferralCode: string | null = target.referralCode;
  if (newRole === "admin_leader") {
    resolvedReferralCode = null;
  } else if (newReferralCode && newReferralCode.length >= 3) {
    if (newReferralCode !== target.referralCode) {
      const [taken] = await db
        .select({ id: profiles.id })
        .from(profiles)
        .where(eq(profiles.referralCode, newReferralCode))
        .limit(1);
      if (taken) {
        return { fieldErrors: { newReferralCode: ["Referral sudah dipakai."] } };
      }
      resolvedReferralCode = newReferralCode;
    }
  }

  // Update profile
  await db
    .update(profiles)
    .set({
      username: newUsername,
      role: newRole,
      referralCode: resolvedReferralCode,
      leaderId: resolvedLeaderId,
    })
    .where(eq(profiles.id, adminId));

  // Sinkronkan username di auth (supaya synthetic email ikut konsisten).
  // Email tidak diupdate —akan jadi drift dengan synthetic email.
  // Untuk sekarang, hanya update raw_user_meta_data.username.
  try {
    await auth.api.adminUpdateUser({
      headers: await headers(),
      body: {
        userId: adminId,
        data: {
          username: newUsername,
          name: newUsername,
          email: syntheticEmail(newUsername),
          role: newRole,
        },
      },
    });
  } catch (error) {
    return {
      error: `Gagal sinkronkan akun auth: ${describeBetterAuthError(error)}.`,
    };
  }

  await db.insert(auditLogs).values({
    actorId: actor.actorId,
    targetId: adminId,
    action: "update_admin",
    note: `Akun admin @${target.username} diubah → @${newUsername} (${newRole}).`,
    metadata: JSON.stringify({
      oldUsername: target.username,
      newUsername,
      oldRole: target.role,
      newRole,
      oldLeaderId: target.leaderId,
      newLeaderId: resolvedLeaderId,
      oldReferralCode: target.referralCode,
      newReferralCode: resolvedReferralCode,
      byRole: actor.role,
    }),
  });

  revalidatePath("/admin/team");
  refresh();
  return { success: true, message: "Akun admin berhasil diperbarui." };
}

// ===== resetAdminPassword =====

const resetAdminPasswordSchema = z
  .object({
    adminId: z.string().uuid("ID admin tidak valid."),
    /**
     * Password baru diisi manual oleh admin (tidak di-generate sistem).
     * Wajib diisi, minimal 6 karakter, harus sama dengan `passwordConfirmation`.
     */
    password: z
      .string()
      .min(6, "Password minimal 6 karakter.")
      .max(72, "Password maksimal 72 karakter."),
    passwordConfirmation: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Password dan konfirmasi tidak cocok.",
    path: ["passwordConfirmation"],
  });

export async function resetAdminPassword(
  _prev: AdminUserState,
  formData: FormData,
): Promise<AdminUserState> {
  let actor: Awaited<ReturnType<typeof requireTeamManager>>;
  try {
    actor = await requireTeamManager();
  } catch {
    return { error: "Anda tidak memiliki akses untuk aksi ini." };
  }

  const parsed = resetAdminPasswordSchema.safeParse({
    adminId: formData.get("adminId"),
    password: formData.get("password") || "",
    passwordConfirmation: formData.get("passwordConfirmation") || "",
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { adminId, password } = parsed.data;

  if (adminId === actor.actorId) {
    return { error: "Tidak dapat reset password akun Anda sendiri di sini." };
  }

  // Cari target (role + leaderId untuk scope check)
  const [target] = await db
    .select({
      id: profiles.id,
      role: profiles.role,
      username: profiles.username,
      leaderId: profiles.leaderId,
    })
    .from(profiles)
    .where(eq(profiles.id, adminId))
    .limit(1);
  if (!target) return { error: "Admin tidak ditemukan." };
  if (target.role === "super_admin") {
    return { error: "Tidak dapat reset password Super Admin lain." };
  }

  // Pembatasan scope: leader hanya boleh reset staff di bawahnya
  if (actor.role === "admin_leader") {
    if (target.role !== "admin_staff" || target.leaderId !== actor.actorId) {
      return { error: "Anda hanya dapat reset password staff di bawah Anda." };
    }
  }

  try {
    await auth.api.setUserPassword({
      headers: await headers(),
      body: {
        userId: adminId,
        newPassword: password,
      },
    });
  } catch (error) {
    console.error("[resetAdminPassword] setUserPassword error:", error);
    return {
      error: `Gagal memperbarui password: ${describeBetterAuthError(error)}.`,
    };
  }

  await db.insert(auditLogs).values({
    actorId: actor.actorId,
    targetId: adminId,
    action: "reset_admin_password",
    note: `Password admin @${target.username} di-reset oleh ${actor.role === "super_admin" ? "Super Admin" : "Admin Leader"}.`,
    metadata: JSON.stringify({
      targetUsername: target.username,
      targetRole: target.role,
      byRole: actor.role,
    }),
  });

  revalidatePath("/admin/team");
  refresh();
  return {
    success: true,
    message: `Password @${target.username} berhasil di-reset.`,
  };
}

// ===== deleteAdminUser =====

const deleteSchema = z.object({
  adminId: z.string().uuid("ID admin tidak valid."),
});

export async function deleteAdminUser(
  _prev: AdminUserState,
  formData: FormData,
): Promise<AdminUserState> {
  let actor: {
    actorId: string;
    role: "super_admin" | "admin_leader";
    scope: Awaited<ReturnType<typeof getScope>>;
  };
  try {
    actor = await requireTeamManager();
  } catch {
    return { error: "Anda tidak memiliki akses untuk aksi ini." };
  }

  const parsed = deleteSchema.safeParse({ adminId: formData.get("adminId") });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { adminId } = parsed.data;

  if (adminId === actor.actorId) {
    return { error: "Tidak dapat menghapus akun Anda sendiri." };
  }

  // Cari target (termasuk leaderId untuk pengecekan scope)
  const [target] = await db
    .select({
      id: profiles.id,
      role: profiles.role,
      username: profiles.username,
      leaderId: profiles.leaderId,
    })
    .from(profiles)
    .where(eq(profiles.id, adminId))
    .limit(1);
  if (!target) return { error: "Admin tidak ditemukan." };
  if (target.role === "super_admin") {
    return { error: "Tidak dapat menghapus akun Super Admin lain." };
  }

  // Pembatasan hak akses: leader hanya boleh hapus staff di bawahnya, dan tidak boleh hapus leader lain.
  if (actor.role === "admin_leader") {
    if (target.role !== "admin_staff" || target.leaderId !== actor.actorId) {
      return { error: "Anda hanya dapat menghapus staff di bawah Anda." };
    }
  }

  // Catatan: proteksi "satu-satunya super admin" sudah ter-cover oleh:
  //   - Line di atas: block self-delete (adminId === actor.actorId).
  //   - Line sebelumnya: block delete target yang role-nya super_admin.
  // Tidak perlu cek count super_admin tambahan — kalau target bukan super_admin,
  // delete diizinkan tanpa syarat jumlah super admin di sistem.

  // Lepaskan relasi anteseden sebelum hapus profile target supaya tidak ada
  // referensi menggantung:
  //   - Jika target = admin_staff: anggota yang referredBy = target jadi orphan
  //     (set referredBy = null).
  //   - Jika target = admin_leader: staff yang leaderId = target jadi orphan
  //     (set leaderId = null) supaya query tim tidak error.
  if (target.role === "admin_staff") {
    await db
      .update(profiles)
      .set({ referredBy: null })
      .where(eq(profiles.referredBy, adminId));
  }
  if (target.role === "admin_leader") {
    await db
      .update(profiles)
      .set({ leaderId: null })
      .where(eq(profiles.leaderId, adminId));
  }

  // Hapus auth user (CASCADE ke profile via trigger / ON DELETE CASCADE di FK)
  try {
    await auth.api.removeUser({
      headers: await headers(),
      body: { userId: adminId },
    });
  } catch (error) {
    console.error("[deleteAdminUser] removeUser error:", error);
    return {
      error: `Gagal menghapus akun: ${describeBetterAuthError(error)}. Hubungi developer jika masalah berlanjut.`,
    };
  }

  // Defensive: hapus profile kalau masih ada (biasanya sudah ke-cascade)
  await db.delete(profiles).where(eq(profiles.id, adminId));

  await db.insert(auditLogs).values({
    actorId: actor.actorId,
    targetId: null,
    action: "delete_admin",
    note: `Akun admin @${target.username} (${target.role}) dihapus.`,
    metadata: JSON.stringify({
      deletedAdminId: adminId,
      username: target.username,
      role: target.role,
      byRole: actor.role,
    }),
  });

  revalidatePath("/admin/team");
  refresh();
  return { success: true, message: `Akun @${target.username} berhasil dihapus.` };
}

// ===== setStaffLeader =====
//
// Re-assign leader untuk staff yang sudah ada. Tujuan utama: mengaitkan
// staff orphan (leader_id IS NULL) ke leader, atau memindahkan staff dari
// satu leader ke leader lain (khusus super admin).
//
// Aturan akses:
//  - super_admin: boleh set leader untuk admin_staff manapun
//  - admin_leader: hanya boleh set leader untuk staff yang `leader_id` IS NULL
//    atau yang sudah di bawahnya (assign ulang ke diri sendiri).
//    Tidak boleh mindahin staff leader lain ke dirinya.
const setStaffLeaderSchema = z.object({
  staffId: z.string().uuid("ID staff tidak valid."),
  newLeaderId: z.string().uuid("ID leader tidak valid."),
});

export async function setStaffLeader(
  _prev: AdminUserState,
  formData: FormData,
): Promise<AdminUserState> {
  let actor: Awaited<ReturnType<typeof requireTeamManager>>;
  try {
    actor = await requireTeamManager();
  } catch {
    return { error: "Anda tidak memiliki akses untuk aksi ini." };
  }

  const parsed = setStaffLeaderSchema.safeParse({
    staffId: formData.get("staffId"),
    newLeaderId: formData.get("newLeaderId"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { staffId, newLeaderId } = parsed.data;

  // Cari target (staff) saat ini
  const [target] = await db
    .select({
      id: profiles.id,
      role: profiles.role,
      username: profiles.username,
      leaderId: profiles.leaderId,
    })
    .from(profiles)
    .where(eq(profiles.id, staffId))
    .limit(1);
  if (!target) return { error: "Staff tidak ditemukan." };
  if (target.role !== "admin_staff") {
    return { error: "Target bukan Admin Staff." };
  }

  // Validasi newLeaderId adalah admin_leader
  const [newLeader] = await db
    .select({ id: profiles.id, role: profiles.role, username: profiles.username })
    .from(profiles)
    .where(eq(profiles.id, newLeaderId))
    .limit(1);
  if (!newLeader) {
    return { fieldErrors: { newLeaderId: ["Leader tidak ditemukan."] } };
  }
  if (newLeader.role !== "admin_leader") {
    return { fieldErrors: { newLeaderId: ["User yang dipilih bukan Admin Leader."] } };
  }

  // Pembatasan hak akses per-role
  if (actor.role === "admin_leader") {
    // Leader hanya boleh handle staff yang:
    //   - orphan (leader_id IS NULL), atau
    //   - sudah di bawahnya sendiri
    if (target.leaderId && target.leaderId !== actor.actorId) {
      return { error: "Anda hanya dapat mengelola staff di bawah Anda atau staff yang belum memiliki leader." };
    }
    // Dan hanya boleh assign ke diri sendiri
    if (newLeaderId !== actor.actorId) {
      return { fieldErrors: { newLeaderId: ["Leader hanya dapat menetapkan diri sendiri sebagai leader."] } };
    }
  }

  // Tidak ada perubahan yang perlu dilakukan jika leader sudah sama
  if (target.leaderId === newLeaderId) {
    refresh();
    return { success: true, message: `@${target.username} sudah berada di bawah @${newLeader.username}.`, targetId: staffId };
  }

  const oldLeaderId = target.leaderId;

  // Update profile (pakai updatedAt supaya trigger_updated_at konsisten)
  await db
    .update(profiles)
    .set({ leaderId: newLeaderId, updatedAt: new Date() })
    .where(eq(profiles.id, staffId));

  await db.insert(auditLogs).values({
    actorId: actor.actorId,
    targetId: staffId,
    action: "set_staff_leader",
    note: `Staff @${target.username} dipindahkan ke leader @${newLeader.username}.`,
    metadata: JSON.stringify({
      targetUsername: target.username,
      oldLeaderId,
      newLeaderId,
      newLeaderUsername: newLeader.username,
      byRole: actor.role,
    }),
  });

  revalidatePath("/admin/team");
  refresh();
  return {
    success: true,
    message: `Staff @${target.username} berhasil dikaitkan ke @${newLeader.username}.`,
    targetId: staffId,
  };
}
