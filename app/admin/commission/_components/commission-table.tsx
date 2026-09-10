"use client";

import { useState } from "react";
import { Pencil, Percent } from "lucide-react";
import Row from "./row-type";
import { formatRupiah } from "@/lib/format-rupiah";
import EditRateModal from "./edit-rate-modal";

const headerCellClass =
  "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-600 sm:px-4 sm:py-3 sm:text-xs";

const cellClass =
  "px-3 py-2 text-xs text-zinc-700 sm:px-4 sm:py-3 sm:text-sm";


export function CommissionTable({
  initialRows,
  isCurrentSuperAdmin,
}: {
  initialRows: Row[];
  isCurrentSuperAdmin: boolean;
}) {
  const [editing, setEditing] = useState<Row | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-zinc-200/60">
        <table className="w-full min-w-[760px] border-collapse">
          <thead className="bg-zinc-100">
            <tr>
              <th className={headerCellClass}>Staff</th>
              <th className={headerCellClass}>Leader</th>
              <th className={headerCellClass}>Referral</th>
              <th className={headerCellClass}>Total Deposit</th>
              <th className={headerCellClass}>Total Penarikan</th>
              <th className={headerCellClass}>Rate Komisi</th>
              {isCurrentSuperAdmin && <th className={headerCellClass}>Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {initialRows.length === 0 ? (
              <tr>
                <td
                  colSpan={isCurrentSuperAdmin ? 7 : 6}
                  className="px-3 py-6 text-center text-xs text-zinc-500 sm:text-sm"
                >
                  Belum ada staff.
                </td>
              </tr>
            ) : (
              initialRows.map((r) => (
                <tr
                  key={r.staffId}
                  className="border-t border-zinc-200 transition hover:bg-zinc-50/60"
                >
                  <td className={`${cellClass} font-medium text-zinc-900`}>
                    @{r.username}
                  </td>
                  <td className={cellClass}>
                    {r.leaderUsername ? (
                      `@${r.leaderUsername}`
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </td>
                  <td className={`${cellClass} font-mono text-[11px]`}>
                    {r.referralCode ?? "—"}
                  </td>
                  <td className={`${cellClass} font-medium text-emerald-700`}>
                    {formatRupiah(r.totalDeposit)}
                  </td>
                  <td className={`${cellClass} font-medium text-rose-700`}>
                    {formatRupiah(r.totalWithdrawal)}
                  </td>
                  <td className={cellClass}>
                    {r.commissionRate !== null ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 sm:text-xs">
                        <Percent className="size-3" />
                        {r.commissionRate}%
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-400 sm:text-sm">
                        Nonaktif
                      </span>
                    )}
                  </td>
                  {isCurrentSuperAdmin && (
                    <td className={cellClass}>
                      <button
                        type="button"
                        onClick={() => setEditing(r)}
                        aria-label={`Atur komisi @${r.username}`}
                        className="inline-flex items-center justify-center gap-1 rounded-md bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-700 transition hover:bg-sky-200"
                      >
                        <Pencil className="size-3" />
                        Atur
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <EditRateModal
          row={editing}
          onClose={() => setEditing(null)}
          onSaved={(msg) => {
            setEditing(null);
            setToast({ type: "success", text: msg });
          }}
        />
      )}

      {toast && (
        <div
          role="status"
          className={`fixed left-1/2 top-4 z-60 -translate-x-1/2 rounded-md px-4 py-2 text-xs font-medium shadow-lg sm:text-sm ${
            toast.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-rose-600 text-white"
          }`}
          onClick={() => setToast(null)}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}
