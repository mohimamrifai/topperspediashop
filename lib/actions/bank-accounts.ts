"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { bankAccounts } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

const bankAccountSchema = z.object({
  bankName: z
    .string()
    .trim()
    .min(1, "Nama bank wajib diisi.")
    .max(60, "Nama bank maksimal 60 karakter."),
  accountName: z
    .string()
    .trim()
    .min(1, "Nama pemilik wajib diisi.")
    .max(100, "Nama pemilik maksimal 100 karakter."),
  accountNumber: z
    .string()
    .trim()
    .min(4, "Nomor rekening minimal 4 digit.")
    .max(30, "Nomor rekening maksimal 30 digit.")
    .regex(/^[0-9]+$/, "Nomor rekening hanya angka."),
  backupPhone: z
    .string()
    .trim()
    .max(20, "Nomor ponsel maksimal 20 karakter.")
    .regex(/^[0-9+]+$/, "Nomor ponsel tidak valid.")
    .optional()
    .or(z.literal("")),
});

export type BankAccountState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
};

async function requireUserId() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user.id;
}

export async function addBankAccount(
  _prev: BankAccountState,
  formData: FormData,
): Promise<BankAccountState> {
  const parsed = bankAccountSchema.safeParse({
    bankName: formData.get("bankName"),
    accountName: formData.get("accountName"),
    accountNumber: formData.get("accountNumber"),
    backupPhone: formData.get("backupPhone") || undefined,
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { error: "Sesi habis, silakan login ulang." };
  }

  // Cek apakah ini rekening pertama user → set primary
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(bankAccounts)
    .where(eq(bankAccounts.userId, userId));

  await db.insert(bankAccounts).values({
    userId,
    bankName: parsed.data.bankName,
    accountName: parsed.data.accountName,
    accountNumber: parsed.data.accountNumber,
    backupPhone: parsed.data.backupPhone || null,
    isPrimary: count === 0,
  });

  revalidatePath("/bank");
  revalidatePath("/withdraw");
  revalidatePath("/profil");
  revalidatePath("/admin/account");
  return {};
}

export async function deleteBankAccount(
  _prev: BankAccountState,
  formData: FormData,
): Promise<BankAccountState> {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return { error: "ID rekening tidak valid." };
  }

  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { error: "Sesi habis, silakan login ulang." };
  }

  // Ambil data rekening untuk dicek primary & untuk demote primary
  const [target] = await db
    .select()
    .from(bankAccounts)
    .where(and(eq(bankAccounts.id, id), eq(bankAccounts.userId, userId)))
    .limit(1);

  if (!target) return { error: "Rekening tidak ditemukan." };

  await db
    .delete(bankAccounts)
    .where(and(eq(bankAccounts.id, id), eq(bankAccounts.userId, userId)));

  // Jika yang dihapus adalah primary, promote rekening lain (terbaru) jadi primary
  if (target.isPrimary) {
    const [next] = await db
      .select({ id: bankAccounts.id })
      .from(bankAccounts)
      .where(eq(bankAccounts.userId, userId))
      .orderBy(sql`${bankAccounts.createdAt} DESC`)
      .limit(1);
    if (next) {
      await db
        .update(bankAccounts)
        .set({ isPrimary: true, updatedAt: new Date() })
        .where(eq(bankAccounts.id, next.id));
    }
  }

  revalidatePath("/bank");
  revalidatePath("/withdraw");
  revalidatePath("/profil");
  revalidatePath("/admin/account");
  return {};
}

export async function updateBankAccount(
  _prev: BankAccountState,
  formData: FormData,
): Promise<BankAccountState> {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return { error: "ID rekening tidak valid." };
  }

  const parsed = bankAccountSchema.safeParse({
    bankName: formData.get("bankName"),
    accountName: formData.get("accountName"),
    accountNumber: formData.get("accountNumber"),
    backupPhone: formData.get("backupPhone") || undefined,
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { error: "Sesi habis, silakan login ulang." };
  }

  const updated = await db
    .update(bankAccounts)
    .set({
      bankName: parsed.data.bankName,
      accountName: parsed.data.accountName,
      accountNumber: parsed.data.accountNumber,
      backupPhone: parsed.data.backupPhone || null,
      updatedAt: new Date(),
    })
    .where(and(eq(bankAccounts.id, id), eq(bankAccounts.userId, userId)))
    .returning({ id: bankAccounts.id });

  if (!updated.length) {
    return { error: "Rekening tidak ditemukan." };
  }

  revalidatePath("/bank");
  revalidatePath("/withdraw");
  revalidatePath("/profil");
  revalidatePath("/admin/account");
  return {};
}

export async function setPrimaryBankAccount(
  _prev: BankAccountState,
  formData: FormData,
): Promise<BankAccountState> {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return { error: "ID rekening tidak valid." };
  }

  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { error: "Sesi habis, silakan login ulang." };
  }

  // Verify ownership
  const [target] = await db
    .select({ id: bankAccounts.id })
    .from(bankAccounts)
    .where(and(eq(bankAccounts.id, id), eq(bankAccounts.userId, userId)))
    .limit(1);
  if (!target) return { error: "Rekening tidak ditemukan." };

  // Unset semua primary, set yang baru
  await db
    .update(bankAccounts)
    .set({ isPrimary: false, updatedAt: new Date() })
    .where(eq(bankAccounts.userId, userId));

  await db
    .update(bankAccounts)
    .set({ isPrimary: true, updatedAt: new Date() })
    .where(eq(bankAccounts.id, id));

  revalidatePath("/bank");
  revalidatePath("/withdraw");
  revalidatePath("/profil");
  revalidatePath("/admin/account");
  return {};
}
