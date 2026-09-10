import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AdminNav } from "@/app/admin/dashboard/_components/admin-nav";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

type Props = {
  children: React.ReactNode;
};

export default async function AdminLayout({ children }: Props) {
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") ?? "";

  // Halaman login punya styling sendiri (tanpa sidebar).
  if (pathname.startsWith("/admin/login")) {
    return <div className="min-h-screen bg-black text-white">{children}</div>;
  }

  const user = await getCurrentUser();

  if (!user) redirect("/admin/login");

  const [profile] = await db
    .select({ role: profiles.role, accessOverrides: profiles.accessOverrides })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (!profile || profile.role === "member") {
    redirect("/admin/login");
  }

  const isSuperAdmin = profile.role === "super_admin";
  const isLeader = profile.role === "admin_leader";

  // Super Admin selalu boleh; admin leader/staff hanya jika Super Admin
  // mengaktifkan override `channelCrud` di halaman Izin Akses.
  // Sama hal-nya untuk `depositBankCrud` (khusus admin leader, bukan staff).
  const overrides = (profile.accessOverrides ?? {}) as {
    channelCrud?: boolean;
    depositBankCrud?: boolean;
  };
  const canManageChannels = isSuperAdmin || overrides.channelCrud === true;
  const canManageDepositBankCrud =
    isSuperAdmin || (isLeader && overrides.depositBankCrud === true);

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900 sm:pl-60">
      <AdminNav
        isSuperAdmin={isSuperAdmin}
        isLeader={isLeader}
        canManageChannels={canManageChannels}
        canManageDepositBankCrud={canManageDepositBankCrud}
      />
      {children}
    </div>
  );
}
