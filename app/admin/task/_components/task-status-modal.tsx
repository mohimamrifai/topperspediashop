"use client";

import { useActionState, useEffect, useTransition } from "react";
import { Loader2, X } from "lucide-react";

import { updateTaskStatus } from "@/lib/actions/tasks-admin";

import { StatusBadge, type Status } from "./status-badge";
import {
  STATUS_EDITABLE,
  formatDate,
  initialReviewState,
  inputClass,
  useModalEscape,
  type Task,
} from "./task-shared";
import { formatRupiah } from "@/lib/format-rupiah";

export function TaskStatusModal({
  task,
  onClose,
  onUpdated,
}: {
  task: Task;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [state, action] = useActionState(updateTaskStatus, initialReviewState);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (state.success) onUpdated();
  }, [state.success, onUpdated]);

  useModalEscape(onClose);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Detail tugas #${task.id}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between sm:mb-5">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 sm:text-base">
              Detail Tugas #{task.id}
            </h2>
            <p className="mt-0.5 text-[11px] text-zinc-500 sm:text-xs">
              @{task.memberUsername} • {task.productName ?? "Belum dipilih"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="rounded-md p-1 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
          >
            <X className="size-4" />
          </button>
        </div>

        <dl className="mb-4 grid grid-cols-2 gap-3 rounded-md bg-zinc-50 p-3 text-[11px] sm:text-xs">
          <div>
            <dt className="text-zinc-500">Harga</dt>
            <dd className="font-semibold text-zinc-900">
              {formatRupiah(task.price)}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Komisi Dasar</dt>
            <dd className="font-semibold text-zinc-900">
              {formatRupiah(task.commission)}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Status</dt>
            <dd>
              <StatusBadge status={task.status} />
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Dibuat</dt>
            <dd className="text-zinc-700">{formatDate(task.createdAt)}</dd>
          </div>
        </dl>

        {task.status === "selesai" ? (
          <>
            <div className="rounded-md bg-emerald-50 px-3 py-2 text-[11px] text-emerald-700 sm:text-xs">
              Tugas ini sudah selesai dan komisi sudah dikredit ke saldo member.
            </div>
            <div className="mt-4 flex justify-end border-t border-zinc-200 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md bg-zinc-100 px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-200 sm:text-sm"
              >
                Tutup
              </button>
            </div>
          </>
        ) : (
          <form
            action={(fd) => {
              fd.set("taskId", String(task.id));
              startTransition(() => action(fd));
            }}
            className="space-y-3"
          >
            <div>
              <label className="mb-1 block text-[11px] font-medium text-zinc-700 sm:text-xs">
                Ubah Status
              </label>
              <select
                name="status"
                defaultValue={task.status as Status}
                className={inputClass}
                disabled={pending}
              >
                {STATUS_EDITABLE.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-zinc-500 sm:text-xs">
                Mengubah ke <strong>Selesai</strong> akan otomatis mengkredit
                komisi (berdasarkan level member) dan memperbarui level.
              </p>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-zinc-700 sm:text-xs">
                Catatan (opsional)
              </label>
              <textarea
                name="notes"
                rows={2}
                className={inputClass}
                placeholder="cth: Bukti pekerjaan lengkap"
                disabled={pending}
              />
            </div>

            {state.error && (
              <p className="rounded-md bg-rose-50 px-3 py-2 text-[11px] text-rose-700 sm:text-xs">
                {state.error}
              </p>
            )}
            {state.success && state.message && (
              <p className="rounded-md bg-emerald-50 px-3 py-2 text-[11px] text-emerald-700 sm:text-xs">
                {state.message}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md bg-zinc-100 px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-200 sm:text-sm"
              >
                Tutup
              </button>
              <button
                type="submit"
                disabled={pending}
                className="inline-flex items-center justify-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50 sm:text-sm"
              >
                {pending && <Loader2 className="size-3 animate-spin" />}
                Simpan
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
