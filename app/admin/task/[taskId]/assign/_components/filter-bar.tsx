"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowDownUp, Search, X } from "lucide-react";

import { formatThousands, parseThousands } from "@/lib/format-rupiah";

type SortKey = "price_asc" | "price_desc";

type Props = {
  defaults: {
    q: string;
    min: string;
    max: string;
    inactive: boolean;
    sort: SortKey;
  };
  totalCount: number;
};

const TEXT_DEBOUNCE_MS = 300;

/** Mono uppercase label untuk tiap slot pada filter panel. */
function SlotLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="block font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
      {children}
    </span>
  );
}

/** Wrapper tiap slot: padding + garis bawah emerald halus saat ada fokus di dalamnya. */
function Slot({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative px-3.5 py-2.5 transition-colors focus-within:bg-emerald-50/40 focus-within:after:absolute focus-within:after:inset-x-0 focus-within:after:bottom-0 focus-within:after:h-px focus-within:after:bg-emerald-500">
      {children}
    </div>
  );
}

/** Input numerik dengan prefix "Rp" inline dan format ribuan otomatis. */
function MoneyInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
  inputRef,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
  ariaLabel: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div className="relative flex items-center">
      <span className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 font-mono text-[10px] text-zinc-400">
        Rp
      </span>
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) =>
          onChange(formatThousands(parseThousands(e.target.value)))
        }
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="w-24 bg-transparent py-1 pl-5 text-[12px] tabular-nums text-zinc-900 outline-none placeholder:text-zinc-400"
      />
    </div>
  );
}

export function FilterBar({ defaults, totalCount }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const [q, setQ] = useState(defaults.q);
  // State min/max menyimpan string berformat ribuan (mis. "50.000") supaya
  // user langsung melihat angka yang mudah dibaca. Konversi ke digit-only
  // dilakukan saat membangun URL.
  const [min, setMin] = useState(formatThousands(defaults.min));
  const [max, setMax] = useState(formatThousands(defaults.max));
  const [inactive, setInactive] = useState(defaults.inactive);
  const [sort, setSort] = useState<SortKey>(defaults.sort);

  const firstRun = useRef(true);
  const minRef = useRef<HTMLInputElement>(null);
  const maxRef = useRef<HTMLInputElement>(null);

  // Jaga posisi kursor di akhir setelah re-format ribuan (mis. "5000" -> "5.000").
  useLayoutEffect(() => {
    const el = minRef.current;
    if (el && document.activeElement === el) {
      const end = el.value.length;
      el.setSelectionRange(end, end);
    }
  }, [min]);
  useLayoutEffect(() => {
    const el = maxRef.current;
    if (el && document.activeElement === el) {
      const end = el.value.length;
      el.setSelectionRange(end, end);
    }
  }, [max]);

  // Bangun URL dari state saat ini + override, lalu navigasi.
  function apply(overrides?: Partial<{
    q: string;
    min: string;
    max: string;
    inactive: boolean;
    sort: SortKey;
  }>) {
    const next = {
      q: overrides?.q !== undefined ? overrides.q : q,
      min: overrides?.min !== undefined ? overrides.min : min,
      max: overrides?.max !== undefined ? overrides.max : max,
      inactive:
        overrides?.inactive !== undefined ? overrides.inactive : inactive,
      sort: overrides?.sort !== undefined ? overrides.sort : sort,
    };
    const params = new URLSearchParams();
    if (next.q) params.set("q", next.q);
    const minNum = parseThousands(next.min);
    const maxNum = parseThousands(next.max);
    if (minNum) params.set("min", minNum);
    if (maxNum) params.set("max", maxNum);
    if (next.inactive) params.set("inactive", "1");
    if (next.sort !== "price_asc") params.set("sort", next.sort);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  // Debounce auto-apply untuk input teks (q, min, max).
  useEffect(() => {
    if (firstRun.current) return;
    const t = setTimeout(() => apply({ q }), TEXT_DEBOUNCE_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  useEffect(() => {
    if (firstRun.current) return;
    const t = setTimeout(() => apply({ min }), TEXT_DEBOUNCE_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [min]);

  useEffect(() => {
    if (firstRun.current) return;
    const t = setTimeout(() => apply({ max }), TEXT_DEBOUNCE_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [max]);

  // Toggles & select langsung apply (tanpa debounce).
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    apply({ inactive });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inactive]);

  useEffect(() => {
    if (firstRun.current) return;
    apply({ sort });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort]);

  const showReset =
    !!q || !!min || !!max || inactive || sort !== "price_asc";

  return (
    <div className="overflow-hidden rounded-md bg-white ring-1 ring-zinc-200">
      {/* Baris utama: 3 slot (Cari, Rentang harga, Urut) dipisah divider. */}
      <div className="grid grid-cols-1 divide-y divide-zinc-200 md:grid-cols-[1fr_auto_auto] md:divide-x md:divide-y-0">
        <Slot>
          <SlotLabel>Cari</SlotLabel>
          <div className="relative mt-1">
            <Search className="pointer-events-none absolute left-0 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Nama produk..."
              className="w-full bg-transparent py-1 pl-5 pr-1 text-[12px] text-zinc-900 outline-none placeholder:text-zinc-400"
            />
          </div>
        </Slot>

        <Slot>
          <SlotLabel>Rentang harga</SlotLabel>
          <div className="mt-1 flex items-center gap-1.5">
            <MoneyInput
              value={min}
              onChange={setMin}
              placeholder="min"
              ariaLabel="Minimum harga"
              inputRef={minRef}
            />
            <span className="font-mono text-[10px] text-zinc-300">/</span>
            <MoneyInput
              value={max}
              onChange={setMax}
              placeholder="maks"
              ariaLabel="Maksimum harga"
              inputRef={maxRef}
            />
          </div>
        </Slot>

        <Slot>
          <SlotLabel>Urut</SlotLabel>
          <div className="mt-1 flex items-center gap-1.5">
            <ArrowDownUp className="size-3.5 text-zinc-400" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="bg-transparent py-1 pr-1 text-[12px] text-zinc-900 outline-none"
            >
              <option value="price_asc">Termurah dulu</option>
              <option value="price_desc">Termahal dulu</option>
            </select>
          </div>
        </Slot>
      </div>

      {/* Baris bawah: opsi utilitas (toggle, jumlah, reset) di strip kontras halus. */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 border-t border-zinc-200 bg-zinc-50/60 px-3.5 py-2 text-[11px]">
        <label className="flex cursor-pointer items-center gap-2 text-zinc-600 transition hover:text-zinc-900">
          <input
            type="checkbox"
            checked={inactive}
            onChange={(e) => setInactive(e.target.checked)}
            className="size-3.5 rounded-sm border-zinc-300 text-emerald-600 accent-emerald-600 focus:ring-emerald-500/30"
          />
          <span>Termasuk produk non-aktif</span>
        </label>
        <div className="flex items-center gap-3">
          <span className="font-mono tabular-nums text-zinc-500">
            {totalCount} produk
          </span>
          {showReset && (
            <Link
              href={pathname}
              className="inline-flex items-center gap-1 rounded-sm text-zinc-600 transition hover:text-zinc-900"
            >
              <X className="size-3" />
              <span>Reset</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
