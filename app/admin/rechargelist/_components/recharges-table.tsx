"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ExternalLink, Search, X } from "lucide-react";

import { reviewDeposit } from "@/lib/actions/deposits-admin";
import { formatRupiah } from "@/lib/format-rupiah";

const STATUS_OPTIONS = [
  { value: "all", label: "Semua Status" },
  { value: "pending", label: "Menunggu" },
  { value: "approved", label: "Disetujui" },
  { value: "rejected", label: "Ditolak" },
] as const;

const statusStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
};

const statusLabels: Record<string, string> = {
  pending: "Menunggu",
  approved: "Disetujui",
  rejected: "Ditolak",
};

const headerCellClass =
  "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-600 sm:px-4 sm:py-3 sm:text-xs";

const aksiHeaderClass =
  "sticky right-0 border-l border-zinc-200 bg-zinc-100 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-600 sm:static sm:border-l-0 sm:px-4 sm:py-3 sm:text-xs";

const cellClass =
  "px-3 py-2 text-xs text-zinc-700 sm:px-4 sm:py-3 sm:text-sm";

const aksiCellClass =
  "sticky right-0 border-l border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-700 group-hover:bg-zinc-50/60 sm:static sm:border-l-0 sm:bg-transparent sm:group-hover:bg-transparent sm:px-4 sm:py-3 sm:text-sm";

const inputClass =
  "rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:text-sm";

type Recharge = {
  id: number;
  memberUsername: string;
  amount: string;
  status: "pending" | "approved" | "rejected";
  proofUrl: string | null;
  notes: string | null;
  createdAt: string;
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function RechargesTable({
  initialRecharges,
}: {
  initialRecharges: Recharge[];
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return initialRecharges.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!q) return true;
      return r.memberUsername.toLowerCase().includes(q);
    });
  }, [initialRecharges, query, statusFilter]);

  const totalAmount = useMemo(() => {
    return filtered
      .filter((r) => r.status === "approved")
      .reduce((sum, r) => sum + Number(r.amount), 0);
  }, [filtered]);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-zinc-200/60 sm:p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Cari username..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={`${inputClass} w-full pl-8`}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={inputClass}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <span className="text-xs text-zinc-500 sm:ml-auto sm:text-sm">
            {filtered.length} item • Total disetujui:{" "}
            <span className="font-semibold text-emerald-700">
              {formatRupiah(totalAmount)}
            </span>
          </span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-zinc-200/60">
        <table className="w-full min-w-[820px] border-collapse">
          <thead className="bg-zinc-100">
            <tr>
              <th className={headerCellClass}>User</th>
              <th className={headerCellClass}>Jumlah</th>
              <th className={headerCellClass}>Tanggal</th>
              <th className={headerCellClass}>Bukti</th>
              <th className={headerCellClass}>Status</th>
              <th className={aksiHeaderClass}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-6 text-center text-xs text-zinc-500 sm:text-sm"
                >
                  {initialRecharges.length === 0
                    ? "Belum ada pengajuan deposit."
                    : "Tidak ada data yang cocok."}
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <Row
                  key={r.id}
                  recharge={r}
                  onUpdated={() => {}}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Row({
  recharge,
  onUpdated,
}: {
  recharge: Recharge;
  onUpdated: (r: Recharge) => void;
}) {
  const [reviewing, setReviewing] = useState<"approve" | "reject" | null>(null);

  return (
    <tr className="group border-t border-zinc-200 transition hover:bg-zinc-50/60">
      <td className={`${cellClass} font-medium text-zinc-900`}>
        {recharge.memberUsername}
      </td>
      <td className={cellClass}>{formatRupiah(recharge.amount)}</td>
      <td className={cellClass}>{formatDate(recharge.createdAt)}</td>
      <td className={cellClass}>
        {recharge.proofUrl ? (
          <a
            href={recharge.proofUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline sm:text-sm"
          >
            Lihat
            <ExternalLink className="size-3" />
          </a>
        ) : (
          <span className="text-zinc-400">—</span>
        )}
      </td>
      <td className={cellClass}>
        <span
          className={`inline-block rounded-md px-2 py-0.5 text-xs font-semibold ${statusStyles[recharge.status]}`}
        >
          {statusLabels[recharge.status]}
        </span>
        {recharge.notes && (
          <p className="mt-1 text-[10px] text-zinc-500 sm:text-xs">
            {recharge.notes}
          </p>
        )}
      </td>
      <td className={aksiCellClass}>
        {recharge.status === "pending" ? (
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => setReviewing("approve")}
              className="inline-flex items-center justify-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-emerald-700"
            >
              <Check className="size-3" />
              Setujui
            </button>
            <button
              type="button"
              onClick={() => setReviewing("reject")}
              className="inline-flex items-center justify-center gap-1 rounded-md bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-rose-700"
            >
              <X className="size-3" />
              Tolak
            </button>
          </div>
        ) : (
          <span className="text-xs text-zinc-400">—</span>
        )}
      </td>

      {reviewing && (
        <ReviewModal
          recharge={recharge}
          action={reviewing}
          onClose={() => setReviewing(null)}
          onSuccess={(updated) => {
            onUpdated(updated);
            setReviewing(null);
          }}
        />
      )}
    </tr>
  );
}

