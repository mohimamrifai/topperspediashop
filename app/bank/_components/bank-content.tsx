"use client";

import { useState } from "react";
import { Landmark, MoreVertical, Pencil, Plus, Star, Trash2 } from "lucide-react";

import {
  type BankAccountState,
} from "@/lib/actions/bank-accounts";
import startPrimary from "./start-primary";
import BankFormModal from "./bank-form-modal";
import DeleteConfirm from "./delete-confirm";

export const inputClass =
  "w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm";

export const labelClass = "text-xs font-semibold text-zinc-900 sm:text-sm";

export type Bank = {
  id: number;
  bankName: string;
  accountName: string;
  accountNumber: string;
  backupPhone: string | null;
  isPrimary: boolean;
};

export const initialState: BankAccountState = {};

export function BankContent({ banks: initialBanks }: { banks: Bank[] }) {
  const [menuId, setMenuId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editing, setEditing] = useState<Bank | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200/60">
        {initialBanks.length === 0 ? (
          <div className="px-4 py-3.5 text-xs text-zinc-700 sm:px-5 sm:py-4 sm:text-sm">
            Belum ada informasi penarikan.
          </div>
        ) : (
          <ul className="divide-y divide-zinc-200">
            {initialBanks.map((b, idx) => (
              <li
                key={b.id}
                className={`flex items-center gap-3 px-4 py-3.5 sm:px-5 sm:py-4 ${
                  idx === 0 ? "rounded-t-2xl" : ""
                }${idx === initialBanks.length - 1 ? " rounded-b-2xl" : ""}`}
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 sm:size-11">
                  <Landmark className="size-4 sm:size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-semibold text-zinc-900 sm:text-base">
                      {b.bankName} - {b.accountNumber}
                    </p>
                    {b.isPrimary && (
                      <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                        <Star className="size-2.5 fill-current" />
                        Utama
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-zinc-500 sm:text-xs">
                    a.n {b.accountName}
                  </p>
                </div>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setMenuId((cur) => (cur === b.id ? null : b.id))
                    }
                    aria-label="Menu rekening"
                    className="rounded-md p-1.5 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
                  >
                    <MoreVertical className="size-4" />
                  </button>
                  {menuId === b.id && (
                    <div
                      className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-md border border-zinc-200 bg-white shadow-lg"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setMenuId(null);
                          setEditing(b);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-zinc-700 transition hover:bg-zinc-50 sm:text-sm"
                      >
                        <Pencil className="size-3.5" />
                        Edit
                      </button>
                      {!b.isPrimary && (
                        <button
                          type="button"
                          onClick={() => {
                            setMenuId(null);
                            const fd = new FormData();
                            fd.set("id", String(b.id));
                            startPrimary(fd);
                          }}
                          className="flex w-full items-center gap-2 border-t border-zinc-100 px-3 py-2 text-left text-xs text-zinc-700 transition hover:bg-zinc-50 sm:text-sm"
                        >
                          <Star className="size-3.5" />
                          Jadikan Utama
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setMenuId(null);
                          setDeleteId(b.id);
                        }}
                        className="flex w-full items-center gap-2 border-t border-zinc-100 px-3 py-2 text-left text-xs text-rose-600 transition hover:bg-rose-50 sm:text-sm"
                      >
                        <Trash2 className="size-3.5" />
                        Hapus
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="button"
        onClick={() => setAdding(true)}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 active:bg-emerald-800 sm:py-3 sm:text-sm"
      >
        <Plus className="size-4" />
        Menambahkan
      </button>

      {adding && (
        <BankFormModal
          mode="create"
          onClose={() => setAdding(false)}
        />
      )}

      {editing && (
        <BankFormModal
          mode="edit"
          initial={editing}
          onClose={() => setEditing(null)}
        />
      )}

      {deleteId !== null && (
        <DeleteConfirm
          id={deleteId}
          onCancel={() => setDeleteId(null)}
          onDeleted={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}