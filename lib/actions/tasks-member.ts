"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath, refresh } from "next/cache";

import { db } from "@/lib/db";
import { auditLogs, profiles, taskRequests, tasks } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

/**
 * IMPORTANT — Design intent (jangan dilanggar tanpa diskusi owner produk):
 *
 * Aksi-aksi di file ini HANYA melakukan dua validasi:
 * 1. Caller adalah `member` (bukan admin/staff).
 * 2. Member tidak sedang punya request/tugas aktif lain.
 *
 * TIDAK ada pengecekan `status === "banned"` atau `withdrawLockReason`.
 * Artinya: member yang penarikannya dikunci (`status = "banned"` dari
 * `setMemberWithdrawLock` atau auto-ban reject withdrawal) tetap BOLEH
 * request dan submit tugas. Hanya `submitWithdrawal` di
 * `lib/actions/withdrawals.ts` yang di-block. Lihat juga helper
 * `isWithdrawLocked` di `lib/access.ts`.
 */

export type TaskRequestState = {
  error?: string;
  hasExisting?: boolean;
  success?: boolean;
  message?: string;
  taskId?: number;
  need?: number;
};

const ACTIVE_TASK_STATUSES = ["dipilih", "dikerjakan"] as const;

async function getMemberContext(): Promise<
  | { ok: true; userId: string; referredBy: string | null }
  | { ok: false; error: TaskRequestState }
> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: { error: "Sesi habis, silakan login ulang." } };

  const [profile] = await db
    .select({ role: profiles.role, referredBy: profiles.referredBy })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (!profile) return { ok: false, error: { error: "Profil tidak ditemukan." } };
  if (profile.role !== "member") {
    return { ok: false, error: { error: "Hanya member yang bisa meminta tugas." } };
  }
  return { ok: true, userId: user.id, referredBy: profile.referredBy };
}

/**
 * Member meminta tugas baru.
 * Permintaan disimpan terpisah di task_requests agar belum dihitung sebagai tugas aktif.
 * Klik berulang hanya meng-update request yang sama, tidak membuat duplikat.
 */
export async function requestTask(
): Promise<TaskRequestState> {
  const ctx = await getMemberContext();
  if (!ctx.ok) return ctx.error;

  // Tolak kalau member sudah punya request menunggu (admin belum memilih produk)
  const pendingRequests = await db
    .select({ id: taskRequests.id })
    .from(taskRequests)
    .where(eq(taskRequests.memberId, ctx.userId))
    .limit(1);

  if (pendingRequests.length > 0) {
    return { hasExisting: true };
  }

  // Tolak kalau member sudah punya tugas nyata yang sedang dipilih/dikerjakan.
  const activeTasks = await db
    .select({ id: tasks.id, status: tasks.status })
    .from(tasks)
    .where(
      sql`${tasks.memberId} = ${ctx.userId} AND ${tasks.status} = ANY(${sql.raw(`ARRAY[${ACTIVE_TASK_STATUSES.map((s) => `'${s}'::task_status`).join(",")}]`)})`,
    )
    .limit(1);

  if (activeTasks.length > 0) {
    return { hasExisting: true };
  }

  const [created] = await db
    .insert(taskRequests)
    .values({
      memberId: ctx.userId,
      requestCount: 1,
    })
    .onConflictDoUpdate({
      target: taskRequests.memberId,
      set: {
        requestCount: sql`${taskRequests.requestCount} + 1`,
        requestedAt: sql`now()`,
        updatedAt: sql`now()`,
      },
    })
    .returning({ id: taskRequests.id });

  if (!created) return { error: "Gagal membuat permintaan tugas." };

  revalidatePath("/task");
  revalidatePath("/order");
  revalidatePath("/admin/task");
  refresh();
  return {
    success: true,
    message: "Permintaan tugas dikirim. Mohon tunggu admin memilihkan produk.",
    taskId: created.id,
  };
}

