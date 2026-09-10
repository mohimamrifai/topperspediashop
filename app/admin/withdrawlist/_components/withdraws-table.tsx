"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { formatRupiah } from "@/lib/format-rupiah";
import Row from "./row";

export const STATUS_OPTIONS = [
  { value: "all", label: "Semua Status" },
  { value: "pending", label: "Menunggu" },
  { value: "completed", label: "Selesai" },
  { value: "rejected", label: "Ditolak" },
] as const;

export const statusStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
};

export const statusLabels: Record<string, string> = {
  pending: "Menunggu",
  completed: "Selesai",
  rejected: "Ditolak",
};

export const headerCellClass =
  "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-600 sm:px-4 sm:py-3 sm:text-xs";

export const aksiHeaderClass =
  "sticky right-0 border-l border-zinc-200 bg-zinc-100 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-600 sm:static sm:border-l-0 sm:px-4 sm:py-3 sm:text-xs";

export const cellClass =
  "px-3 py-2 text-xs text-zinc-700 sm:px-4 sm:py-3 sm:text-sm";

export const aksiCellClass =
  "sticky right-0 border-l border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-700 group-hover:bg-zinc-50/60 sm:static sm:border-l-0 sm:bg-transparent sm:group-hover:bg-transparent sm:px-4 sm:py-3 sm:text-sm";

export const inputClass =
  "rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:text-sm";

export type WithdrawStatus = "pending" | "completed" | "rejected";

export type Withdraw = {
  id: number;
  memberUsername: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  amount: string;
  status: WithdrawStatus;
  notes: string | null;
  createdAt: string;
};

type ReviewState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
  success?: boolean;
};

export const initialReview: ReviewState = {};

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function WithdrawsTable({
  initialWithdraws,
}: {
  initialWithdraws: Withdraw[];
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return initialWithdraws.filter((w) => {
      if (statusFilter !== "all" && w.status !== statusFilter) return false;
      if (!q) return true;
      return (
        w.memberUsername.toLowerCase().includes(q) ||
        w.bankName.toLowerCase().includes(q) ||
        w.accountNumber.includes(q)
      );
    });
  }, [initialWithdraws, query, statusFilter]);

  const totalAmount = useMemo(() => {
    return filtered
      .filter((w) => w.status === "completed")
      .reduce((sum, w) => sum + Number(w.amount), 0);
  }, [filtered]);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-zinc-200/60 sm:p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Cari user / bank / rekening..."
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
            {filtered.length} item • Total selesai:{" "}
            <span className="font-semibold text-emerald-700">
              {formatRupiah(totalAmount)}
            </span>
          </span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-zinc-200/60">
        <table className="w-full min-w-[860px] border-collapse">
          <thead className="bg-zinc-100">
            <tr>
              <th className={headerCellClass}>User</th>
              <th className={headerCellClass}>Bank</th>
              <th className={headerCellClass}>Pemilik</th>
              <th className={headerCellClass}>No. Rekening</th>
              <th className={headerCellClass}>Jumlah</th>
              <th className={headerCellClass}>Tanggal</th>
              <th className={headerCellClass}>Status</th>
              <th className={aksiHeaderClass}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-3 py-6 text-center text-xs text-zinc-500 sm:text-sm"
                >
                  {initialWithdraws.length === 0
                    ? "Belum ada pengajuan penarikan."
                    : "Tidak ada data yang cocok."}
                </td>
              </tr>
            ) : (
              filtered.map((w) => (
                <Row
                  key={w.id}
                  withdraw={w}
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
