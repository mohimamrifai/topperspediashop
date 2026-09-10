"use server";

import { eq } from "drizzle-orm";
import { revalidatePath, refresh } from "next/cache";

import {
  assertCanManageDepositBankAccount,
  canManageDepositBankAccount,
  getScope,
} from "@/lib/access";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { auditLogs, depositBankAccounts } from "@/lib/db/schema";
import type { DepositBankAccountState } from "./deposit-bank-accounts-types";

/**
 * Helper: ambil scope + guard ownership untuk rekening yang sudah ada.
 * Return null kalau tidak ditemukan atau tidak boleh diakses.
 */
async function loadAccountForManage(accountId: number) {
  const [row] = await db
    .select()
    .from(depositBankAccounts)
    .where(eq(depositBankAccounts.id, accountId))
    .limit(1);
  return row ?? null;
}

export async function addDepositBankAccount(
  _prev: DepositBankAccountState,
  formData: FormData,
): Promise<DepositBankAccountState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sesi habis, silakan login ulang." };

  const scope = await getScope(user.id);
  if (!scope) return { error: "Sesi tidak valid." };

  // Validasi role: super_admin atau admin_leader dengan depositBankCrud.
  if (scope.role === "super_admin") {
    // ok
  } else if (
    scope.role === "admin_leader" &&
    scope.overrides.depositBankCrud === true
  ) {
    // ok
  } else {
    return { error: "Anda tidak memiliki akses untuk menambah rekening." };
  }

  const bankName = String(formData.get("bankName") ?? "").trim();
  const accountName = String(formData.get("accountName") ?? "").trim();
  const accountNumber = String(formData.get("accountNumber") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;

  // Tentukan leader_id sesuai role.
  // Super admin: baca dari form (kosong/empty = NULL = global).
  // Leader: otomatis set ke scope.actorId (tidak baca dari form).
  let leaderId: string | null = null;
  if (scope.role === "super_admin") {
    const formLeader = String(formData.get("leaderId") ?? "").trim();
    leaderId = formLeader === "" ? null : formLeader;
  } else {
    // admin_leader: paksa ke dirinya sendiri
    leaderId = scope.actorId;
  }

  // Validasi field minimal
  const fieldErrors: DepositBankAccountState["fieldErrors"] = {};
  if (!bankName) fieldErrors.bankName = ["Nama bank wajib diisi."];
  if (!accountName) fieldErrors.accountName = ["Nama pemilik wajib diisi."];
  if (!accountNumber) fieldErrors.accountNumber = ["Nomor rekening wajib diisi."];
  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const [created] = await db
    .insert(depositBankAccounts)
    .values({
      bankName,
      accountName,
      accountNumber,
      notes,
      isActive: true,
      leaderId,
      createdBy: user.id,
    })
    .returning({ id: depositBankAccounts.id });

  if (created) {
    await db.insert(auditLogs).values({
      actorId: user.id,
      targetId: null,
      action: "DEPOSIT_BANK_CREATED",
      note: `account_id=${created.id}${leaderId ? `;leader_id=${leaderId}` : ";global"}`,
    });
  }

  revalidatePath("/admin/deposit-bank");
  refresh();
  return { success: true };
}

