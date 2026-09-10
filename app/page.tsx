import Image from "next/image";

import { getCurrentUser } from "@/lib/auth/session";

import { BottomNav } from "./_components/bottom-nav";
import { PartnerStrip } from "./_components/partner-strip";
import { ProductCard } from "./_components/product-card";
import { PromoMarquee } from "./_components/promo-marquee";
import { TopBar } from "./_components/top-bar";

// Daftar produk statis untuk halaman promosi. Tidak bergantung pada database
// agar halaman utama tetap stabil dan tidak terpengaruh perubahan stok di admin.
const PROMOTED_PRODUCTS = [
  {
    id: 1,
    name: "JAM TANGAN ALEXANDRE CHRISTIE AC 6141 COUPLE!! MURAH MERIAH GARANSI RESMI!!",
    image: "/satu.jpg",
  },
  {
    id: 2,
    name: "SMILE ART Jumper Hoodie II SMILE ART Sweater Hoodie II Sweter Oblong Topi SIZE M - XL (Pria & Wanita / Anak & Dewasa)",
    image: "/dua.webp",
  },
  {
    id: 3,
    name: "TZ-BAJU SWEATSHIRT PIRATE PANJANG-BAJU DISTRO KEREN MODEL KEKINIAN-REAL PICT-BISA COD",
    image: "/tiga.webp",
  },
  {
    id: 4,
    name: "TTWS M19 HEADSET BLUETOOTH WIRELESS GAMING TWS 5.1 + POWERBANK 3500 MAH",
    image: "/empat.webp",
  },
  {
    id: 5,
    name: "DIVEBLUES kipas mini portable angin Kipas Lipat Portable Digital Display High-speed",
    image: "/lima.webp",
  },
  {
    id: 6,
    name: "Dompet Wanita Aurora Bordir Premium Berkualitas Dompet Pendek Genggam",
    image: "/enam.webp",
  },
  {
    id: 7,
    name: "MXQ PRO Android TV Box 4K HD Smart Set Top Box 64GB Ram 512GB Rom 2.4GHz/5G WiFi Connection Support External Device USB",
    image: "/tujuh.webp",
  },
  {
    id: 8,
    name: "Sandal Pria keren Sandal slop Pria sandal Gunung Pria original 100 cowok Kulit Trendy Terkini sendal gunung pria elegan ori kece casual",
    image: "/delapan.webp",
  },
];

export default async function HomePage() {
  // Tombol "Promosikan" mengarah ke /task untuk user login, /register untuk tamu.
  const user = await getCurrentUser();
  const promoteHref = user ? "/task" : "/register";

  return (
    <div className="min-h-full bg-zinc-50 pb-28">
      <TopBar />

      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <div className="mt-3 overflow-hidden rounded-2xl sm:mt-4">
          <Image
            src="/banner.webp"
            alt="Dekorasi Toko"
            width={1024}
            height={409}
            priority
            className="h-auto w-full"
          />
        </div>

        <PromoMarquee />

        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:mt-5 sm:gap-3">
          {PROMOTED_PRODUCTS.map((p) => (
            <ProductCard
              key={p.id}
              title={p.name}
              href={promoteHref}
              imageSlot={
                <Image
                  src={p.image}
                  alt={p.name}
                  width={400}
                  height={400}
                  className="h-full w-full object-cover"
                />
              }
            />
          ))}
        </div>

        <PartnerStrip />
      </div>

      <BottomNav />
    </div>
  );
}
