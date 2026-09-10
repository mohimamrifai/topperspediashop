import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";

import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { getStaffDetailStats } from "@/lib/team";

import { StaffDetailContent } from "./_components/staff-detail-content";

type SearchParams = Promise<{ from?: string; to?: string }>;

export default async function StaffDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ staffId: string }>;
  searchParams: SearchParams;
}) {
  const { staffId } = await params;
  const { from, to } = await searchParams;

  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  const [me] = await db
    .select({ id: profiles.id, role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (!me || (me.role !== "super_admin" && me.role !== "admin_leader")) {
    redirect("/admin/dashboard");
  }

  const [staff] = await db
    .select({
      id: profiles.id,
      username: profiles.username,
      referralCode: profiles.referralCode,
      role: profiles.role,
      leaderId: profiles.leaderId,
      status: profiles.status,
      createdAt: profiles.createdAt,
    })
    .from(profiles)
    .where(eq(profiles.id, staffId))
    .limit(1);

  if (!staff || staff.role !== "admin_staff") notFound();

  // Pembatasan scope: leader hanya boleh akses staff di bawahnya
  if (me.role === "admin_leader" && staff.leaderId !== me.id) {
    notFound();
  }

  const stats = await getStaffDetailStats(staff.id, { from, to });

  // Ambil username leader
  let leaderUsername: string | null = null;
  if (staff.leaderId) {
    const [leader] = await db
      .select({ username: profiles.username })
      .from(profiles)
      .where(eq(profiles.id, staff.leaderId))
      .limit(1);
    leaderUsername = leader?.username ?? null;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-4 sm:space-y-5 sm:py-5">
      <StaffDetailContent
        staff={{
          id: staff.id,
          username: staff.username,
          referralCode: staff.referralCode,
          status: staff.status,
          createdAt: staff.createdAt.toISOString(),
          leaderUsername,
        }}
        stats={stats}
        initialFrom={from ?? ""}
        initialTo={to ?? ""}
      />
    </div>
  );
}
