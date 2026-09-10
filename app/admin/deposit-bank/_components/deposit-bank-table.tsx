"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";

import {
  initialDepositAccountState,
} from "@/lib/actions/deposit-bank-accounts-types";
import AccountFormModal from "./account-form-modal";
import DeleteAccountModal from "./delete-account-modal";
import ToggleActiveButton from "./toggle-active-button";

// Re-export agar client component lain (modal/toggle) bisa impor dari satu tempat.
export { initialDepositAccountState as initialState };

export type Account = {
  id: number;
  bankName: string;
  accountName: string;
  accountNumber: string;
  notes: string | null;
  isActive: boolean;
  leaderId: string | null;
  leaderUsername: string | null;
};

export const inputClass =
  "w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:text-sm";

export const headerCellClass =
  "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-600 sm:px-4 sm:py-3 sm:text-xs";

export const cellClass =
  "px-3 py-2 text-xs text-zinc-700 sm:px-4 sm:py-3 sm:text-sm";

export function useModalLifecycle(onClose: () => void) {
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

type Props = {
  initialAccounts: Account[];
  actorRole: "super_admin" | "admin_leader" | "admin_staff" | "member";
  leaderOptions: { id: string; username: string }[];
  currentLeaderUsername: string | null;
};

export function DepositBankTable({
  initialAccounts,
  actorRole,
  leaderOptions,
  currentLeaderUsername,
}: Props) {
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [deleting, setDeleting] = useState<Account | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return initialAccounts;
    return initialAccounts.filter(
      (a) =>
        a.bankName.toLowerCase().includes(q) ||
        a.accountName.toLowerCase().includes(q) ||
        a.accountNumber.includes(q) ||
        (a.leaderUsername ?? "").toLowerCase().includes(q),
    );
  }, [initialAccounts, query]);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-zinc-200/60 sm:p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Cari bank / nomor / pemilik / tim..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={`${inputClass} pl-8`}
            />
          </div>
          <span className="text-xs text-zinc-500 sm:ml-auto sm:text-sm">
            {filtered.length} dari {initialAccounts.length} rekening
          </span>
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 sm:text-sm"
          >
            <Plus className="size-3.5" />
            Tambah Rekening
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-zinc-200/60">
        <table className="w-full min-w-[860px] border-collapse">
          <thead className="bg-zinc-100">
            <tr>
              <th className={headerCellClass}>Bank</th>
              <th className={headerCellClass}>Pemilik</th>
              <th className={headerCellClass}>No. Rekening</th>
              <th className={headerCellClass}>Tim</th>
              <th className={headerCellClass}>Catatan</th>
              <th className={headerCellClass}>Status</th>
              <th className={headerCellClass}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-6 text-center text-xs text-zinc-500 sm:text-sm"
                >
                  {initialAccounts.length === 0
                    ? "Belum ada rekening tujuan. Tambahkan rekening untuk ditampilkan ke member."
                    : "Tidak ada rekening yang cocok."}
                </td>
              </tr>
            ) : (
              filtered.map((a) => (
                <tr
                  key={a.id}
                  className="border-t border-zinc-200 transition hover:bg-zinc-50/60"
                >
                  <td className={`${cellClass} font-medium text-zinc-900`}>
                    {a.bankName}
                  </td>
                  <td className={cellClass}>{a.accountName}</td>
                  <td className={`${cellClass} font-mono tabular-nums`}>
                    {a.accountNumber}
                  </td>
                  <td className={cellClass}>
                    {a.leaderId ? (
                      <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 sm:text-xs">
                        @{a.leaderUsername ?? "—"}
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600 sm:text-xs">
                        Global
                      </span>
                    )}
                  </td>
                  <td className={cellClass}>
                    {a.notes ?? <span className="text-zinc-400">—</span>}
                  </td>
                  <td className={cellClass}>
                    <ToggleActiveButton account={a} />
                  </td>
                  <td className={`${cellClass} whitespace-nowrap text-right`}>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        aria-label={`Edit ${a.bankName}`}
                        onClick={() => setEditing(a)}
                        className="inline-flex items-center justify-center gap-1 rounded-md bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-700 transition hover:bg-sky-200"
                      >
                        <Pencil className="size-3" />
                        Edit
                      </button>
                      <button
                        type="button"
                        aria-label={`Hapus ${a.bankName}`}
                        onClick={() => setDeleting(a)}
                        className="inline-flex items-center justify-center gap-1 rounded-md bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-700 transition hover:bg-rose-200"
                      >
                        <Trash2 className="size-3" />
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {creating && (
        <AccountFormModal
          account={null}
          onClose={() => setCreating(false)}
          onSaved={(msg) => {
            setCreating(false);
            setToast({ type: "success", text: msg });
          }}
          actorRole={actorRole}
          leaderOptions={leaderOptions}
          currentLeaderUsername={currentLeaderUsername}
        />
      )}

      {editing && (
        <AccountFormModal
          account={editing}
          onClose={() => setEditing(null)}
          onSaved={(msg) => {
            setEditing(null);
            setToast({ type: "success", text: msg });
          }}
          actorRole={actorRole}
          leaderOptions={leaderOptions}
          currentLeaderUsername={currentLeaderUsername}
        />
      )}

      {deleting && (
        <DeleteAccountModal
          account={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={(msg) => {
            setDeleting(null);
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
