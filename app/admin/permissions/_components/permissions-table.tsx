"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Loader2, Save, X } from "lucide-react";

import { setAccessOverrides } from "@/lib/actions/access-overrides";
import type { AccessOverrides } from "@/lib/access";

type Admin = {
  id: string;
  username: string;
  role: string;
  status: string;
  overrides: AccessOverrides;
};

const headerCellClass =
  "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-600 sm:px-4 sm:py-3 sm:text-xs";

const cellClass =
  "px-3 py-2 text-xs text-zinc-700 sm:px-4 sm:py-3 sm:text-sm";

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

const PERMISSION_LABELS: { key: keyof AccessOverrides; label: string; description: string }[] = [
  { key: "fullAccess", label: "Full Access", description: "Lihat semua data seperti Super Admin" },
  { key: "canCreateStaff", label: "Buat Staff", description: "Buat akun Admin Staff" },
  { key: "canCreateLeader", label: "Buat Leader", description: "Buat akun Admin Leader" },
  { key: "commissionEdit", label: "Edit Komisi", description: "Ubah rate komisi staff" },
  { key: "depositBankCrud", label: "CRUD Rekening", description: "Kelola rekening tujuan deposit" },
  { key: "channelCrud", label: "CRUD Pelayanan", description: "Kelola channel pelayanan (CS)" },
];

function EditPermissionsModal({
  admin,
  onClose,
  onSaved,
}: {
  admin: Admin;
  onClose: () => void;
  onSaved: (msg: string, newOverrides: AccessOverrides) => void;
}) {
  const [state, action] = useActionState(setAccessOverrides, {});
  const [pending, startTransition] = useTransition();
  const [overrides, setOverrides] = useState<AccessOverrides>(admin.overrides);

  useEffect(() => {
    // Initial state `{}` tidak punya `success`, otomatis skip.
    // Aman terhadap React StrictMode (double-invoke effect di dev).
    if (!state.success || !state.message) return;
    onSaved(state.message, overrides);
  }, [state, onSaved, overrides]);

  useModalLifecycle(onClose);

  function toggle(key: keyof AccessOverrides) {
    setOverrides((cur) => ({ ...cur, [key]: !cur[key] }));
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Atur izin @${admin.username}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between sm:mb-5">
          <h2 className="text-sm font-bold text-zinc-900 sm:text-base">
            Izin Akses @{admin.username}
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
          <input type="hidden" name="targetId" value={admin.id} />

          <div className="space-y-2">
            {PERMISSION_LABELS.map((p) => (
              <label
                key={p.key}
                className="flex items-start gap-3 rounded-md border border-zinc-200 p-2.5 transition hover:bg-zinc-50 sm:p-3"
              >
                <input
                  type="checkbox"
                  name={p.key}
                  value="on"
                  checked={overrides[p.key] === true}
                  onChange={() => toggle(p.key)}
                  disabled={pending}
                  className="mt-0.5 size-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-zinc-900 sm:text-sm">
                    {p.label}
                  </p>
                  <p className="text-[11px] text-zinc-500 sm:text-xs">
                    {p.description}
                  </p>
                </div>
              </label>
            ))}
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

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin_leader: "Admin Leader",
  admin_staff: "Admin Staff",
};

function countActive(o: AccessOverrides): number {
  return [o.fullAccess, o.canCreateStaff, o.canCreateLeader, o.commissionEdit, o.depositBankCrud, o.channelCrud].filter(
    Boolean,
  ).length;
}

export function PermissionsTable({ initialAdmins }: { initialAdmins: Admin[] }) {
  const [editing, setEditing] = useState<Admin | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-zinc-200/60">
        <table className="w-full min-w-[640px] border-collapse">
          <thead className="bg-zinc-100">
            <tr>
              <th className={headerCellClass}>Admin</th>
              <th className={headerCellClass}>Role</th>
              <th className={headerCellClass}>Izin Aktif</th>
              <th className={headerCellClass}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {initialAdmins.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-xs text-zinc-500 sm:text-sm">
                  Belum ada admin selain Anda.
                </td>
              </tr>
            ) : (
              initialAdmins.map((a) => {
                const active = countActive(a.overrides);
                return (
                  <tr
                    key={a.id}
                    className="border-t border-zinc-200 transition hover:bg-zinc-50/60"
                  >
                    <td className={`${cellClass} font-medium text-zinc-900`}>
                      @{a.username}
                    </td>
                    <td className={cellClass}>
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide sm:text-[11px] ${
                          a.role === "admin_leader"
                            ? "bg-indigo-100 text-indigo-700"
                            : "bg-sky-100 text-sky-700"
                        }`}
                      >
                        {ROLE_LABELS[a.role] ?? a.role}
                      </span>
                    </td>
                    <td className={cellClass}>
                      {active === 0 ? (
                        <span className="text-zinc-400">— (default role)</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {PERMISSION_LABELS.filter((p) => a.overrides[p.key] === true).map(
                            (p) => (
                              <span
                                key={p.key}
                                className="inline-flex items-center rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 sm:text-[11px]"
                              >
                                {p.label}
                              </span>
                            ),
                          )}
                        </div>
                      )}
                    </td>
                    <td className={cellClass}>
                      <button
                        type="button"
                        onClick={() => setEditing(a)}
                        className="inline-flex items-center justify-center gap-1 rounded-md bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-700 transition hover:bg-sky-200"
                      >
                        Atur
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <EditPermissionsModal
          admin={editing}
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
