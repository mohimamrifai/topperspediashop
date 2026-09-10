import { ChevronRight } from "lucide-react";

export function PromoBanner() {
  return (
    <a
      href="#"
      className="mt-3 flex items-start gap-3 rounded-2xl bg-emerald-50/80 p-3.5 ring-1 ring-emerald-200/60 transition hover:bg-emerald-50 sm:mt-4 sm:gap-4 sm:p-4"
    >
      <div className="min-w-0 flex-1 space-y-1.5">
        <span className="inline-flex items-center rounded-md bg-brand px-2 py-0.5 text-[10px] font-bold tracking-wider text-white sm:text-xs">
          PLUS
        </span>
        <p className="text-sm font-semibold text-brand sm:text-base">
          Nikmati Gratis Ongkir tanpa batas.
        </p>
        <p className="text-[11px] text-zinc-500 sm:text-xs">
          Min. belanja Rp0 &amp; bebas biaya aplikasi.
        </p>
      </div>
      <ChevronRight
        className="mt-0.5 size-4 shrink-0 text-brand sm:size-5"
        strokeWidth={2}
      />
    </a>
  );
}
