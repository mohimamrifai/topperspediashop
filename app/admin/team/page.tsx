import { and, asc, desc, eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

import { TeamTable } from "./_components/team-table";

export default async function AdminTeamPage() {
  // Identifikasi admin yang login
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  const [me] = await db
    .select({ id: profiles.id, role: profiles.role, username: profiles.username })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  // Hanya super_admin & admin_leader yang boleh akses
  if (!me || (me.role !== "super_admin" && me.role !== "admin_leader")) {
    redirect("/admin/dashboard");
  }

  const isSuperAdmin = me.role === "super_admin";

  // Hitung jumlah member di bawah masing-masing staff
  const staffCounts = await db
    .select({
      staffId: profiles.referredBy,
      total: sql<number>`count(*)::int`,
    })
    .from(profiles)
    .where(eq(profiles.role, "member"))
    .groupBy(profiles.referredBy);

  const memberCountByStaff = new Map<string, number>();
  for (const row of staffCounts) {
    if (row.staffId) memberCountByStaff.set(row.staffId, Number(row.total));
  }

  // Ambil semua admin (leader & staff) diurutkan
  // Super admin lihat semua. Leader hanya lihat staff di bawahnya.
  const baseConditions = sql`${profiles.role} IN ('admin_leader', 'admin_staff')`;
  const whereClause = isSuperAdmin
    ? baseConditions
    : and(baseConditions, eq(profiles.leaderId, me.id));

  const adminRows = await db
    .select({
      id: profiles.id,
      username: profiles.username,
      role: profiles.role,
      referralCode: profiles.referralCode,
      status: profiles.status,
      createdAt: profiles.createdAt,
      leaderId: profiles.leaderId,
    })
    .from(profiles)
    .where(whereClause)
    .orderBy(asc(profiles.role), desc(profiles.createdAt));

  // Ambil semua leader (untuk dropdown pilih leader saat create/edit staff)
  // Untuk super admin: semua leader. Untuk leader saat ini: hanya dirinya sendiri (tidak perlu).
  const leaderRows = isSuperAdmin
    ? await db
        .select({
          id: profiles.id,
          username: profiles.username,
        })
        .from(profiles)
        .where(eq(profiles.role, "admin_leader"))
        .orderBy(asc(profiles.username))
    : [];

  // Map leader username by id (untuk leader sendiri, tambahkan juga untuk ditampilkan)
  const leaderNameById = new Map<string, string>();
  for (const l of leaderRows) leaderNameById.set(l.id, l.username);
  if (!isSuperAdmin) leaderNameById.set(me.id, "(Anda)");

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-4 sm:space-y-5 sm:py-5">
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/60 sm:p-5">
        <h1 className="text-base font-bold text-zinc-900 sm:text-lg">
          {isSuperAdmin ? "Manajemen Tim Admin" : "Tim Staff Anda"}
        </h1>
        <p className="mt-1 text-[11px] text-zinc-600 sm:text-xs">
          {isSuperAdmin
            ? "Buat akun Admin Leader atau Admin Staff. Setiap admin baru akan otomatis dibuatkan profil di sistem."
            : "Buat akun Admin Staff di bawah Anda. Anda hanya dapat mengelola staff yang berafiliasi dengan Anda."}
        </p>
      </div>

      <TeamTable
        initialAdmins={adminRows.map((r) => ({
          id: r.id,
          username: r.username,
          role: r.role as "admin_leader" | "admin_staff",
          referralCode: r.referralCode,
          status: r.status,
          createdAt: r.createdAt.toISOString(),
          memberCount: memberCountByStaff.get(r.id) ?? 0,
          leaderId: r.leaderId,
          leaderUsername: r.leaderId ? leaderNameById.get(r.leaderId) ?? null : null,
        }))}
        leaders={leaderRows.map((l) => ({ id: l.id, username: l.username }))}
        isCurrentSuperAdmin={isSuperAdmin}
        currentLeaderId={me.id}
        currentLeaderUsername={me.username}
      />
    </div>
  );
}
