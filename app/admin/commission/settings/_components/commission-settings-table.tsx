"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Loader2, Save } from "lucide-react";

import { updateCommissionSetting } from "@/lib/actions/commission-settings";

type Row = {
  level: string;
  label: string;
  currentPercent: string;
  defaultPercent: string;
};

const inputClass =
  "w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:text-sm";

const headerCellClass =
  "px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-zinc-600 sm:px-4 sm:py-3 sm:text-xs ";

const cellClass =
  "px-3 py-2 text-xs text-zinc-700 sm:px-4 sm:py-3 sm:text-sm";

function EditCell({ row }: { row: Row }) {
  const [state, action] = useActionState(updateCommissionSetting, {});
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState<string>(row.currentPercent);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    // Initial state `{}` tidak punya `success`, otomatis skip.
    // Aman terhadap React StrictMode (double-invoke effect di dev).
    if (!state.success || !state.message) return;
    // Reset state lokal dipicu oleh transisi state.success dari server action,
    // bukan derivasi. Set di useEffect adalah pola yang benar untuk side effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToast(state.message);
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [state]);

  return (
    <form
      action={(fd) => startTransition(() => action(fd))}
      className="flex items-center justify-end gap-1.5"
    >
      <input type="hidden" name="level" value={row.level} />
      <div className="relative w-24">
        <input
          type="text"
          inputMode="decimal"
          name="percent"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={row.defaultPercent}
          disabled={pending}
          className={`${inputClass} pr-7`}
        />
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
          %
        </span>
      </div>
      <button
        type="submit"
        disabled={pending}
        aria-label={`Simpan komisi ${row.label}`}
        className="inline-flex items-center justify-center gap-1 rounded-md bg-indigo-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
      >
        {pending ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
        Simpan
      </button>
      {state.fieldErrors?.percent?.[0] && (
        <p className="ml-2 text-[11px] text-rose-600">
          {state.fieldErrors.percent[0]}
        </p>
      )}
      {toast && (
        <span className="ml-2 text-[11px] font-medium text-emerald-700">
          {toast}
        </span>
      )}
    </form>
  );
}

export function CommissionSettingsTable({ initialRows }: { initialRows: Row[] }) {
  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-zinc-200/60">
      <table className="w-full min-w-[480px] border-collapse">
        <thead className="bg-zinc-100">
          <tr>
            <th className={headerCellClass}>Level</th>
            <th className={headerCellClass}>Aktif Saat Ini</th>
            <th className={headerCellClass}>Edit</th>
          </tr>
        </thead>
        <tbody>
          {initialRows.map((r) => {
            const overridden = r.currentPercent !== r.defaultPercent;
            return (
              <tr
                key={r.level}
                className="border-t border-zinc-200 transition hover:bg-zinc-50/60"
              >
                <td className={`${cellClass} font-medium text-zinc-900 text-center`}>
                  {r.label}
                </td>
                <td className={`${cellClass} text-center`}>
                  {overridden ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 sm:text-xs">
                      {r.currentPercent}%
                    </span>
                  ) : (
                    <span className="text-zinc-500">{r.currentPercent}% (default)</span>
                  )}
                </td>
                <td className={cellClass}>
                  <EditCell row={r} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
