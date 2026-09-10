import { setStaffCommissionRate } from "@/lib/actions/commission";
import { useActionState, useEffect, useState, useTransition } from "react";
import Row from "./row-type";
import { Loader2, Percent, Save, X } from "lucide-react";


const inputClass =
  "w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:text-sm";

function useModalLifecycle(onClose: () => void) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);
}


export default function EditRateModal({
  row,
  onClose,
  onSaved,
}: {
  row: Row;
  onClose: () => void;
  onSaved: (msg: string, newRate: string | null) => void;
}) {
  const [state, action] = useActionState(setStaffCommissionRate, {});
  const [pending, startTransition] = useTransition();
  const [rate, setRate] = useState<string>(row.commissionRate ?? "");

  useEffect(() => {
    // Initial state `{}` tidak punya `success`, jadi otomatis skip.
    // Aman terhadap React StrictMode (double-invoke effect di dev)
    // karena berbasis nilai `state` bukan ref yang di-mutate.
    if (!state.success || !state.message) return;
    onSaved(state.message, rate.trim() === "" ? null : rate.trim());
  }, [state, onSaved, rate]);

  useModalLifecycle(onClose);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Atur komisi @${row.username}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between sm:mb-5">
          <h2 className="text-sm font-bold text-zinc-900 sm:text-base">
            Atur Komisi @{row.username}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="rounded-md p-1 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
          >
            <X className="size-4" />
          </button>
        </div>

        <form
          action={(fd) => startTransition(() => action(fd))}
          className="space-y-3"
        >
          <input type="hidden" name="staffId" value={row.staffId} />

          <div>
            <label
              htmlFor="rate"
              className="mb-1 block text-[11px] font-medium text-zinc-700 sm:text-xs"
            >
              Rate Komisi (%)
            </label>
            <div className="relative">
              <Percent className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
              <input
                id="rate"
                name="rate"
                type="text"
                inputMode="decimal"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="cth: 5 (kosongkan untuk nonaktifkan)"
                disabled={pending}
                className={`${inputClass} pl-8`}
              />
            </div>
            <p className="mt-1 text-[11px] text-zinc-500 sm:text-xs">
              0–100. Kosongkan untuk menonaktifkan komisi staff ini.
            </p>
            {state.fieldErrors?.rate?.[0] && (
              <p className="mt-1 text-[11px] text-rose-600">
                {state.fieldErrors.rate[0]}
              </p>
            )}
          </div>

          {state.error && (
            <p className="rounded-md bg-rose-50 px-3 py-2 text-[11px] text-rose-700 sm:text-xs">
              {state.error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="rounded-md bg-zinc-100 px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-200 disabled:opacity-50 sm:text-sm"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50 sm:text-sm"
            >
              {pending ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}