/**
 * Member submit tugas: 'dipilih' -> 'dikerjakan'.
 *
 * Alur pada step ini (model "deposit + komisi"):
 * - Cek saldo member cukup untuk harga produk.
 * - Pindahkan `price` dari `balance` ke `frozen_balance` (deposit
 *   yang akan dikembalikan saat tugas dikonfirmasi selesai/dibatalkan).
 * - Komisi belum dipindahkan di sini; tetap tersimpan di kolom
 *   `task.commission` dan akan dikredit saat admin konfirmasi
 *   (lihat `updateTaskStatus` di tasks-admin.ts).
 * - Jika saldo kurang, tidak ada mutasi; return `need` agar UI bisa
 *   arahkan member ke halaman deposit.
 */
export async function submitTask(
  _prev: TaskRequestState,
  formData: FormData,
): Promise<TaskRequestState> {
  const ctx = await getMemberContext();
  if (!ctx.ok) return ctx.error;

  const taskId = Number(formData.get("taskId"));
  const ratingRaw = formData.get("rating");
  const rating = ratingRaw ? Number(ratingRaw) : null;
  if (!Number.isFinite(taskId) || taskId <= 0) {
    return { error: "ID tugas tidak valid." };
  }

  // 1. Validasi task: harus milik member ini dan berstatus 'dipilih'.
  //    Kunci baris dengan FOR UPDATE supaya tidak ada race saat submit bersamaan.
  const [task] = await db
    .select({
      id: tasks.id,
      memberId: tasks.memberId,
      price: tasks.price,
      commission: tasks.commission,
      status: tasks.status,
    })
    .from(tasks)
    .where(
      sql`${tasks.id} = ${taskId} AND ${tasks.memberId} = ${ctx.userId} AND ${tasks.status} = 'dipilih'::task_status`,
    )
    .for("update")
    .limit(1);

  if (!task) {
    return {
      error: "Tugas tidak ditemukan, bukan milik Anda, atau belum dipilih admin.",
    };
  }

  // 2. Ambil data member (level + balance) dengan FOR UPDATE.
  const [member] = await db
    .select({
      id: profiles.id,
      level: profiles.level,
      balance: profiles.balance,
    })
    .from(profiles)
    .where(eq(profiles.id, task.memberId))
    .for("update")
    .limit(1);

  if (!member) {
    return { error: "Profil member tidak ditemukan." };
  }

  const priceNum = Number(task.price);
  const balanceNum = Number(member.balance);
  const shortfall = Math.max(priceNum - balanceNum, 0);

  // 3. Saldo kurang → tidak ada mutasi, return info shortfall.
  if (shortfall > 0) {
    return {
      error: `Saldo tidak cukup. Kurang Rp ${shortfall.toLocaleString("id-ID")} untuk mengerjakan tugas ini.`,
      need: shortfall,
    };
  }

  // 4. Potong balance, pindahkan ke frozen_balance, dan update status
  //    dalam satu transaction atomic.
  //    Saldo beku = seluruh harga produk (price), bukan komisi.
  //    Komisi tetap tersimpan di `task.commission` untuk dicairkan admin
  //    nanti saat tugas dikonfirmasi selesai.
  await db.transaction(async (tx) => {
    await tx
      .update(profiles)
      .set({
        balance: sql`${profiles.balance} - ${priceNum}`,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, member.id));

    await tx
      .update(profiles)
      .set({
        frozenBalance: sql`${profiles.frozenBalance} + ${priceNum}`,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, member.id));

    await tx
      .update(tasks)
      .set({ status: "dikerjakan", updatedAt: new Date() })
      .where(eq(tasks.id, task.id));
  });

  // 5. Audit log
  const noteSuffix =
    rating && rating >= 1 && rating <= 5 ? ` Rating: ${rating}/5` : "";
  await db.insert(auditLogs).values({
    actorId: ctx.userId,
    targetId: member.id,
    action: "task_submitted",
    amount: priceNum.toFixed(2),
    note: `Tugas #${taskId} dimulai. Saldo Rp ${priceNum.toLocaleString("id-ID")} dipindahkan ke saldo beku.${noteSuffix}`,
    metadata: JSON.stringify({
      taskId,
      price: priceNum,
      rating: rating && rating >= 1 && rating <= 5 ? rating : null,
    }),
  });

  revalidatePath("/order");
  revalidatePath("/admin/task");
  revalidatePath("/admin/users");
  revalidatePath("/profil");
  revalidatePath("/task");
  refresh();
  return {
    success: true,
    message: "Tugas berhasil dimulai. Mohon tunggu verifikasi admin.",
    taskId,
  };
}
