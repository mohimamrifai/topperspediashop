"use server";

import { revalidatePath, refresh } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { auditLogs, deposits } from "@/lib/db/schema";
import { attachUploadedFileToDeposit, isAllowedImageMime, saveUploadedFile } from "@/lib/storage/local-storage";
import { getCurrentUser } from "@/lib/auth/session";

const depositSchema = z.object({
  amount: z
    .number({ message: "Nominal wajib diisi." })
    .min(30000, "Minimal isi ulang Rp 30.000.")
    .max(100_000_000, "Maksimal isi ulang Rp 100.000.000."),
});

export type DepositState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
  success?: boolean;
};

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function submitDeposit(
  _prev: DepositState,
  formData: FormData,
): Promise<DepositState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sesi habis, silakan login ulang." };

  // Parse amount
  const amountStr = String(formData.get("amount") ?? "").replace(/[^\d]/g, "");
  const amount = Number(amountStr);
  const parsed = depositSchema.safeParse({ amount });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  // Validate file
  const file = formData.get("proof");
  if (!(file instanceof File) || file.size === 0) {
    return { fieldErrors: { proof: ["Bukti transfer wajib diunggah."] } };
  }
  if (file.size > MAX_SIZE) {
    return { fieldErrors: { proof: ["Ukuran file maksimal 5MB."] } };
  }
  if (!isAllowedImageMime(file.type)) {
    return { fieldErrors: { proof: ["Format harus JPG, PNG, atau WEBP."] } };
  }

  const saved = await saveUploadedFile({
    file,
    category: "deposit-proof",
    visibility: "private",
    ownerUserId: user.id,
    createdBy: user.id,
  });

  const [createdDeposit] = await db.insert(deposits).values({
    memberId: user.id,
    amount: amount.toFixed(2),
    proofUrl: saved.url,
    status: "pending",
  }).returning({ id: deposits.id });

  await attachUploadedFileToDeposit(saved.id, createdDeposit.id);

  await db.insert(auditLogs).values({
    actorId: user.id,
    targetId: user.id,
    action: "deposit_submitted",
    amount: amount.toFixed(2),
    note: `Pengajuan deposit #${createdDeposit.id} dibuat.`,
    metadata: JSON.stringify({
      depositId: createdDeposit.id,
      amount,
    }),
  });

  revalidatePath("/recharge");
  revalidatePath("/profil");
  revalidatePath("/admin/rechargelist");
  refresh();
  return { success: true };
}
