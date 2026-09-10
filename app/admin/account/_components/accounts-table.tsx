"use client";

import { useMemo, useState } from "react";
import { Landmark, Search } from "lucide-react";

type Role = "super_admin" | "admin_leader" | "admin_staff" | "member";

export type BankAccountRow = {
  id: number;
  userId: string;
  username: string;
  role: Role;
  phone: string | null;
  bankName: string;
  accountName: string;
  accountNumber: string;
  backupPhone: string | null;
  isPrimary: boolean;
  createdAt: string;
};

const ROLE_OPTIONS: { value: Role | "all"; label: string }[] = [
  { value: "all", label: "Semua Role" },
  { value: "member", label: "Member" },
  { value: "admin_staff", label: "Admin Staff" },
  { value: "admin_leader", label: "Admin Leader" },
  { value: "super_admin", label: "Super Admin" },
];

const ROLE_BADGE: Record<Role, string> = {
  super_admin: "bg-rose-100 text-rose-700",
  admin_leader: "bg-amber-100 text-amber-700",
  admin_staff: "bg-sky-100 text-sky-700",
  member: "bg-zinc-100 text-zinc-700",
};

const ROLE_LABEL: Record<Role, string> = {
  super_admin: "Super Admin",
  admin_leader: "Admin Leader",
  admin_staff: "Admin Staff",
  member: "Member",
};

const headerCellClass =
  "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-600 sm:px-4 sm:py-3 sm:text-xs";

const cellClass =
  "px-3 py-2 text-xs text-zinc-700 sm:px-4 sm:py-3 sm:text-sm";

const searchInputClass =
  "w-full rounded-md border border-zinc-200 bg-white pl-8 px-3 py-1.5 text-xs text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:text-sm";

const selectClass =
  "rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:text-sm";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));
}

export function AccountsTable({
  initialAccounts,
}: {
  initialAccounts: BankAccountRow[];
}) {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all");

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return initialAccounts.filter((a) => {
      if (roleFilter !== "all" && a.role !== roleFilter) return false;
      if (!q) return true;
      return (
        a.username.toLowerCase().includes(q) ||
        a.bankName.toLowerCase().includes(q) ||
        a.accountName.toLowerCase().includes(q) ||
        a.accountNumber.toLowerCase().includes(q) ||
        (a.phone ?? "").toLowerCase().includes(q)
      );
    });
  }, [initialAccounts, query, roleFilter]);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-zinc-200/60 sm:p-4">
        <h1 className="text-base font-bold text-zinc-900 sm:text-lg">
          Daftar Rekening
        </h1>
        <p className="mt-1 text-xs text-zinc-600 sm:text-sm">
          Rekening bank yang terdaftar oleh seluruh pengguna.
        </p>
      </div>

      <div className="flex flex-col gap-2 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-zinc-200/60 sm:flex-row sm:items-center sm:p-4">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Cari username / bank / rekening..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={searchInputClass}
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as Role | "all")}
          className={selectClass}
        >
          {ROLE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span className="text-xs text-zinc-500 sm:ml-auto sm:text-sm">
          {filtered.length} dari {initialAccounts.length} rekening
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-zinc-200/60">
        <table className="w-full min-w-[860px] border-collapse">
          <thead className="bg-zinc-100">
            <tr>
              <th className={headerCellClass}>No</th>
              <th className={headerCellClass}>Username</th>
              <th className={headerCellClass}>Role</th>
              <th className={headerCellClass}>Bank</th>
              <th className={headerCellClass}>Nama Rekening</th>
              <th className={headerCellClass}>Nomor Rekening</th>
              <th className={headerCellClass}>Ponsel Cadangan</th>
              <th className={headerCellClass}>Utama</th>
              <th className={headerCellClass}>Terdaftar</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-3 py-8 text-center text-xs text-zinc-500 sm:text-sm"
                >
                  {initialAccounts.length === 0
                    ? "Belum ada rekening terdaftar."
                    : "Tidak ada rekening yang cocok."}
                </td>
              </tr>
            ) : (
              filtered.map((a, i) => (
                <tr
                  key={a.id}
                  className="border-t border-zinc-200 transition hover:bg-zinc-50/60"
                >
                  <td className={cellClass}>{i + 1}</td>
                  <td className={`${cellClass} font-medium text-zinc-900`}>
                    <div className="flex items-center gap-1.5">
                      <Landmark className="size-3.5 text-zinc-400" />
                      {a.username}
                    </div>
                  </td>
                  <td className={cellClass}>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold sm:text-[11px] ${ROLE_BADGE[a.role]}`}
                    >
                      {ROLE_LABEL[a.role]}
                    </span>
                  </td>
                  <td className={cellClass}>{a.bankName}</td>
                  <td className={cellClass}>{a.accountName}</td>
                  <td className={`${cellClass} font-mono tabular-nums`}>
                    {a.accountNumber}
                  </td>
                  <td className={`${cellClass} font-mono tabular-nums`}>
                    {a.backupPhone ?? "—"}
                  </td>
                  <td className={cellClass}>
                    {a.isPrimary ? (
                      <span className="inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 sm:text-[11px]">
                        Utama
                      </span>
                    ) : (
                      <span className="text-[10px] text-zinc-400 sm:text-[11px]">
                        —
                      </span>
                    )}
                  </td>
                  <td className={cellClass}>{formatDate(a.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
