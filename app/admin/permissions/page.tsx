import { asc, eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";

import type { AccessOverrides } from "@/lib/access";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

import { PermissionsTable } from "./_components/permissions-table";

function readOverrides(raw: unknown): AccessOverrides {
  if (!raw || typeof raw !== "object") return {};
  const obj = raw as Record<string, unknown>;
  return {
    fullAccess: obj.fullAccess === true,
    canCreateStaff: obj.canCreateStaff === true,
    canCreateLeader: obj.canCreateLeader === true,
    commissionEdit: obj.commissionEdit === true,
    depositBankCrud: obj.depositBankCrud === true,
  };
}

export default async function AdminPermissionsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  const [me] = await db
    .select({ id: profiles.id, role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  // Hanya super_admin yang boleh akses
  if (!me || me.role !== "super_admin") {
    redirect("/admin/dashboard");
  }

  const adminRows = await db
    .select({
      id: profiles.id,
      username: profiles.username,
      role: profiles.role,
      accessOverrides: profiles.accessOverrides,
      status: profiles.status,
      createdAt: profiles.createdAt,
    })
    .from(profiles)
    .where(sql`${profiles.role} IN ('admin_leader', 'admin_staff')`)
    .orderBy(asc(profiles.role), asc(profiles.username));

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-4 sm:space-y-5 sm:py-5">
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/60 sm:p-5">
        <h1 className="text-base font-bold text-zinc-900 sm:text-lg">
          Pengaturan Izin Akses
        </h1>
        <p className="mt-1 text-[11px] text-zinc-600 sm:text-xs">
          Atur izin tambahan per admin di luar role default-nya. Perubahan
          langsung berlaku di sesi berikutnya (atau setelah refresh halaman).
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-[11px] text-zinc-700 sm:text-xs">
          <li>
            <strong>Full Access</strong> — admin dapat melihat semua data
            seperti Super Admin.
          </li>
          <li>
            <strong>Buat Staff</strong> — admin dapat membuat akun Admin
            Staff baru.
          </li>
          <li>
            <strong>Buat Leader</strong> — admin dapat membuat akun Admin
            Leader baru.
          </li>
          <li>
            <strong>Edit Komisi</strong> — admin dapat mengubah rate komisi
            staff.
          </li>
          <li>
            <strong>CRUD Rekening Deposit</strong> — admin dapat mengelola
            rekening tujuan deposit.
          </li>
        </ul>
      </div>

      <PermissionsTable
        initialAdmins={adminRows.map((r) => ({
          id: r.id,
          username: r.username,
          role: r.role,
          status: r.status,
          overrides: readOverrides(r.accessOverrides),
        }))}
      />
    </div>
  );
}
