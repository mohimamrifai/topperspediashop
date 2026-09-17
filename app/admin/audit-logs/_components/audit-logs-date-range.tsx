"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, RotateCcw } from "lucide-react";

const inputClass =
  "w-full rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400 sm:text-sm";

const labelClass = "text-[11px] font-medium text-zinc-500 sm:text-xs";

export function AuditLogsDateRange() {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  const hasRange = Boolean(from && to);

  function update(key: "from" | "to", value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    startTransition(() => {
      router.replace(`/admin/audit-logs?${next.toString()}`);
    });
  }

  function reset() {
    startTransition(() => {
      router.replace("/admin/audit-logs");
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-white p-3.5 shadow-sm ring-1 ring-zinc-200/60 sm:flex-row sm:items-end sm:gap-3 sm:p-4">
      <div className="flex items-center gap-2 text-zinc-700">
        <Calendar className="size-4 text-indigo-600" />
        <span className="text-xs font-semibold sm:text-sm">Filter Tanggal</span>
      </div>

      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:gap-2">
        <label className="flex flex-1 flex-col gap-1">
          <span className={labelClass}>Dari</span>
          <input
            type="date"
            value={from}
            max={to || undefined}
            onChange={(e) => update("from", e.target.value)}
            disabled={pending}
            className={inputClass}
          />
        </label>
        <label className="flex flex-1 flex-col gap-1">
          <span className={labelClass}>Sampai</span>
          <input
            type="date"
            value={to}
            min={from || undefined}
            onChange={(e) => update("to", e.target.value)}
            disabled={pending}
            className={inputClass}
          />
        </label>
      </div>

      <button
        type="button"
        onClick={reset}
        disabled={!hasRange || pending}
        className="inline-flex items-center justify-center gap-1.5 self-start rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 active:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto sm:text-sm"
      >
        <RotateCcw className="size-3.5" />
        Reset
      </button>
    </div>
  );
}
