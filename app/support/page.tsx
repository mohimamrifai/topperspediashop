import { ArrowLeft, Headphones, Send } from "lucide-react";
import Link from "next/link";
import { asc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { customerServiceChannels } from "@/lib/db/schema";

import { BottomNav } from "../_components/bottom-nav";

const typeTone: Record<string, string> = {
  whatsapp: "bg-emerald-100 text-emerald-600",
  telegram: "bg-sky-100 text-sky-600",
};

const typeBadge: Record<string, string> = {
  whatsapp: "bg-emerald-50 text-emerald-700",
  telegram: "bg-sky-50 text-sky-700",
};

const typeLabel: Record<string, string> = {
  whatsapp: "WhatsApp",
  telegram: "Telegram",
};

export default async function SupportPage() {
  const channels = await db
    .select({
      id: customerServiceChannels.id,
      type: customerServiceChannels.type,
      label: customerServiceChannels.label,
      url: customerServiceChannels.url,
    })
    .from(customerServiceChannels)
    .where(eq(customerServiceChannels.isActive, true))
    .orderBy(
      asc(customerServiceChannels.sortOrder),
      asc(customerServiceChannels.id),
    );

  return (
    <div className="min-h-full bg-zinc-50 pb-24">
      <div className="relative z-0 overflow-hidden rounded-b-3xl bg-brand text-white">
        <div className="pointer-events-none absolute -top-12 -right-10 size-44 rounded-full bg-emerald-700/40" />
        <div className="pointer-events-none absolute -top-6 right-32 size-20 rounded-full bg-emerald-700/30" />
        <div className="pointer-events-none absolute -bottom-20 right-1/3 size-40 rounded-full bg-emerald-700/35" />
        <div className="pointer-events-none absolute -bottom-10 -right-6 size-28 rounded-full bg-emerald-700/30" />

        <div className="relative z-10 mx-auto flex max-w-2xl items-center gap-3 px-4 pt-6 pb-10 sm:px-6 sm:pt-8 sm:pb-14">
          <Link
            href="/profil"
            aria-label="Kembali"
            className="rounded-full bg-white/15 p-2 text-white transition hover:bg-white/25"
          >
            <ArrowLeft className="size-4 sm:size-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold sm:text-xl">Layanan Pelanggan</h1>
            <p className="mt-0.5 text-xs text-white/85 sm:text-sm">
              Hubungi tim kami untuk bantuan terkait akun, deposit, atau
              penarikan.
            </p>
          </div>
          <div className="flex size-10 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/30 sm:size-12">
            <Headphones className="size-5 text-white sm:size-6" />
          </div>
        </div>
      </div>

      <div className="relative z-20 mx-auto -mt-6 max-w-2xl px-4 sm:-mt-8 sm:px-6">
        <div className="overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-zinc-200/60">
          <div className="border-b border-zinc-200 px-4 py-3 sm:px-5 sm:py-3.5">
            <h2 className="text-sm font-semibold text-zinc-900 sm:text-base">
              Pilih Channel
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500 sm:text-xs">
              Klik tombol Buka untuk terhubung ke layanan pelanggan.
            </p>
          </div>

          {channels.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-zinc-500 sm:py-12">
              Belum ada channel layanan yang tersedia.
            </div>
          ) : (
            <ul className="divide-y divide-zinc-200">
              {channels.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center gap-3 px-4 py-3.5 sm:px-5 sm:py-4"
                >
                  <div
                    className={`flex size-11 shrink-0 items-center justify-center rounded-full sm:size-12 ${typeTone[c.type] ?? "bg-zinc-100 text-zinc-600"}`}
                  >
                    <Send className="size-5" strokeWidth={1.8} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-zinc-900 sm:text-base">
                        {c.label}
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${typeBadge[c.type] ?? "bg-zinc-50 text-zinc-700"}`}
                      >
                        {typeLabel[c.type] ?? c.type}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-zinc-500">
                      {c.url}
                    </p>
                  </div>
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex shrink-0 items-center justify-center rounded-full bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700 active:bg-indigo-800 sm:px-4 sm:py-2 sm:text-sm"
                  >
                    Buka
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="mt-3 text-center text-[11px] text-zinc-500 sm:text-xs">
          Untuk pertanyaan terkait tugas &amp; komisi, hubungi staff
          operasional Anda terlebih dahulu.
        </p>
      </div>

      <BottomNav />
    </div>
  );
}
