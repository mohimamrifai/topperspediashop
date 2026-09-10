import {
  ArrowDownToLine,
  Bell,
  FileText,
  Headphones,
  History,
  KeyRound,
  Landmark,
  LogOut,
  Wallet,
} from "lucide-react";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

import { isWithdrawLocked } from "@/lib/access";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { formatRupiah } from "@/lib/format-rupiah";

import { ProfileHeader } from "./_components/header";
import { BalanceCard } from "./_components/balance-card";
import { LogoutRow } from "./_components/logout-row";
import { QuickActions } from "./_components/quick-actions";
import { PromoBanner } from "./_components/promo-banner";
import { SecondaryActions } from "./_components/secondary-actions";
import { SectionCard } from "./_components/section-card";
import { ActionRow } from "./_components/action-row";
import { BottomNav } from "../_components/bottom-nav";

const TIER_LABEL: Record<string, string> = {
  classic: "Classic",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
  diamond: "Diamond",
  premier: "Premier",
};

const STATUS_LABEL: Record<string, string> = {
  online: "Online",
  offline: "Offline",
};

export default async function ProfilPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;

  const [profile] = userId
    ? await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, userId))
        .limit(1)
    : [];

  const name = profile?.username ?? session?.user?.name ?? "Pengguna";
  const tier = TIER_LABEL[profile?.level ?? "classic"] ?? "Classic";
  const score = profile?.creditScore ?? 0;
  const status = isWithdrawLocked(profile)
    ? STATUS_LABEL.online
    : STATUS_LABEL[profile?.status ?? "online"] ?? STATUS_LABEL.online;
  const balance = profile?.balance ?? "0";

  return (
    <div className="min-h-full bg-zinc-50 pb-24">
      <ProfileHeader
        name={name}
        tier={tier}
        score={score}
        status={status}
      />

      <div className="relative z-10 mx-auto -mt-10 max-w-2xl px-4 sm:-mt-12 sm:px-6">
        <BalanceCard label="Total Saldo" amount={formatRupiah(balance)} />

        <QuickActions
          items={[
            { icon: Landmark, label: "Bank", href: "/bank" },
            { icon: ArrowDownToLine, label: "Tarik", href: "/withdraw" },
            { icon: Wallet, label: "Isi Ulang", href: "/recharge" },
            { icon: Headphones, label: "Bantuan", href: "/support" },
          ]}
        />

        <PromoBanner />

        <SecondaryActions
          actions={[
            { label: "Buka Toko", href: "https://www.tokopedia.com/" },
            { label: "Daftar Affiliate", href: "https://www.tokopedia.com/" },
          ]}
        />

        <SectionCard title="Aktivitas Saya">
          <ActionRow
            icon={FileText}
            label="Riwayat Penarikan"
            href="/profil/withdrawlist"
          />
          <ActionRow
            icon={History}
            label="Riwayat Isi Ulang"
            href="/profil/rechargelist"
          />
          <ActionRow
            icon={Bell}
            label="Pemberitahuan"
            href="/profil/notification"
          />
          <ActionRow
            icon={KeyRound}
            label="Ganti Sandi"
            href="/profil/change-password"
          />
        </SectionCard>

        <SectionCard title="Bantuan">
          <ActionRow
            icon={Headphones}
            label="Layanan Pelanggan"
            href="/support"
          />
          <LogoutRow icon={LogOut} label="Keluar" />
        </SectionCard>
      </div>

      <BottomNav />
    </div>
  );
}
