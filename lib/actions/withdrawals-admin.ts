"use server";

import { readFile } from "node:fs/promises";
import { eq, sql } from "drizzle-orm";
import { revalidatePath, refresh } from "next/cache";
import { z } from "zod";

import { assertCanAccessMember, getScope } from "@/lib/access";
import {
  OTHER_REASON,
  WITHDRAWAL_AUTO_BAN_REASONS,
  WITHDRAWAL_REJECTION_REASONS,
} from "@/lib/constants/withdrawal";
import { db } from "@/lib/db";
import { auditLogs, profiles, withdrawals } from "@/lib/db/schema";
import { getCurrentProfile } from "@/lib/auth/session";

async function reportDebug(
  hypothesisId: string,
  location: string,
  msg: string,
  data: Record<string, unknown>,
) {
  let url = "http://127.0.0.1:7777/event";
  let sessionId = "withdraw-confirm-production";
  try {
    const env = await readFile(".dbg/withdraw-confirm-production.env", "utf8");
    url = env.match(/DEBUG_SERVER_URL=(.+)/)?.[1] ?? url;
    sessionId = env.match(/DEBUG_SESSION_ID=(.+)/)?.[1] ?? sessionId;
  } catch {}

  void fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      sessionId,
      runId: "pre",
      hypothesisId,
      location,
      msg: `[DEBUG] ${msg}`,
      data,
      ts: Date.now(),
    }),
  }).catch(() => {});
}

const actionSchema = z
  .object({
    id: z.coerce.number().int().positive("ID tidak valid."),
    action: z.enum(["complete", "reject"], {
      message: "Aksi tidak valid.",
    }),
    notes: z.string().trim().max(500).optional(),
    /**
     * Hanya dipakai saat action=reject.
     * Nilai: salah satu dari WITHDRAWAL_REJECTION_REASONS, atau OTHER_REASON.
     */
    reasonCode: z.string().trim().max(120).optional(),
    /**
     * Hanya dipakai saat reasonCode=OTHER_REASON (form input "Lainnya").
     */
    otherReason: z.string().trim().max(400).optional(),
  })
  .refine(
    (v) => v.action !== "reject" || (v.reasonCode && v.reasonCode.length > 0),
    {
      message: "Pilih alasan penolakan.",
      path: ["reasonCode"],
    },
  )
  .refine(
    (v) =>
      v.reasonCode !== OTHER_REASON ||
      (v.otherReason && v.otherReason.trim().length > 0),
    {
      message: "Tulis alasan pada kolom 'Lainnya'.",
      path: ["otherReason"],
    },
  );

export type WithdrawReviewState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
  success?: boolean;
};

async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role === "member") {
    throw new Error("FORBIDDEN");
  }
  return profile.id;
}

function handleAuthError(e: unknown): WithdrawReviewState {
  const msg = (e as Error).message;
  if (msg === "FORBIDDEN") return { error: "Anda tidak memiliki akses admin." };
  if (msg === "FORBIDDEN_SCOPE")
    return { error: "Penarikan ini bukan dari anggota tim Anda." };
  return { error: "Sesi habis, silakan login ulang." };
}

async function assertScopeForMember(memberId: string): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("UNAUTHENTICATED");
  const scope = await getScope(profile.id);
  if (!scope) throw new Error("FORBIDDEN");
  try {
    assertCanAccessMember(scope, memberId);
  } catch {
    throw new Error("FORBIDDEN_SCOPE");
  }
}

