"use client";

import { useMemo, useState } from "react";
import {
  KeyRound,
  Link2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import {
  type AdminUserState,
} from "@/lib/actions/admin-users";
import RoleBadge from "./role-badge";
import CreateAdminModal from "./create-admin-modal";
import EditAdminModal from "./edit-admin-modal";
import ResetPasswordModal from "./reset-password-modal";
import DeleteAdminModal from "./delete-admin-modal";
import SetLeaderModal from "./set-leader-modal";

export type AdminRole = "admin_leader" | "admin_staff";

export type Admin = {
  id: string;
  username: string;
  role: AdminRole;
  referralCode: string | null;
  status: string;
  createdAt: string;
  memberCount: number;
  leaderId: string | null;
  leaderUsername: string | null;
};

export type LeaderOption = { id: string; username: string };
export const initialState: AdminUserState = {};

export const inputClass =
  "w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:text-sm";

const headerCellClass =
  "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-600 sm:px-4 sm:py-3 sm:text-xs";

const cellClass =
  "px-3 py-2 text-xs text-zinc-700 sm:px-4 sm:py-3 sm:text-sm";


function formatDate(iso: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));
}

export function TeamTable({
  initialAdmins,
  leaders,
  isCurrentSuperAdmin,
  currentLeaderId,
  currentLeaderUsername,
}: {
  initialAdmins: Admin[];
  leaders: LeaderOption[];
  isCurrentSuperAdmin: boolean;
  /** ID admin leader yang sedang login. Untuk membuat staff baru. */
  currentLeaderId: string;
  /** Username leader yang sedang login, default value saat leader klaim orphan. */
  currentLeaderUsername: string;
}) {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin_leader" | "admin_staff">("all");
  const [creating, setCreating] = useState(false);
  /** True setelah admin baru berhasil dibuat, untuk memicu reload hanya saat user menutup modal dari success view (bukan dari batal). */
  const [justCreated, setJustCreated] = useState(false);
  const [editing, setEditing] = useState<Admin | null>(null);
  const [deleting, setDeleting] = useState<Admin | null>(null);
  const [resetting, setResetting] = useState<Admin | null>(null);
  /**
   * Staff yang sedang di-set leader-nya. Dipakai oleh `SetLeaderModal`.
   * Tombol "Set Leader" hanya muncul untuk admin_staff:
   *  - orphan (`leaderId == null`): semua leader & super admin boleh kaitkan
   *  - punya leader (`leaderId != null`): hanya super admin yang boleh ganti
   */
  const [settingLeader, setSettingLeader] = useState<Admin | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return initialAdmins.filter((a) => {
      if (roleFilter !== "all" && a.role !== roleFilter) return false;
      if (!q) return true;
      return (
        a.username.toLowerCase().includes(q) ||
        (a.referralCode?.toLowerCase().includes(q) ?? false) ||
        (a.leaderUsername?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [initialAdmins, query, roleFilter]);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-zinc-200/60 sm:p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Cari username / referral / leader..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={`${inputClass} pl-8`}
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
            className={`${inputClass} sm:w-auto`}
          >
            <option value="all">Semua Role</option>
            <option value="admin_leader">Admin Leader</option>
            <option value="admin_staff">Admin Staff</option>
          </select>
          <span className="text-xs text-zinc-500 sm:ml-auto sm:text-sm">
            {filtered.length} dari {initialAdmins.length} admin
          </span>
          {currentLeaderId && (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 sm:text-sm"
            >
              <Plus className="size-3.5" />
              Tambah Staff
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-zinc-200/60">
        <table className="w-full min-w-[860px] border-collapse">
          <thead className="bg-zinc-100">
            <tr>
              <th className={headerCellClass}>Username</th>
              <th className={headerCellClass}>Role</th>
              <th className={headerCellClass}>Leader</th>
              <th className={headerCellClass}>Referral Code</th>
              <th className={headerCellClass}>Jml. Member</th>
              <th className={headerCellClass}>Status</th>
              <th className={headerCellClass}>Dibuat</th>
              {currentLeaderId && (
                <th className={headerCellClass}>Aksi</th>
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={currentLeaderId ? 8 : 7}
                  className="px-3 py-6 text-center text-xs text-zinc-500 sm:text-sm"
                >
                  {initialAdmins.length === 0
                    ? "Belum ada admin selain Anda."
                    : "Tidak ada admin yang cocok."}
                </td>
              </tr>
            ) : (
              filtered.map((a) => (
                <tr
                  key={a.id}
                  className="border-t border-zinc-200 transition hover:bg-zinc-50/60"
                >
                  <td className={`${cellClass} font-medium text-zinc-900`}>
                    @{a.username}
                  </td>
                  <td className={cellClass}>
                    <RoleBadge role={a.role} />
                  </td>
                  <td className={cellClass}>
                    {a.role === "admin_staff" ? (
                      a.leaderUsername ? (
                        <span>@{a.leaderUsername}</span>
                      ) : (
                        <span className="text-rose-600">(tanpa leader)</span>
                      )
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </td>
                  <td className={`${cellClass} font-mono text-[11px]`}>
                    {a.referralCode ?? "—"}
                  </td>
                  <td className={cellClass}>
                    {a.role === "admin_staff" ? a.memberCount : "—"}
                  </td>
                  <td className={cellClass}>
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide sm:text-[11px] ${
                        a.status === "banned"
                          ? "bg-rose-100 text-rose-700"
                          : a.status === "online"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-zinc-100 text-zinc-700"
                      }`}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td className={cellClass}>{formatDate(a.createdAt)}</td>
                  {currentLeaderId && (
                    <td className={`${cellClass} whitespace-nowrap text-right`}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          aria-label={`Edit @${a.username}`}
                          onClick={() => setEditing(a)}
                          className="inline-flex items-center justify-center gap-1 rounded-md bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-700 transition hover:bg-sky-200"
                        >
                          <Pencil className="size-3" />
                          Edit
                        </button>
                        {a.role === "admin_staff" && (isCurrentSuperAdmin || !a.leaderId) && (
                          <button
                            type="button"
                            aria-label={a.leaderId ? `Ganti leader @${a.username}` : `Kaitkan @${a.username} ke leader`}
                            onClick={() => setSettingLeader(a)}
                            className={`inline-flex items-center justify-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition ${
                              a.leaderId
                                ? "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                                : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                            }`}
                          >
                            <Link2 className="size-3" />
                            {a.leaderId ? "Ganti Leader" : "Set Leader"}
                          </button>
                        )}
                        {a.id !== currentLeaderId && (
                          <button
                            type="button"
                            aria-label={`Reset password @${a.username}`}
                            onClick={() => setResetting(a)}
                            className="inline-flex items-center justify-center gap-1 rounded-md bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 transition hover:bg-amber-200"
                          >
                            <KeyRound className="size-3" />
                            Reset
                          </button>
                        )}
                        <button
                          type="button"
                          aria-label={`Hapus @${a.username}`}
                          onClick={() => setDeleting(a)}
                          className="inline-flex items-center justify-center gap-1 rounded-md bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-700 transition hover:bg-rose-200"
                        >
                          <Trash2 className="size-3" />
                          Hapus
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {creating && (
        <CreateAdminModal
          leaders={leaders}
          canCreateLeader={isCurrentSuperAdmin}
          currentLeaderId={currentLeaderId}
          onClose={() => {
            setCreating(false);
            if (justCreated) {
              setJustCreated(false);
            }
          }}
          onCreated={(result) => {
            setJustCreated(true);
            setToast({
              type: "success",
              text:
                result.message ??
                "Admin berhasil dibuat. Salin passwordnya di modal.",
            });
          }}
        />
      )}

      {editing && (
        <EditAdminModal
          admin={editing}
          canEditRole={isCurrentSuperAdmin}
          onClose={() => setEditing(null)}
          onSaved={(msg) => {
            setEditing(null);
            setToast({ type: "success", text: msg });
          }}
          onResetPassword={(a) => {
            setEditing(null);
            setResetting(a);
          }}
        />
      )}

      {resetting && (
        <ResetPasswordModal
          admin={resetting}
          onClose={() => setResetting(null)}
          onReset={(msg) => {
            setToast({ type: "success", text: msg });
          }}
        />
      )}

      {deleting && (
        <DeleteAdminModal
          admin={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={(msg) => {
            setDeleting(null);
            setToast({ type: "success", text: msg });
          }}
        />
      )}

      {settingLeader && (
        <SetLeaderModal
          staff={settingLeader}
          leaders={leaders}
          isCurrentSuperAdmin={isCurrentSuperAdmin}
          currentLeaderId={currentLeaderId}
          currentLeaderUsername={currentLeaderUsername}
          onClose={() => setSettingLeader(null)}
          onSaved={(msg) => {
            setSettingLeader(null);
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
