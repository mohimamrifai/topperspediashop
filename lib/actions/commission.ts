"use server";

import { eq } from "drizzle-orm";
import { revalidatePath, refresh } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { auditLogs, profiles } from "@/lib/db/schema";
import { getCurrentProfile } from "@/lib/auth/session";

export type CommissionState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
  success?: boolean;
  message?: string;
};

async function requireSuperAdmin(): Promise<string> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "super_admin") {
    throw new Error("FORBIDDEN");
  }
  return profile.id;
}

const setRateSchema = z.object({
  staffId: z.string().uuid("ID staff tidak valid."),
  /**
   * Kirim string kosong untuk menonaktifkan komisi (null di DB).
   * Kirim 0-100 untuk set persentase.
   */
  rate: z
    .union([z.literal(""), z.coerce.number().min(0).max(100, "Maksimal 100%.")])
    .optional(),
});

export async function setStaffCommissionRate(
  _prev: CommissionState,
  formData: FormData,
): Promise<CommissionState> {
  let superId: string;
  try {
    superId = await requireSuperAdmin();
  } catch {
    return { error: "Hanya Super Admin yang dapat mengatur rate komisi." };
  }

  const parsed = setRateSchema.safeParse({
    staffId: formData.get("staffId"),
    rate: formData.get("rate") || "",
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { staffId, rate } = parsed.data;

  // Verifikasi target adalah admin_staff
  const [target] = await db
    .select({ id: profiles.id, role: profiles.role, username: profiles.username })
    .from(profiles)
    .where(eq(profiles.id, staffId))
    .limit(1);
  if (!target) return { error: "Staff tidak ditemukan." };
  if (target.role !== "admin_staff") {
    return { error: "Target bukan Admin Staff." };
  }

  // Normalisasi: string kosong → null
  const newRate = rate === "" || rate === undefined ? null : String(rate);

  await db
    .update(profiles)
    .set({ commissionRate: newRate, updatedAt: new Date() })
    .where(eq(profiles.id, staffId));

  await db.insert(auditLogs).values({
    actorId: superId,
    targetId: staffId,
    action: "set_commission_rate",
    note:
      newRate === null
        ? `Komisi @${target.username} dinonaktifkan.`
        : `Komisi @${target.username} diatur ke ${newRate}%.`,
    metadata: JSON.stringify({
      username: target.username,
      rate: newRate,
    }),
  });

  revalidatePath("/admin/commission");
  revalidatePath("/admin/staff");
  refresh();
  return {
    success: true,
    message:
      newRate === null
        ? `Komisi @${target.username} dinonaktifkan.`
        : `Komisi @${target.username} diatur ke ${newRate}%.`,
  };
}