export async function updateDepositBankAccount(
  _prev: DepositBankAccountState,
  formData: FormData,
): Promise<DepositBankAccountState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sesi habis, silakan login ulang." };

  const scope = await getScope(user.id);
  if (!scope) return { error: "Sesi tidak valid." };

  const accountId = Number(formData.get("accountId"));
  if (!Number.isInteger(accountId) || accountId <= 0) {
    return { error: "ID rekening tidak valid." };
  }

  // Ambil rekening existing + cek ownership.
  const existing = await loadAccountForManage(accountId);
  if (!existing) return { error: "Rekening tidak ditemukan." };
  try {
    assertCanManageDepositBankAccount(scope, existing.leaderId);
  } catch {
    return { error: "Anda tidak memiliki akses untuk mengubah rekening ini." };
  }

  const bankName = String(formData.get("bankName") ?? "").trim();
  const accountName = String(formData.get("accountName") ?? "").trim();
  const accountNumber = String(formData.get("accountNumber") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;

  // Leader tidak boleh ubah leader_id (paksa tetap miliknya).
  // Super admin boleh ganti: baca dari form, kosong = global.
  let leaderId: string | null = existing.leaderId;
  if (scope.role === "super_admin") {
    const formLeader = String(formData.get("leaderId") ?? "").trim();
    leaderId = formLeader === "" ? null : formLeader;
  }

  const fieldErrors: DepositBankAccountState["fieldErrors"] = {};
  if (!bankName) fieldErrors.bankName = ["Nama bank wajib diisi."];
  if (!accountName) fieldErrors.accountName = ["Nama pemilik wajib diisi."];
  if (!accountNumber) fieldErrors.accountNumber = ["Nomor rekening wajib diisi."];
  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  await db
    .update(depositBankAccounts)
    .set({ bankName, accountName, accountNumber, notes, leaderId })
    .where(eq(depositBankAccounts.id, accountId));

  await db.insert(auditLogs).values({
    actorId: user.id,
    targetId: null,
    action: "DEPOSIT_BANK_UPDATED",
    note: `account_id=${accountId};leader_id=${leaderId ?? "global"}`,
  });

  revalidatePath("/admin/deposit-bank");
  refresh();
  return { success: true };
}

export async function deleteDepositBankAccount(
  _prev: DepositBankAccountState,
  formData: FormData,
): Promise<DepositBankAccountState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sesi habis, silakan login ulang." };

  const scope = await getScope(user.id);
  if (!scope) return { error: "Sesi tidak valid." };

  const accountId = Number(formData.get("accountId"));
  if (!Number.isInteger(accountId) || accountId <= 0) {
    return { error: "ID rekening tidak valid." };
  }

  const existing = await loadAccountForManage(accountId);
  if (!existing) return { error: "Rekening tidak ditemukan." };
  try {
    assertCanManageDepositBankAccount(scope, existing.leaderId);
  } catch {
    return { error: "Anda tidak memiliki akses untuk mengubah rekening ini." };
  }

  await db
    .delete(depositBankAccounts)
    .where(eq(depositBankAccounts.id, accountId));

  await db.insert(auditLogs).values({
    actorId: user.id,
    targetId: null,
    action: "DEPOSIT_BANK_DELETED",
    note: `account_id=${accountId}`,
  });

  revalidatePath("/admin/deposit-bank");
  refresh();
  return { success: true };
}

export async function toggleDepositBankAccountActive(
  _prev: DepositBankAccountState,
  formData: FormData,
): Promise<DepositBankAccountState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sesi habis, silakan login ulang." };

  const scope = await getScope(user.id);
  if (!scope) return { error: "Sesi tidak valid." };

  const accountId = Number(formData.get("accountId"));
  const isActive = formData.get("isActive") === "true";
  if (!Number.isInteger(accountId) || accountId <= 0) {
    return { error: "ID rekening tidak valid." };
  }

  const existing = await loadAccountForManage(accountId);
  if (!existing) return { error: "Rekening tidak ditemukan." };
  if (!canManageDepositBankAccount(scope, existing.leaderId)) {
    return { error: "Anda tidak memiliki akses untuk mengubah rekening ini." };
  }

  await db
    .update(depositBankAccounts)
    .set({ isActive })
    .where(eq(depositBankAccounts.id, accountId));

  await db.insert(auditLogs).values({
    actorId: user.id,
    targetId: null,
    action: isActive ? "DEPOSIT_BANK_ACTIVATED" : "DEPOSIT_BANK_DEACTIVATED",
    note: `account_id=${accountId}`,
  });

  revalidatePath("/admin/deposit-bank");
  refresh();
  return { success: true };
}
