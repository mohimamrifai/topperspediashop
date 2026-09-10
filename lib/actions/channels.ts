"use server";

import { eq } from "drizzle-orm";
import { revalidatePath, refresh } from "next/cache";
import { z } from "zod";

import { type Scope, getScope } from "@/lib/access";
import { db } from "@/lib/db";
import { auditLogs, customerServiceChannels } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

const channelSchema = z.object({
  type: z.enum(["whatsapp", "telegram"], {
    message: "Pilih jenis channel.",
  }),
  label: z
    .string()
    .trim()
    .min(2, "Label minimal 2 karakter.")
    .max(80, "Label maksimal 80 karakter."),
  url: z
    .string()
    .trim()
    .url("URL tidak valid.")
    .max(500, "URL terlalu panjang."),
  isActive: z
    .union([z.literal("on"), z.literal("true"), z.literal("false"), z.literal("")])
    .optional()
    .transform((v) => v === "on" || v === "true"),
  sortOrder: z
    .union([z.literal(""), z.coerce.number().int()])
    .optional()
    .transform((v) => (v === "" || v == null ? 0 : Number(v))),
});

export type ChannelState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
  saved?: {
    id: number;
    type: "whatsapp" | "telegram";
    label: string;
    url: string;
    isActive: boolean;
    sortOrder: number;
  };
};

/**
 * Pemeriksaan peran + override untuk aksi CRUD channel pelayanan.
 * Yang boleh: super_admin (selalu), atau siapa pun yang punya override
 * `channelCrud = true` di `access_overrides` (termasuk admin_leader /
 * admin_staff yang diizinkan oleh Super Admin).
 * Role `admin_leader`/`admin_staff` tanpa override ditolak.
 */
async function requireChannelManager(): Promise<{ actorId: string; scope: Scope }> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");

  const scope = await getScope(user.id);
  if (!scope) throw new Error("FORBIDDEN");

  const isSuper = scope.role === "super_admin";
  const hasOverride = scope.overrides.channelCrud === true;

  if (!isSuper && !hasOverride) {
    throw new Error("FORBIDDEN");
  }
  return { actorId: user.id, scope };
}

function handleAuthError(e: unknown): ChannelState {
  const msg = (e as Error).message;
  if (msg === "FORBIDDEN")
    return { error: "Anda tidak memiliki akses untuk aksi ini." };
  return { error: "Sesi habis, silakan login ulang." };
}

export async function createChannel(
  _prev: ChannelState,
  formData: FormData,
): Promise<ChannelState> {
  let actorId: string;
  try {
    ({ actorId } = await requireChannelManager());
  } catch (e) {
    return handleAuthError(e);
  }

  const parsed = channelSchema.safeParse({
    type: formData.get("type"),
    label: formData.get("label"),
    url: formData.get("url"),
    isActive: formData.get("isActive") ?? "on",
    sortOrder: String(formData.get("sortOrder") ?? "0"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const [row] = await db
    .insert(customerServiceChannels)
    .values({
      type: parsed.data.type,
      label: parsed.data.label,
      url: parsed.data.url,
      isActive: parsed.data.isActive,
      sortOrder: parsed.data.sortOrder,
    })
    .returning({
      id: customerServiceChannels.id,
      type: customerServiceChannels.type,
      label: customerServiceChannels.label,
      url: customerServiceChannels.url,
      isActive: customerServiceChannels.isActive,
      sortOrder: customerServiceChannels.sortOrder,
    });

  revalidatePath("/admin/pelayanan");
  revalidatePath("/support");
  await db.insert(auditLogs).values({
    actorId,
    targetId: null,
    action: "channel_created",
    note: `Channel ${row.label} ditambahkan.`,
  });
  refresh();
  return {
    saved: row
      ? { ...row, type: row.type as "whatsapp" | "telegram" }
      : undefined,
  };
}

export async function updateChannel(
  _prev: ChannelState,
  formData: FormData,
): Promise<ChannelState> {
  let actorId: string;
  try {
    ({ actorId } = await requireChannelManager());
  } catch (e) {
    return handleAuthError(e);
  }

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return { error: "ID channel tidak valid." };
  }

  const parsed = channelSchema.safeParse({
    type: formData.get("type"),
    label: formData.get("label"),
    url: formData.get("url"),
    isActive: formData.get("isActive") ?? "off",
    sortOrder: String(formData.get("sortOrder") ?? "0"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const [row] = await db
    .update(customerServiceChannels)
    .set({
      type: parsed.data.type,
      label: parsed.data.label,
      url: parsed.data.url,
      isActive: parsed.data.isActive,
      sortOrder: parsed.data.sortOrder,
      updatedAt: new Date(),
    })
    .where(eq(customerServiceChannels.id, id))
    .returning({
      id: customerServiceChannels.id,
      type: customerServiceChannels.type,
      label: customerServiceChannels.label,
      url: customerServiceChannels.url,
      isActive: customerServiceChannels.isActive,
      sortOrder: customerServiceChannels.sortOrder,
    });

  revalidatePath("/admin/pelayanan");
  revalidatePath("/support");
  await db.insert(auditLogs).values({
    actorId,
    targetId: null,
    action: "channel_updated",
    note: `Channel ${row.label} diperbarui.`,
  });
  refresh();
  return {
    saved: row
      ? { ...row, type: row.type as "whatsapp" | "telegram" }
      : undefined,
  };
}

export async function deleteChannel(
  _prev: ChannelState,
  formData: FormData,
): Promise<ChannelState> {
  let actorId: string;
  try {
    ({ actorId } = await requireChannelManager());
  } catch (e) {
    return handleAuthError(e);
  }

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return { error: "ID channel tidak valid." };
  }
  const [row] = await db
    .select({ label: customerServiceChannels.label })
    .from(customerServiceChannels)
    .where(eq(customerServiceChannels.id, id))
    .limit(1);
  await db
    .delete(customerServiceChannels)
    .where(eq(customerServiceChannels.id, id));
  revalidatePath("/admin/pelayanan");
  revalidatePath("/support");
  await db.insert(auditLogs).values({
    actorId,
    targetId: null,
    action: "channel_deleted",
    note: row ? `Channel ${row.label} dihapus.` : `Channel #${id} dihapus.`,
  });
  refresh();
  return {};
}
