"use client";

import { useEffect, type ReactNode } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

const secondaryBtn =
  "rounded-md border border-zinc-200 bg-white px-4 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm";

type Props = {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  pending?: boolean;
  error?: string;
  children?: ReactNode;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
  pending = false,
  error,
  children,
}: Props) {
  useEffect(() => {
    if (!open) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) onCancel();
    };

    document.addEventListener("keydown", handleKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, pending, onCancel]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-60 flex items-center justify-center bg-zinc-900/50 p-3 sm:p-4"
      onClick={() => {
        if (!pending) onCancel();
      }}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <AlertTriangle className="size-5" strokeWidth={1.8} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 sm:text-base">
              {title}
            </h3>
            <p className="mt-1 text-[11px] leading-relaxed text-zinc-600 sm:text-xs">
              {description}
            </p>
          </div>
        </div>

        {children}

        {error && (
          <p className="mb-3 rounded-md bg-rose-50 px-3 py-2 text-[11px] text-rose-700 sm:text-xs">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className={secondaryBtn}
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
          >
            {pending && <Loader2 className="size-3 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
