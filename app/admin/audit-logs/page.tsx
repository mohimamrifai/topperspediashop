import { desc, eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { auditLogs, profiles } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

import { AuditLogsTable } from "./_components/audit-logs-table";

// Daftar aksi yang dipakai di sistem (untuk filter & label).
// Konsisten dengan penulisan `action` di `lib/actions/*`.
const ACTION_LABELS: Record<string, string> = {
  create_admin: "Buat Admin",
  update_admin: "Edit Admin",
  delete_admin: "Hapus Admin",
  create_task: "Beri Tugas",
  task_completed: "Tugas Selesai",
  update_level: "Ubah Level",
  update_credit_score: "Ubah Credit Score",
  adjust_balance: "Adjust Saldo",
  reset_login_password: "Reset Password Login",
  reset_withdraw_password: "Reset Password Penarikan",
  set_status: "Ubah Status",
};

export default async function AdminAuditLogsPage() {
  // Identifikasi admin yang login
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  const [me] = await db
    .select({ id: profiles.id, role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  // Hanya super_admin yang boleh akses halaman ini
  if (!me || me.role !== "super_admin") {
    redirect("/admin/dashboard");
  }

  // Query: audit_logs + join profiles 2x (actor & target).
  // Pakai alias `actor` dan `target` untuk username/role.
  const rows = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      amount: auditLogs.amount,
      note: auditLogs.note,
      metadata: auditLogs.metadata,
      createdAt: auditLogs.createdAt,
      actorId: auditLogs.actorId,
      actorUsername: sql<string | null>`actor.username`,
      actorRole: sql<string | null>`actor.role`,
      targetId: auditLogs.targetId,
      targetUsername: sql<string | null>`target.username`,
      targetRole: sql<string | null>`target.role`,
    })
    .from(auditLogs)
    .leftJoin(
      sql`profiles AS actor`,
      sql`actor.id = ${auditLogs.actorId}`,
    )
    .leftJoin(
      sql`profiles AS target`,
      sql`target.id = ${auditLogs.targetId}`,
    )
    .orderBy(desc(auditLogs.createdAt))
    .limit(500);

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-4 sm:space-y-5 sm:py-5">
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/60 sm:p-5">
        <h1 className="text-base font-bold text-zinc-900 sm:text-lg">
          Audit Log
        </h1>
        <p className="mt-1 text-[11px] text-zinc-600 sm:text-xs">
          Riwayat semua perubahan penting yang dilakukan admin (saldo, level,
          status, withdraw, dan akun admin). 500 entri terbaru.
        </p>
      </div>

      <AuditLogsTable
        initialLogs={rows.map((r) => ({
          id: r.id,
          action: r.action,
          amount: r.amount,
          note: r.note,
          metadata: r.metadata,
          createdAt: r.createdAt.toISOString(),
          actorId: r.actorId,
          actorUsername: r.actorUsername,
          actorRole: r.actorRole,
          targetId: r.targetId,
          targetUsername: r.targetUsername,
          targetRole: r.targetRole,
        }))}
        actionLabels={ACTION_LABELS}
      />
    </div>
  );
}