type ReviewState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
  success?: boolean;
};

const initialReview: ReviewState = {};

function ReviewModal({
  recharge,
  action,
  onClose,
  onSuccess,
}: {
  recharge: Recharge;
  action: "approve" | "reject";
  onClose: () => void;
  onSuccess: (updated: Recharge) => void;
}) {
  const [state, formAction, isPending] = useActionState(
    reviewDeposit,
    initialReview,
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Set mounted=true sekali setelah mount untuk handle portal SSR.
    // Pola yang benar untuk inisialisasi berbasis client-only state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Tutup otomatis saat submit sukses + panggil callback ke parent
  useEffect(() => {
    if (!state.success) return;
    onSuccess({
      ...recharge,
      status: action === "approve" ? "approved" : "rejected",
      // Notes hanya relevan untuk reject; approve tidak punya catatan.
      notes: action === "reject" ? recharge.notes : null,
    });
  }, [state.success, action, recharge, onSuccess]);

  const isApprove = action === "approve";

  // Render via portal ke body supaya tidak nested di <tr> (hydration error).
  // SSR aman: render null sampai mount (document.body hanya ada di client).
  if (!mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isApprove ? "Setujui deposit" : "Tolak deposit"}
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 p-3 sm:p-4"
      onClick={onClose}
    >
      <form
        action={formAction}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl sm:p-5"
      >
        <input type="hidden" name="id" value={recharge.id} />
        <input type="hidden" name="action" value={action} />

        <h2
          className={`text-sm font-bold sm:text-base ${isApprove ? "text-emerald-700" : "text-rose-700"}`}
        >
          {isApprove ? "Setujui Deposit" : "Tolak Deposit"}
        </h2>
        <p className="mt-1 text-xs text-zinc-600 sm:text-sm">
          <span className="font-medium text-zinc-900">
            {recharge.memberUsername}
          </span>{" "}
          • {formatRupiah(recharge.amount)}
        </p>

        {/* Catatan hanya untuk reject — approve tidak butuh catatan. */}
        {!isApprove && (
          <label className="mt-3 block">
            <span className="mb-1 block text-xs font-semibold text-zinc-900 sm:text-sm">
              Alasan Penolakan
            </span>
            <textarea
              name="notes"
              rows={3}
              defaultValue={recharge.notes ?? ""}
              placeholder="cth: Bukti tidak terbaca, mohon upload ulang."
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:text-sm"
            />
          </label>
        )}

        {state.error && (
          <p className="mt-2 rounded-md bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 sm:text-sm">
            {state.error}
          </p>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-zinc-100 px-4 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-200 sm:text-sm"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isPending}
            className={`inline-flex items-center justify-center gap-1.5 rounded-md px-4 py-2 text-xs font-semibold text-white transition disabled:opacity-60 sm:text-sm ${
              isApprove
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-rose-600 hover:bg-rose-700"
            }`}
          >
            {isApprove ? <Check className="size-3.5" /> : <X className="size-3.5" />}
            {isPending ? "Memproses..." : isApprove ? "Setujui" : "Tolak"}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
}