export async function reviewWithdrawal(
  _prev: WithdrawReviewState,
  formData: FormData,
): Promise<WithdrawReviewState> {
  const startedAt = performance.now();
  let adminId: string;
  try {
    adminId = await requireAdmin();
  } catch (e) {
    // #region debug-point A:auth-error
    void reportDebug("A", "lib/actions/withdrawals-admin.ts:reviewWithdrawal", "auth admin gagal", {
      durationMs: Number((performance.now() - startedAt).toFixed(2)),
      error: e instanceof Error ? e.message : String(e),
    });
    // #endregion
    return handleAuthError(e);
  }

  const parsed = actionSchema.safeParse({
    id: formData.get("id"),
    action: formData.get("action"),
    notes: formData.get("notes") || undefined,
    reasonCode: formData.get("reasonCode") || undefined,
    otherReason: formData.get("otherReason") || undefined,
  });
  if (!parsed.success) {
    // #region debug-point B:validation-error
    void reportDebug("B", "lib/actions/withdrawals-admin.ts:reviewWithdrawal", "validasi form gagal", {
      durationMs: Number((performance.now() - startedAt).toFixed(2)),
      formAction: formData.get("action"),
      id: formData.get("id"),
      fieldErrors: parsed.error.flatten().fieldErrors,
    });
    // #endregion
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  // Validasi: jika reject, reasonCode harus salah satu dari enum
  let finalNotes: string | null = parsed.data.notes ?? null;
  let reasonCode: string | null = null;
  if (parsed.data.action === "reject") {
    const code = parsed.data.reasonCode!;
    const isValidCode =
      (WITHDRAWAL_REJECTION_REASONS as readonly string[]).includes(code) ||
      code === OTHER_REASON;
    if (!isValidCode) {
      return { fieldErrors: { reasonCode: ["Alasan penolakan tidak valid."] } };
    }
    reasonCode = code;
    const reasonText =
      code === OTHER_REASON
        ? (parsed.data.otherReason ?? "").trim()
        : code;
    // Format konsisten untuk audit log: "[REJECT] Alasan: <reason>"
    finalNotes = `[REJECT] Alasan: ${reasonText}`;
  }

  // Ambil member_id dari withdrawal, lalu validasi scope
  const [wdRow] = await db
    .select({ memberId: withdrawals.memberId })
    .from(withdrawals)
    .where(eq(withdrawals.id, parsed.data.id))
    .limit(1);
  if (!wdRow) {
    // #region debug-point C:withdraw-not-found
    void reportDebug("C", "lib/actions/withdrawals-admin.ts:reviewWithdrawal", "withdrawal tidak ditemukan", {
      durationMs: Number((performance.now() - startedAt).toFixed(2)),
      id: parsed.data.id,
      action: parsed.data.action,
    });
    // #endregion
    return { error: "Penarikan tidak ditemukan." };
  }
  try {
    await assertScopeForMember(wdRow.memberId);
  } catch (e) {
    // #region debug-point C:scope-error
    void reportDebug("C", "lib/actions/withdrawals-admin.ts:reviewWithdrawal", "scope member gagal", {
      durationMs: Number((performance.now() - startedAt).toFixed(2)),
      id: parsed.data.id,
      action: parsed.data.action,
      memberId: wdRow.memberId,
      error: e instanceof Error ? e.message : String(e),
    });
    // #endregion
    return handleAuthError(e);
  }

  if (parsed.data.action === "complete") {
    // Complete: kosongkan frozen_balance (uang sudah keluar)
    // #region debug-point D:complete-start
    void reportDebug("D", "lib/actions/withdrawals-admin.ts:reviewWithdrawal", "complete mulai", {
      durationMs: Number((performance.now() - startedAt).toFixed(2)),
      id: parsed.data.id,
      memberId: wdRow.memberId,
      adminId,
    });
    // #endregion
    const updated = await db.execute<{ id: number; member_id: string; amount: string }>(sql`
      WITH w AS (
        SELECT id, member_id, amount, status FROM withdrawals WHERE id = ${parsed.data.id} FOR UPDATE
      ),
      upd AS (
        UPDATE withdrawals
        SET status = 'completed', processed_by = ${adminId}, processed_at = now(), notes = ${finalNotes}, updated_at = now()
        FROM w
        WHERE withdrawals.id = w.id AND w.status = 'pending'
        RETURNING withdrawals.id, withdrawals.member_id, withdrawals.amount
      )
      UPDATE profiles
      SET frozen_balance = frozen_balance - upd.amount, updated_at = now()
      FROM upd
      WHERE profiles.id = upd.member_id AND frozen_balance >= upd.amount
      RETURNING profiles.id
    `);
    // #region debug-point D:complete-sql
    void reportDebug("D", "lib/actions/withdrawals-admin.ts:reviewWithdrawal", "complete sql selesai", {
      durationMs: Number((performance.now() - startedAt).toFixed(2)),
      id: parsed.data.id,
      rowCount: Array.isArray(updated) ? updated.length : null,
      resultType: typeof updated,
    });
    // #endregion
    if (!updated.length) {
      return {
        error: "Penarikan tidak ditemukan, sudah diproses, atau saldo beku tidak cukup.",
      };
    }

    await db.insert(auditLogs).values({
      actorId: adminId,
      targetId: wdRow.memberId,
      action: "withdrawal_completed",
      note: `Penarikan #${parsed.data.id} diselesaikan.`,
      metadata: JSON.stringify({
        withdrawalId: parsed.data.id,
        notes: finalNotes,
      }),
    });
    // #region debug-point D:complete-audit
    void reportDebug("D", "lib/actions/withdrawals-admin.ts:reviewWithdrawal", "complete audit selesai", {
      durationMs: Number((performance.now() - startedAt).toFixed(2)),
      id: parsed.data.id,
    });
    // #endregion
  } else {
    // Reject: kembalikan ke saldo (tambah balance, kurangi frozen)
    // #region debug-point E:reject-start
    void reportDebug("E", "lib/actions/withdrawals-admin.ts:reviewWithdrawal", "reject mulai", {
      durationMs: Number((performance.now() - startedAt).toFixed(2)),
      id: parsed.data.id,
      memberId: wdRow.memberId,
      adminId,
      reasonCode,
    });
    // #endregion
    const updated = await db.execute<{ id: number; member_id: string }>(sql`
      WITH w AS (
        SELECT id, member_id, amount, status FROM withdrawals WHERE id = ${parsed.data.id} FOR UPDATE
      ),
      upd AS (
        UPDATE withdrawals
        SET status = 'rejected', processed_by = ${adminId}, processed_at = now(), notes = ${finalNotes}, updated_at = now()
        FROM w
        WHERE withdrawals.id = w.id AND w.status = 'pending'
        RETURNING withdrawals.id, withdrawals.member_id
      )
      UPDATE profiles
      SET balance = balance + w.amount,
          frozen_balance = frozen_balance - w.amount,
          updated_at = now()
      FROM w, upd
      WHERE profiles.id = upd.member_id AND frozen_balance >= w.amount
      RETURNING profiles.id
    `);
    // #region debug-point E:reject-sql
    void reportDebug("E", "lib/actions/withdrawals-admin.ts:reviewWithdrawal", "reject sql selesai", {
      durationMs: Number((performance.now() - startedAt).toFixed(2)),
      id: parsed.data.id,
      rowCount: Array.isArray(updated) ? updated.length : null,
      resultType: typeof updated,
    });
    // #endregion
    if (!updated.length) {
      return {
        error: "Penarikan tidak ditemukan, sudah diproses, atau saldo beku tidak cukup.",
      };
    }

    await db.insert(auditLogs).values({
      actorId: adminId,
      targetId: wdRow.memberId,
      action: "withdrawal_rejected",
      note: `Penarikan #${parsed.data.id} ditolak.`,
      metadata: JSON.stringify({
        withdrawalId: parsed.data.id,
        notes: finalNotes,
        reasonCode,
      }),
    });
    // #region debug-point E:reject-audit
    void reportDebug("E", "lib/actions/withdrawals-admin.ts:reviewWithdrawal", "reject audit selesai", {
      durationMs: Number((performance.now() - startedAt).toFixed(2)),
      id: parsed.data.id,
      reasonCode,
    });
    // #endregion

    // Auto-ban member jika reason code termasuk auto-ban list
    // (sesuai PRD: "rekening tidak valid" / "penipuan" / "akun mencurigakan")
    if (reasonCode && (WITHDRAWAL_AUTO_BAN_REASONS as readonly string[]).includes(reasonCode)) {
      const targetMemberId = wdRow.memberId;
      // Update profile ke banned (idempotent — kalau sudah banned, tetap OK)
      const [bannedRow] = await db
        .update(profiles)
        .set({ status: "banned", updatedAt: new Date() })
        .where(eq(profiles.id, targetMemberId))
        .returning({ id: profiles.id, username: profiles.username });
      if (bannedRow) {
        await db.insert(auditLogs).values({
          actorId: adminId,
          targetId: bannedRow.id,
          action: "auto_ban_on_reject",
          note: `Member @${bannedRow.username} di-ban otomatis karena reject withdrawal dengan alasan "${reasonCode}".`,
          metadata: JSON.stringify({
            username: bannedRow.username,
            withdrawalId: parsed.data.id,
            reasonCode,
          }),
        });
        // #region debug-point E:auto-ban
        void reportDebug("E", "lib/actions/withdrawals-admin.ts:reviewWithdrawal", "reject auto-ban selesai", {
          durationMs: Number((performance.now() - startedAt).toFixed(2)),
          id: parsed.data.id,
          bannedUserId: bannedRow.id,
          reasonCode,
        });
        // #endregion
      }
    }
  }

  revalidatePath("/admin/withdrawlist");
  revalidatePath("/withdraw");
  revalidatePath("/profil");
  revalidatePath("/profil/withdrawlist");
  revalidatePath("/admin/users");
  revalidatePath("/admin/dashboard");
  refresh();
  // #region debug-point F:review-success
  void reportDebug("F", "lib/actions/withdrawals-admin.ts:reviewWithdrawal", "reviewWithdrawal selesai", {
    durationMs: Number((performance.now() - startedAt).toFixed(2)),
    id: parsed.data.id,
    action: parsed.data.action,
  });
  // #endregion
  return { success: true };
}
