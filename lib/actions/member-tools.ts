"use server";

import { eq, inArray, sql } from "drizzle-orm";
import { revalidatePath, refresh } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { assertCanAccessMember, getScope } from "@/lib/access";
import { auth } from "@/lib/auth";
import { requireCurrentAdminProfile } from "@/lib/auth/session";
import { hashWithdrawPassword } from "@/lib/crypto/withdraw-password";
import { db } from "@/lib/db";
import { auditLogs, profiles } from "@/lib/db/schema";

export type MemberToolState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
  success?: boolean;
  message?: string;
};

async function requireAdmin(): Promise<string> {
  return (await requireCurrentAdminProfile()).id;
}

function handleAuthError(e: unknown): MemberToolState {
  const msg = (e as Error).message;
  if (msg === "FORBIDDEN") return { error: "Anda tidak memiliki akses admin." };
  if (msg === "FORBIDDEN_SCOPE")
    return { error: "Member ini bukan bagian dari tim Anda." };
  return { error: "Sesi habis, silakan login ulang." };
}

/**
 * Validasi bahwa admin boleh mengakses target member (sesuai scope).
 * Throw `FORBIDDEN_SCOPE` jika di luar scope, `UNAUTHENTICATED` jika tidak login.
 */
async function assertScopeForMember(memberId: string): Promise<void> {
  const profile = await requireCurrentAdminProfile();
  const scope = await getScope(profile.id);
  if (!scope) throw new Error("FORBIDDEN");
  try {
    assertCanAccessMember(scope, memberId);
  } catch {
    throw new Error("FORBIDDEN_SCOPE");
  }
}

async function loadMember(memberId: string) {
  const [member] = await db
    .select({
      id: profiles.id,
      role: profiles.role,
      level: profiles.level,
    })
    .from(profiles)
    .where(eq(profiles.id, memberId))
    .limit(1);
  return member;
}

// 1. Update level member
const levelSchema = z.object({
  memberId: z.string().uuid("ID anggota tidak valid."),
  level: z.enum(
    ["classic", "silver", "gold", "platinum", "diamond", "premier"],
    { message: "Level tidak valid." },
  ),
});

