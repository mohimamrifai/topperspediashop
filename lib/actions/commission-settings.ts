"use server";

import { revalidatePath, refresh } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { auditLogs, commissionSettings, type CommissionSetting } from "@/lib/db/schema";
import { revalidateCommissionCache } from "@/lib/levels";
import { getCurrentUser } from "@/lib/auth/session";

export type CommissionSettingsState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
  success?: boolean;
  message?: string;
};

async function requireSuperAdminOrOverride(): Promise<string> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");

  const { getScope } = await import("@/lib/access");
  const scope = await getScope(user.id);
  if (!scope) throw new Error("FORBIDDEN");
  if (scope.role !== "super_admin" && scope.overrides.commissionEdit !== true) {
    throw new Error("FORBIDDEN");
  }
  return user.id;
}

const levelEnum = z.enum([
  "classic",
  "silver",
  "gold",
  "platinum",
  "diamond",
  "premier",
]);

const updateSchema = z.object({
  level: levelEnum,
  percent: z.coerce.number().min(0).max(100, "Maksimal 100%."),
});

export async function updateCommissionSetting(
  _prev: CommissionSettingsState,
  formData: FormData,
): Promise<CommissionSettingsState> {
  let actorId: string;
  try {
    actorId = await requireSuperAdminOrOverride();
  } catch {
    return { error: "Hanya Super Admin (atau yang punya izin) yang dapat mengatur komisi." };
  }

  const parsed = updateSchema.safeParse({
    level: formData.get("level"),
    percent: formData.get("percent"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { level, percent } = parsed.data;
  const percentStr = percent.toFixed(2);

  // Upsert
  await db
    .insert(commissionSettings)
    .values({ level, percent: percentStr, updatedBy: actorId })
    .onConflictDoUpdate({
      target: commissionSettings.level,
      set: { percent: percentStr, updatedBy: actorId, updatedAt: new Date() },
    });

  await db.insert(auditLogs).values({
    actorId,
    targetId: actorId, // self-reference: target adalah setting global, bukan user tertentu
    action: "update_commission_setting",
    note: `Komisi level ${level} diubah ke ${percentStr}%.`,
    metadata: JSON.stringify({ level, percent: percentStr }),
  });

  revalidateCommissionCache();
  revalidatePath("/admin/commission/settings");
  revalidatePath("/admin/commission");

  refresh();

  return { success: true, message: `Komisi level ${level} disimpan (${percentStr}%).` };
}

export async function getAllCommissionSettings(): Promise<CommissionSetting[]> {
  return await db.select().from(commissionSettings);
}
