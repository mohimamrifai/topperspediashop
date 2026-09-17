"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import type { MemberReferrerInfo } from "@/lib/member-referrer";

import { EditMemberModal } from "./edit-member-modal";
import { MemberRow } from "./member-row";

export type MemberLevel =
  | "classic"
  | "silver"
  | "gold"
  | "platinum"
  | "diamond"
  | "premier";

export type Member = {
  id: string;
  username: string;
  phone: string | null;
  level: MemberLevel;
  creditScore: number;
  balance: string;
  frozenBalance: string;
  status: string;
  lastSeenIp: string | null;
  registrationIp: string | null;
  createdAt: string;
  referrer?: MemberReferrerInfo | null;
};

const headerCellClass =
  "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-600 sm:px-4 sm:py-3 sm:text-xs";

const aksiHeaderClass =
  "sticky right-0 border-l border-zinc-200 bg-zinc-100 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-600 sm:static sm:border-l-0 sm:px-4 sm:py-3 sm:text-xs";

const searchInputClass =
  "w-full rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:text-sm";

export function MembersTable({
  initialMembers,
  isSuperAdmin = false,
}: {
  initialMembers: Member[];
  isSuperAdmin?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Member | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return initialMembers;
    return initialMembers.filter(
      (m) =>
        m.username.toLowerCase().includes(q) ||
        (m.phone?.toLowerCase().includes(q) ?? false),
    );
  }, [initialMembers, query]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Cari username / no. HP..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`${searchInputClass} pl-8`}
          />
        </div>
        <span className="text-xs text-zinc-500 sm:ml-auto sm:text-sm">
          {filtered.length} dari {initialMembers.length} member
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-zinc-200/60">
        <table className="w-full min-w-[860px] border-collapse">
          <thead className="bg-zinc-100">
            <tr>
              <th className={headerCellClass}>Username</th>
              <th className={headerCellClass}>No. HP</th>
              <th className={headerCellClass}>Level</th>
              <th className={headerCellClass}>Skor Kredit</th>
              <th className={headerCellClass}>Saldo</th>
              <th className={headerCellClass}>Saldo Beku</th>
              <th className={headerCellClass}>Status</th>
              <th className={headerCellClass}>Terdaftar</th>
              <th className={aksiHeaderClass}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-3 py-6 text-center text-xs text-zinc-500 sm:text-sm"
                >
                  {initialMembers.length === 0
                    ? "Belum ada member terdaftar."
                    : "Tidak ada member yang cocok."}
                </td>
              </tr>
            ) : (
              filtered.map((m) => (
                <MemberRow
                  key={m.id}
                  member={m}
                  isSuperAdmin={isSuperAdmin}
                  onEdit={() => setEditing(m)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <EditMemberModal
          member={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
