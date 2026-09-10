"use client";

import { useActionState, useEffect, useTransition } from "react";
import { Loader2, X } from "lucide-react";

import { updateTaskStatus } from "@/lib/actions/tasks-admin";

import {
  initialReviewState,
  useModalEscape,
  type Task,
} from "./task-shared";
import { formatRupiah } from "@/lib/format-rupiah";

export function ConfirmTaskModal({
  task,
  onClose,
  onConfirmed,
}: {
  task: Task;
  onClose: () => void;
  onConfirmed: (msg: string) => void;
}) {
  const [state, action] = useActionState(updateTaskStatus, initialReviewState);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (state.success && state.message) onConfirmed(state.message);
  }, [state.success, state.message, onConfirmed]);

  useModalEscape(onClose);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Konfirmasi tugas #${task.id}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between sm:mb-5">
          <h2 className="text-sm font-bold text-zinc-900 sm:text-base">
            Konfirmasi Tugas
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

        <dl className="space-y-2 rounded-md bg-zinc-50 p-3 text-[11px] sm:text-xs">
          <div className="flex items-start justify-between gap-3">
            <dt className="shrink-0 text-zinc-500">Nama Member</dt>
            <dd className="text-right font-medium text-zinc-900">
              {task.memberUsername}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-3">
            <dt className="shrink-0 text-zinc-500">Produk</dt>
            <dd className="text-right font-medium text-zinc-900">
              {task.productName ?? "(produk dihapus)"}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-3">
            <dt className="shrink-0 text-zinc-500">Status</dt>
            <dd className="text-right font-medium text-zinc-900">dikerjakan</dd>
          </div>
          <div className="flex items-start justify-between gap-3">
            <dt className="shrink-0 text-zinc-500">Harga Produk</dt>
            <dd className="text-right font-semibold text-zinc-900">
              {formatRupiah(task.price)}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-3">
            <dt className="shrink-0 text-zinc-500">Komisi</dt>
            <dd className="text-right font-semibold text-zinc-900">
              {formatRupiah(task.commission)}
            </dd>
          </div>
        </dl>

        <form
          action={(fd) => {
            fd.set("taskId", String(task.id));
            fd.set("status", "selesai");
            startTransition(() => action(fd));
          }}
          className="mt-4 space-y-3"
        >
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
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50 sm:text-sm"
            >
              {pending && <Loader2 className="size-3 animate-spin" />}
              Konfirmasi Tugas
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
