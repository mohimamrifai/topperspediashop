import { asc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { getScope } from "@/lib/access";
import { db } from "@/lib/db";
import { customerServiceChannels, profiles } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

import { PelayananTable } from "./_components/pelayanan-table";

export default async function AdminPelayananPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  const [me] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);
  if (!me || me.role === "member") redirect("/admin/login");

  // Super admin selalu boleh akses. Admin leader / staff butuh override
  // `channelCrud` yang diset oleh Super Admin di halaman Izin Akses.
  if (me.role === "admin_leader" || me.role === "admin_staff") {
    const scope = await getScope(user.id);
    if (scope?.overrides.channelCrud !== true) {
      redirect("/admin/dashboard");
    }
  }

  const rows = await db
    .select({
      id: customerServiceChannels.id,
      type: customerServiceChannels.type,
      label: customerServiceChannels.label,
      url: customerServiceChannels.url,
      isActive: customerServiceChannels.isActive,
      sortOrder: customerServiceChannels.sortOrder,
    })
    .from(customerServiceChannels)
    .orderBy(asc(customerServiceChannels.sortOrder), asc(customerServiceChannels.id));

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-4 sm:space-y-5 sm:py-5">
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/60 sm:p-5">
        <h1 className="text-base font-bold text-zinc-900 sm:text-lg">
          Pelayanan
        </h1>
        <p className="mt-1 text-xs text-zinc-600 sm:text-sm">
          Kelola channel layanan pelanggan (WhatsApp &amp; Telegram) yang
          ditampilkan ke anggota.
        </p>
      </div>

      <PelayananTable
        initialChannels={rows.map((r) => ({
          id: r.id,
          type: r.type as "whatsapp" | "telegram",
          label: r.label,
          url: r.url,
          isActive: r.isActive,
          sortOrder: r.sortOrder,
        }))}
      />
    </div>
  );
}
