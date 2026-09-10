import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { BottomNav } from "../../_components/bottom-nav";

export default function NotificationPage() {
  return (
    <div className="min-h-full bg-zinc-50 pb-24">
      <header className="sticky top-0 z-30 bg-emerald-600 text-white shadow-sm">
        <div className="relative mx-auto flex max-w-2xl items-center px-4 py-3 sm:px-6 sm:py-3.5">
          <Link
            href="/profil"
            aria-label="Kembali"
            className="absolute left-4 inline-flex items-center justify-center text-white transition hover:text-white/80 sm:left-6"
          >
            <ArrowLeft className="size-4 sm:size-5" />
          </Link>
          <h1 className="mx-auto text-sm font-bold sm:text-base">
            Pemberitahuan
          </h1>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-center text-xs text-zinc-500 sm:text-sm">
          Belum ada pemberitahuan.
        </p>
      </div>

      <BottomNav />
    </div>
  );
}