export async function updateMemberLevel(
  _prev: MemberToolState,
  formData: FormData,
): Promise<MemberToolState> {
  let adminId: string;
  try {
    adminId = await requireAdmin();
  } catch (e) {
    return handleAuthError(e);
  }

  const parsed = levelSchema.safeParse({
    memberId: formData.get("memberId"),
    level: formData.get("level"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await assertScopeForMember(parsed.data.memberId);
  } catch (e) {
    return handleAuthError(e);
  }

  const member = await loadMember(parsed.data.memberId);
  if (!member) return { error: "Anggota tidak ditemukan." };
  if (member.role !== "member") {
    return { error: "Hanya anggota dengan role member yang dapat diubah levelnya." };
  }

  const updated = await db
    .update(profiles)
    .set({ level: parsed.data.level, updatedAt: new Date() })
    .where(eq(profiles.id, parsed.data.memberId))
    .returning({ id: profiles.id });

  if (!updated.length) return { error: "Gagal memperbarui level." };

  await db.insert(auditLogs).values({
    actorId: adminId,
    targetId: parsed.data.memberId,
    action: "update_level",
    note: `Level diubah ke ${parsed.data.level}`,
    metadata: JSON.stringify({ newLevel: parsed.data.level }),
  });

  revalidatePath("/admin/users");
  refresh();
  return { success: true, message: "Level anggota berhasil diperbarui." };
}

// 2. Update credit score
const creditScoreSchema = z.object({
  memberId: z.string().uuid("ID anggota tidak valid."),
  creditScore: z.coerce
    .number({ message: "Skor kredit wajib diisi." })
    .int("Skor kredit harus bilangan bulat.")
    .min(0, "Skor kredit minimal 0.")
    .max(1000, "Skor kredit maksimal 1000."),
});

export async function updateMemberCreditScore(
  _prev: MemberToolState,
  formData: FormData,
): Promise<MemberToolState> {
  let adminId: string;
  try {
    adminId = await requireAdmin();
  } catch (e) {
    return handleAuthError(e);
  }

  const parsed = creditScoreSchema.safeParse({
    memberId: formData.get("memberId"),
    creditScore: formData.get("creditScore"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await assertScopeForMember(parsed.data.memberId);
  } catch (e) {
    return handleAuthError(e);
  }

  const updated = await db
    .update(profiles)
    .set({ creditScore: parsed.data.creditScore, updatedAt: new Date() })
    .where(eq(profiles.id, parsed.data.memberId))
    .returning({ id: profiles.id });

  if (!updated.length) return { error: "Anggota tidak ditemukan." };

  await db.insert(auditLogs).values({
    actorId: adminId,
    targetId: parsed.data.memberId,
    action: "update_credit_score",
    note: `Skor kredit diubah ke ${parsed.data.creditScore}`,
    metadata: JSON.stringify({ newScore: parsed.data.creditScore }),
  });

  revalidatePath("/admin/users");
  refresh();
  return { success: true, message: "Skor kredit berhasil diperbarui." };
}

// 3. Adjust saldo (bisa + atau -)
const balanceSchema = z.object({
  memberId: z.string().uuid("ID anggota tidak valid."),
  amount: z.coerce
    .number({ message: "Nominal wajib diisi." })
    .refine((n) => n !== 0, "Nominal tidak boleh nol."),
});

export async function adjustMemberBalance(
  _prev: MemberToolState,
  formData: FormData,
): Promise<MemberToolState> {
  let adminId: string;
  try {
    adminId = await requireAdmin();
  } catch (e) {
    return handleAuthError(e);
  }

  const parsed = balanceSchema.safeParse({
    memberId: formData.get("memberId"),
    amount: formData.get("amount"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await assertScopeForMember(parsed.data.memberId);
  } catch (e) {
    return handleAuthError(e);
  }

  const amountStr = parsed.data.amount.toFixed(2);
  const op = parsed.data.amount > 0 ? "+" : "-";

  // Atomic update: tambah/kurangi balance (ekspresi SQL di Drizzle, bukan raw).
  const result = await db
    .update(profiles)
    .set({
      balance: sql`${profiles.balance} + ${amountStr}::numeric`,
      updatedAt: sql`now()`,
    })
    .where(
      sql`${profiles.id} = ${parsed.data.memberId} AND (${parsed.data.amount}::numeric >= 0 OR ${profiles.balance} + ${amountStr}::numeric >= 0)`,
    )
    .returning({ id: profiles.id, balance: profiles.balance });

  if (result.length === 0) {
    return { error: "Gagal memperbarui saldo (saldo tidak boleh negatif)." };
  }

  await db.insert(auditLogs).values({
    actorId: adminId,
    targetId: parsed.data.memberId,
    action: "adjust_balance",
    amount: amountStr,
    note: `${op === "+" ? "Penambahan" : "Pengurangan"} saldo oleh admin.`,
    metadata: JSON.stringify({ delta: parsed.data.amount, newBalance: result[0].balance }),
  });

  revalidatePath("/admin/users");
  revalidatePath("/profil");
  revalidatePath("/withdraw");
  refresh();
  return { success: true, message: "Saldo anggota berhasil diperbarui." };
}

// 4. Reset password login
const resetLoginSchema = z.object({
  memberId: z.string().uuid("ID anggota tidak valid."),
  newPassword: z
    .string()
    .min(8, "Kata sandi baru minimal 8 karakter.")
    .max(72, "Kata sandi terlalu panjang (maks 72 karakter)."),
});

export async function resetMemberLoginPassword(
  _prev: MemberToolState,
  formData: FormData,
): Promise<MemberToolState> {
  let adminId: string;
  try {
    adminId = await requireAdmin();
  } catch (e) {
    return handleAuthError(e);
  }

  const parsed = resetLoginSchema.safeParse({
    memberId: formData.get("memberId"),
    newPassword: formData.get("newPassword"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await assertScopeForMember(parsed.data.memberId);
  } catch (e) {
    return handleAuthError(e);
  }

  try {
    await auth.api.setUserPassword({
      headers: await headers(),
      body: {
        userId: parsed.data.memberId,
        newPassword: parsed.data.newPassword,
      },
    });
  } catch (error) {
    return { error: `Gagal memperbarui kata sandi: ${(error as Error).message}` };
  }

  await db.insert(auditLogs).values({
    actorId: adminId,
    targetId: parsed.data.memberId,
    action: "reset_login_password",
    note: "Kata sandi login direset oleh admin.",
  });

  revalidatePath("/admin/users");
  refresh();
  return { success: true, message: "Kata sandi login berhasil direset." };
}

// 5. Reset password penarikan (withdraw_password_hash)
const resetWithdrawSchema = z.object({
  memberId: z.string().uuid("ID anggota tidak valid."),
  newPassword: z
    .string()
    .min(6, "Kata sandi penarikan minimal 6 karakter.")
    .max(72, "Kata sandi terlalu panjang (maks 72 karakter)."),
});

export async function resetMemberWithdrawPassword(
  _prev: MemberToolState,
  formData: FormData,
): Promise<MemberToolState> {
  let adminId: string;
  try {
    adminId = await requireAdmin();
  } catch (e) {
    return handleAuthError(e);
  }

  const parsed = resetWithdrawSchema.safeParse({
    memberId: formData.get("memberId"),
    newPassword: formData.get("newPassword"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await assertScopeForMember(parsed.data.memberId);
  } catch (e) {
    return handleAuthError(e);
  }

  // Hash via bcrypt (Node) — sama dengan helper yang dipakai sign-up.
  const newHash = await hashWithdrawPassword(parsed.data.newPassword);
  const result = await db
    .update(profiles)
    .set({ withdrawPasswordHash: newHash, updatedAt: new Date() })
    .where(eq(profiles.id, parsed.data.memberId))
    .returning({ id: profiles.id });

  if (result.length === 0) return { error: "Anggota tidak ditemukan." };

  await db.insert(auditLogs).values({
    actorId: adminId,
    targetId: parsed.data.memberId,
    action: "reset_withdraw_password",
    note: "Kata sandi penarikan direset oleh admin.",
  });

  revalidatePath("/admin/users");
  refresh();
  return { success: true, message: "Kata sandi penarikan berhasil direset." };
}

// 6. Set status penarikan (lock/unlock + alasan penguncian)
const setWithdrawLockSchema = z.object({
  memberId: z.string().uuid("ID anggota tidak valid."),
  lock: z.enum(["true", "false"]).transform((v) => v === "true"),
  reason: z
    .string()
    .trim()
    .min(3, "Alasan minimal 3 karakter.")
    .max(500, "Alasan terlalu panjang (maks 500 karakter).")
    .optional()
    .or(z.literal("")),
});

export async function setMemberWithdrawLock(
  _prev: MemberToolState,
  formData: FormData,
): Promise<MemberToolState> {
  let adminId: string;
  try {
    adminId = await requireAdmin();
  } catch (e) {
    return handleAuthError(e);
  }

  const parsed = setWithdrawLockSchema.safeParse({
    memberId: formData.get("memberId"),
    lock: formData.get("lock"),
    reason: formData.get("reason") ?? "",
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  // Alasan wajib saat mengunci penarikan
  if (parsed.data.lock && (!parsed.data.reason || parsed.data.reason.length < 3)) {
    return { fieldErrors: { reason: ["Alasan penguncian wajib diisi."] } };
  }

  try {
    await assertScopeForMember(parsed.data.memberId);
  } catch (e) {
    return handleAuthError(e);
  }

  const newStatus = parsed.data.lock ? "banned" : "online";
  const newReason = parsed.data.lock
    ? (parsed.data.reason && parsed.data.reason.length > 0
      ? parsed.data.reason
      : null)
    : null;
  const updated = await db
    .update(profiles)
    .set({
      status: newStatus,
      withdrawLockReason: newReason,
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, parsed.data.memberId))
    .returning({ id: profiles.id });

  if (!updated.length) return { error: "Gagal memperbarui status penarikan." };

  const actionType = parsed.data.lock ? "withdraw_locked" : "withdraw_unlocked";
  const noteText = parsed.data.lock
    ? `Penarikan diblokir. Alasan: ${parsed.data.reason}`
    : "Penarikan dibuka kembali oleh admin.";

  await db.insert(auditLogs).values({
    actorId: adminId,
    targetId: parsed.data.memberId,
    action: actionType,
    note: noteText,
    metadata: JSON.stringify({
      lock: parsed.data.lock,
      reason: parsed.data.reason ?? null,
    }),
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin/member-ip");
  revalidatePath("/profil");
  revalidatePath("/withdraw");
  refresh();
  return {
    success: true,
    message: parsed.data.lock
      ? "Penarikan anggota berhasil diblokir."
      : "Penarikan anggota berhasil dibuka.",
  };
}

/**
 * Backward-compatible alias untuk test/unit lama.
 * Behaviour sama dengan `setMemberWithdrawLock`.
 */
export const setMemberStatus = setMemberWithdrawLock;

const bulkLockSchema = z.object({
  memberIds: z
    .string()
    .transform((raw) => JSON.parse(raw) as string[])
    .pipe(z.array(z.string().uuid()).min(1, "Tidak ada member yang dipilih.")),
  reason: z.string().min(3, "Alasan penguncian wajib diisi."),
});

/**
 * Kunci penarikan beberapa member sekaligus (mis. dari halaman Cek IP Member).
 */
export async function bulkLockMemberWithdrawals(
  _prev: MemberToolState,
  formData: FormData,
): Promise<MemberToolState> {
  let adminId: string;
  try {
    adminId = await requireAdmin();
  } catch (e) {
    return handleAuthError(e);
  }

  const parsed = bulkLockSchema.safeParse({
    memberIds: formData.get("memberIds"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const uniqueIds = [...new Set(parsed.data.memberIds)];

  try {
    for (const memberId of uniqueIds) {
      await assertScopeForMember(memberId);
    }
  } catch (e) {
    return handleAuthError(e);
  }

  const updated = await db
    .update(profiles)
    .set({
      status: "banned",
      withdrawLockReason: parsed.data.reason,
      updatedAt: new Date(),
    })
    .where(inArray(profiles.id, uniqueIds))
    .returning({ id: profiles.id, username: profiles.username });

  if (!updated.length) {
    return { error: "Gagal mengunci penarikan member." };
  }

  await db.insert(auditLogs).values(
    updated.map((row) => ({
      actorId: adminId,
      targetId: row.id,
      action: "withdraw_locked",
      note: `Penarikan diblokir (bulk IP duplikat). Alasan: ${parsed.data.reason}`,
      metadata: JSON.stringify({
        lock: true,
        reason: parsed.data.reason,
        source: "member_ip_bulk",
        username: row.username,
      }),
    })),
  );

  revalidatePath("/admin/users");
  revalidatePath("/admin/member-ip");
  revalidatePath("/profil");
  revalidatePath("/withdraw");
  refresh();
  return {
    success: true,
    message: `Penarikan ${updated.length} anggota berhasil dikunci.`,
  };
}
