"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath, refresh } from "next/cache";
import { z } from "zod";

import { isWithdrawLocked } from "@/lib/access";
import { getCurrentUser } from "@/lib/auth/session";
import { verifyWithdrawPassword } from "@/lib/crypto/withdraw-password";
import {
  MAX_WITHDRAWAL_AMOUNT,
  MIN_WITHDRAWAL_AMOUNT,
} from "@/lib/constants/withdrawal";
import { db } from "@/lib/db";
import { auditLogs, bankAccounts, profiles, withdrawals } from "@/lib/db/schema";

const withdrawSchema = z.object({
  bankAccountId: z
    .number({ message: "Pilih rekening tujuan." })
    .int()
    .positive("Rekening tidak valid."),
  amount: z
    .number({ message: "Nominal wajib diisi." })
    .min(
      MIN_WITHDRAWAL_AMOUNT,
      `Minimal penarikan Rp ${MIN_WITHDRAWAL_AMOUNT.toLocaleString("id-ID")}.`,
    )
    .max(
      MAX_WITHDRAWAL_AMOUNT,
      `Maksimal penarikan Rp ${MAX_WITHDRAWAL_AMOUNT.toLocaleString("id-ID")}.`,
    ),
  withdrawPassword: z
    .string()
    .min(6, "Kata sandi penarikan minimal 6 karakter."),
});

export type WithdrawState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
  success?: boolean;
};

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

export async function submitWithdrawal(
  _prev: WithdrawState,
  formData: FormData,
): Promise<WithdrawState> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { error: "Sesi habis, silakan login ulang." };
  }

  const parsed = withdrawSchema.safeParse({
    bankAccountId: Number(formData.get("bankAccountId")),
    amount: Number(String(formData.get("amount") ?? "").replace(/[^\d]/g, "")),
    withdrawPassword: formData.get("withdrawPassword"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  // Cek status akun: banned member tidak boleh withdraw
  const [me] = await db
    .select({
      status: profiles.status,
      withdrawLockReason: profiles.withdrawLockReason,
    })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);
  if (isWithdrawLocked(me)) {
    const reason = me.withdrawLockReason?.trim();
    return {
      error: reason
        ? `Penarikan Anda sedang diblokir. Alasan: ${reason}. Hubungi staff terkait untuk konfirmasi.`
        : "Akun Anda diblokir. Hubungi staff terkait untuk konfirmasi.",
    };
  }

  // Verifikasi sandi penarikan via bcrypt (hash disimpan di
  // `profiles.withdraw_password_hash`, diverifikasi di Node — bukan SQL).
  const [storedHash] = await db
    .select({ hash: profiles.withdrawPasswordHash })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);
  const ok = await verifyWithdrawPassword(
    parsed.data.withdrawPassword,
    storedHash?.hash,
  );
  if (!ok) {
    return {
      fieldErrors: { withdrawPassword: ["Kata sandi penarikan salah."] },
    };
  }

  // Cek rekening milik user
  const [bank] = await db
    .select({ id: bankAccounts.id })
    .from(bankAccounts)
    .where(
      and(
        eq(bankAccounts.id, parsed.data.bankAccountId),
        eq(bankAccounts.userId, user.id),
      ),
    )
    .limit(1);
  if (!bank) {
    return { fieldErrors: { bankAccountId: ["Rekening tidak ditemukan."] } };
  }

  // Cek saldo cukup (atomic check + decrement via SQL expression di Drizzle).
  const amountStr = parsed.data.amount.toFixed(2);
  const updated = await db
    .update(profiles)
    .set({
      balance: sql`${profiles.balance} - ${amountStr}::numeric`,
      frozenBalance: sql`${profiles.frozenBalance} + ${amountStr}::numeric`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(profiles.id, user.id),
        sql`${profiles.balance} >= ${amountStr}::numeric`,
      ),
    )
    .returning({ id: profiles.id, balance: profiles.balance });

  if (updated.length === 0) {
    return { error: "Saldo tidak cukup." };
  }

  // Insert withdrawal row
  const [created] = await db.insert(withdrawals).values({
    memberId: user.id,
    bankAccountId: parsed.data.bankAccountId,
    amount: amountStr,
    status: "pending",
  }).returning({ id: withdrawals.id });

  await db.insert(auditLogs).values({
    actorId: user.id,
    targetId: user.id,
    action: "withdrawal_submitted",
    amount: amountStr,
    note: `Pengajuan penarikan #${created.id} dibuat.`,
    metadata: JSON.stringify({
      withdrawalId: created.id,
      amount: parsed.data.amount,
    }),
  });

  revalidatePath("/withdraw");
  revalidatePath("/profil");
  revalidatePath("/profil/withdrawlist");
  revalidatePath("/admin/withdrawlist");
  refresh();
  return { success: true };
}
