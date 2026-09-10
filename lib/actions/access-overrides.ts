"use server";

import { eq } from "drizzle-orm";
import { revalidatePath, refresh } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { auditLogs, profiles } from "@/lib/db/schema";
import { getCurrentProfile } from "@/lib/auth/session";

export type AccessOverrideState = {
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

const overrideSchema = z.object({
  targetId: z.string().uuid("ID admin tidak valid."),
  fullAccess: z
    .union([z.literal("on"), z.literal("off"), z.literal("")])
    .optional()
    .transform((v) => v === "on"),
  canCreateStaff: z
    .union([z.literal("on"), z.literal("off"), z.literal("")])
    .optional()
    .transform((v) => v === "on"),
  canCreateLeader: z
    .union([z.literal("on"), z.literal("off"), z.literal("")])
    .optional()
    .transform((v) => v === "on"),
  commissionEdit: z
    .union([z.literal("on"), z.literal("off"), z.literal("")])
    .optional()
    .transform((v) => v === "on"),
  depositBankCrud: z
    .union([z.literal("on"), z.literal("off"), z.literal("")])
    .optional()
    .transform((v) => v === "on"),
  channelCrud: z
    .union([z.literal("on"), z.literal("off"), z.literal("")])
    .optional()
    .transform((v) => v === "on"),
});

export async function setAccessOverrides(
  _prev: AccessOverrideState,
  formData: FormData,
): Promise<AccessOverrideState> {
  let superId: string;
  try {
    superId = await requireSuperAdmin();
  } catch {
    return { error: "Hanya Super Admin yang dapat mengatur izin akses." };
  }

  const parsed = overrideSchema.safeParse({
    targetId: formData.get("targetId"),
    fullAccess: formData.get("fullAccess") || "off",
    canCreateStaff: formData.get("canCreateStaff") || "off",
    canCreateLeader: formData.get("canCreateLeader") || "off",
    commissionEdit: formData.get("commissionEdit") || "off",
    depositBankCrud: formData.get("depositBankCrud") || "off",
    channelCrud: formData.get("channelCrud") || "off",
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { targetId, ...flags } = parsed.data;

  // Cari target
  const [target] = await db
    .select({
      id: profiles.id,
      role: profiles.role,
      username: profiles.username,
    })
    .from(profiles)
    .where(eq(profiles.id, targetId))
    .limit(1);
  if (!target) return { error: "Admin tidak ditemukan." };
  if (target.role === "super_admin") {
    return { error: "Tidak dapat mengubah izin Super Admin." };
  }
  if (target.role === "member") {
    return { error: "Target bukan admin." };
  }

  // Bangun objek override (hanya simpan flag yang true untuk hemat ruang)
  const overrides = {
    ...(flags.fullAccess ? { fullAccess: true } : {}),
    ...(flags.canCreateStaff ? { canCreateStaff: true } : {}),
    ...(flags.canCreateLeader ? { canCreateLeader: true } : {}),
    ...(flags.commissionEdit ? { commissionEdit: true } : {}),
    ...(flags.depositBankCrud ? { depositBankCrud: true } : {}),
    ...(flags.channelCrud ? { channelCrud: true } : {}),
  };

  await db
    .update(profiles)
    .set({ accessOverrides: overrides, updatedAt: new Date() })
    .where(eq(profiles.id, targetId));

  await db.insert(auditLogs).values({
    actorId: superId,
    targetId,
    action: "set_access_overrides",
    note: `Izin akses @${target.username} diperbarui.`,
    metadata: JSON.stringify({ username: target.username, overrides }),
  });

  revalidatePath("/admin/permissions");
  refresh();
  return { success: true, message: `Izin akses @${target.username} berhasil disimpan.` };
}
