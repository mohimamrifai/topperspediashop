"use server";

import { eq } from "drizzle-orm";
import { revalidatePath, refresh } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { auth } from "@/lib/auth";
import {
  hashWithdrawPassword,
  verifyWithdrawPassword,
} from "@/lib/crypto/withdraw-password";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";

const loginSchema = z
  .object({
    currentPassword: z.string().min(1, "Kata sandi lama wajib diisi."),
    newPassword: z
      .string()
      .min(6, "Kata sandi baru minimal 6 karakter.")
      .max(72, "Kata sandi terlalu panjang (maks 72 karakter)."),
    confirmPassword: z.string().min(1, "Konfirmasi kata sandi wajib diisi."),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Konfirmasi kata sandi tidak cocok.",
    path: ["confirmPassword"],
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    message: "Kata sandi baru tidak boleh sama dengan yang lama.",
    path: ["newPassword"],
  });

const withdrawSchema = z
  .object({
    currentPassword: z.string().min(1, "Sandi penarikan lama wajib diisi."),
    newPassword: z
      .string()
      .min(6, "Sandi penarikan baru minimal 6 karakter.")
      .max(72, "Sandi penarikan terlalu panjang (maks 72 karakter)."),
    confirmPassword: z.string().min(1, "Konfirmasi sandi wajib diisi."),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Konfirmasi sandi tidak cocok.",
    path: ["confirmPassword"],
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    message: "Sandi baru tidak boleh sama dengan yang lama.",
    path: ["newPassword"],
  });

export type ChangePasswordState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
  success?: boolean;
  message?: string;
};

async function requireUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("UNAUTHENTICATED");
  return { user: session.user };
}

export async function changeLoginPassword(
  _prev: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const parsed = loginSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await requireUser();
  } catch {
    return { error: "Sesi habis, silakan login ulang." };
  }

  try {
    await auth.api.changePassword({
      body: {
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.newPassword,
        revokeOtherSessions: false,
      },
      headers: await headers(),
    });
  } catch {
    return { fieldErrors: { currentPassword: ["Kata sandi lama salah."] } };
  }

  revalidatePath("/profil/change-password");
  refresh();
  return { success: true, message: "Kata sandi masuk berhasil diperbarui." };
}

export async function changeWithdrawPassword(
  _prev: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const parsed = withdrawSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  let user;
  try {
    const ctx = await requireUser();
    user = ctx.user;
  } catch {
    return { error: "Sesi habis, silakan login ulang." };
  }

  // Verifikasi sandi penarikan lama via bcrypt (Node), bukan SQL.
  const [stored] = await db
    .select({ hash: profiles.withdrawPasswordHash })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);
  const ok = await verifyWithdrawPassword(
    parsed.data.currentPassword,
    stored?.hash,
  );
  if (!ok) {
    return { fieldErrors: { currentPassword: ["Sandi penarikan lama salah."] } };
  }

  const newHash = await hashWithdrawPassword(parsed.data.newPassword);
  const updated = await db
    .update(profiles)
    .set({ withdrawPasswordHash: newHash, updatedAt: new Date() })
    .where(eq(profiles.id, user.id))
    .returning({ id: profiles.id });
  if (updated.length === 0) {
    return { error: "Gagal memperbarui sandi penarikan." };
  }

  revalidatePath("/profil/change-password");
  refresh();
  return { success: true, message: "Sandi penarikan berhasil diperbarui." };
}
