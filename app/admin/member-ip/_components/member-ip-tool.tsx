"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Globe, Pencil, Search } from "lucide-react";

import { RefreshButton } from "@/app/_components/refresh-button";
import { EditMemberModal } from "@/app/admin/users/_components/edit-member-modal";
import { MemberReferrerInfoButton } from "@/app/admin/users/_components/member-referrer-info-button";
import type { Member, MemberLevel } from "@/app/admin/users/_components/members-table";
import type { DuplicateIpGroup, MemberIpRow } from "@/lib/member-ip";

import {
  BulkLockDuplicateButton,
  QuickWithdrawLockButton,
} from "./member-ip-actions";

const inputClass =
  "w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:text-sm";

const headerCellClass =
  "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-600 sm:px-4 sm:py-3 sm:text-xs";

const aksiHeaderClass =
  "sticky right-0 border-l border-zinc-200 bg-zinc-50 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-600 sm:static sm:border-l-0 sm:px-4 sm:py-3 sm:text-xs";

const cellClass =
  "px-3 py-2 text-xs text-zinc-700 sm:px-4 sm:py-3 sm:text-sm";

const aksiCellClass =
  "sticky right-0 border-l border-zinc-200 bg-white px-3 py-2 text-xs sm:static sm:border-l-0 sm:bg-transparent sm:px-4 sm:py-3 sm:text-sm";

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function toMember(row: MemberIpRow): Member {
  return {
    id: row.id,
    username: row.username,
    phone: row.phone,
    level: row.level as MemberLevel,
    creditScore: row.creditScore,
    balance: row.balance,
    frozenBalance: row.frozenBalance,
    status: row.status,
    lastSeenIp: row.lastSeenIp,
    registrationIp: row.registrationIp,
    createdAt: row.createdAt,
  };
}

function StatusBadge({ status }: { status: string }) {
  const isLocked = status === "banned";
  return (
    <span
      className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide sm:text-[11px] ${
        isLocked
          ? "bg-rose-100 text-rose-700"
          : status === "online"
            ? "bg-emerald-100 text-emerald-700"
            : "bg-zinc-100 text-zinc-700"
      }`}
    >
      {isLocked ? "Penarikan Dikunci" : status === "online" ? "Aktif" : status}
    </span>
  );
}

function MemberIpTable({
  rows,
  isSuperAdmin,
  onManage,
}: {
  rows: MemberIpRow[];
  isSuperAdmin: boolean;
  onManage: (member: Member) => void;
}) {
  if (rows.length === 0) {
    return (
      <p className="px-3 py-4 text-xs text-zinc-500 sm:text-sm">
        Tidak ada member dengan IP ini.
      </p>
    );
  }

  return (
    <table className="w-full min-w-[900px] border-collapse">
      <thead className="bg-zinc-50">
        <tr>
          <th className={headerCellClass}>Username</th>
          <th className={headerCellClass}>IP Registrasi</th>
          <th className={headerCellClass}>IP Login Terakhir</th>
          <th className={headerCellClass}>Status</th>
          <th className={headerCellClass}>Terdaftar</th>
          <th className={aksiHeaderClass}>Aksi</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((m) => (
          <tr key={m.id} className="group border-t border-zinc-200">
            <td className={`${cellClass} font-medium text-zinc-900`}>
              @{m.username}
            </td>
            <td className={`${cellClass} font-mono text-[11px]`}>
              {m.registrationIp ?? "—"}
            </td>
            <td className={`${cellClass} font-mono text-[11px]`}>
              {m.lastSeenIp ?? "—"}
            </td>
            <td className={cellClass}>
              <StatusBadge status={m.status} />
            </td>
            <td className={cellClass}>{formatDate(m.createdAt)}</td>
            <td className={aksiCellClass}>
              <div className="flex flex-wrap items-center justify-end gap-1.5">
                {isSuperAdmin && (
                  <MemberReferrerInfoButton
                    memberUsername={m.username}
                    referrer={m.referrer ?? null}
                  />
                )}
                <button
                  type="button"
                  onClick={() => onManage(toMember(m))}
                  className="inline-flex items-center justify-center gap-1 rounded-md bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-700 transition hover:bg-sky-200"
                >
                  <Pencil className="size-3" />
                  Kelola
                </button>
                <QuickWithdrawLockButton
                  memberId={m.id}
                  username={m.username}
                  isLocked={m.status === "banned"}
                />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function MemberIpTool({
  duplicateGroups,
  searchResults,
  initialQuery,
  isSuperAdmin = false,
}: {
  duplicateGroups: DuplicateIpGroup[];
  searchResults: MemberIpRow[];
  initialQuery: string;
  isSuperAdmin?: boolean;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [editing, setEditing] = useState<Member | null>(null);

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return duplicateGroups;
    return duplicateGroups.filter((g) => g.ip.toLowerCase().includes(q));
  }, [duplicateGroups, query]);

  const totalDuplicateMembers = duplicateGroups.reduce(
    (sum, g) => sum + g.memberCount,
    0,
  );

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/60 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Globe className="size-5 text-indigo-600" />
              <h1 className="text-base font-bold text-zinc-900 sm:text-lg">
                Cek IP Member
              </h1>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-zinc-600 sm:text-xs">
              Deteksi akun duplikat berdasarkan IP registrasi. Gunakan aksi
              Kelola atau Kunci Penarikan untuk menindaklanjuti kasus duplikat.
            </p>
          </div>
          <RefreshButton label="Refresh" />
        </div>

        {duplicateGroups.length > 0 && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900 sm:text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>
              Ditemukan{" "}
              <strong>{duplicateGroups.length}</strong> IP duplikat mencakup{" "}
              <strong>{totalDuplicateMembers}</strong> akun member.
            </span>
          </div>
        )}
      </div>

      <form
        className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-zinc-200/60 sm:p-4"
        action="/admin/member-ip"
        method="get"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="flex flex-1 flex-col gap-1">
            <span className="text-[11px] font-medium text-zinc-500 sm:text-xs">
              Cari berdasarkan IP
            </span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                name="ip"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Contoh: 192.168.1.10"
                className={`${inputClass} pl-8`}
              />
            </div>
          </label>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 sm:text-sm"
          >
            Cari
          </button>
          {initialQuery && (
            <Link
              href="/admin/member-ip"
              className="inline-flex items-center justify-center rounded-md border border-zinc-200 bg-white px-4 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 sm:text-sm"
            >
              Reset
            </Link>
          )}
        </div>
      </form>

      {initialQuery && (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-zinc-200/60">
          <div className="border-b border-zinc-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-zinc-900">
              Hasil pencarian: <span className="font-mono">{initialQuery}</span>
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              {searchResults.length} member ditemukan
            </p>
          </div>
          <MemberIpTable
            rows={searchResults}
            isSuperAdmin={isSuperAdmin}
            onManage={setEditing}
          />
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-900">
          IP Registrasi Duplikat
        </h2>

        {filteredGroups.length === 0 ? (
          <div className="rounded-xl bg-white px-4 py-8 text-center text-xs text-zinc-500 shadow-sm ring-1 ring-zinc-200/60 sm:text-sm">
            {duplicateGroups.length === 0
              ? "Belum ada IP registrasi yang dipakai lebih dari satu akun."
              : "Tidak ada IP duplikat yang cocok dengan filter."}
          </div>
        ) : (
          filteredGroups.map((group) => {
            const sorted = [...group.members].sort(
              (a, b) =>
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
            );
            const duplicateIds = sorted
              .slice(1)
              .filter((m) => m.status !== "banned")
              .map((m) => m.id);

            return (
              <div
                key={group.ip}
                className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-rose-200/80"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rose-100 bg-rose-50 px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <AlertTriangle className="size-4 text-rose-600" />
                    <span className="font-mono text-sm font-semibold text-rose-800">
                      {group.ip}
                    </span>
                    <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700 sm:text-xs">
                      {group.memberCount} akun
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/member-ip?ip=${encodeURIComponent(group.ip)}`}
                      className="inline-flex items-center justify-center rounded-md border border-rose-200 bg-white px-3 py-1.5 text-[11px] font-medium text-rose-800 transition hover:bg-rose-50 sm:text-xs"
                    >
                      Lihat IP
                    </Link>
                    <BulkLockDuplicateButton
                      memberIds={duplicateIds}
                      label={`Kunci ${duplicateIds.length} Duplikat`}
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <MemberIpTable
                    rows={sorted}
                    isSuperAdmin={isSuperAdmin}
                    onManage={setEditing}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {editing && (
        <EditMemberModal
          member={editing}
          onClose={() => setEditing(null)}
          onSaved={(member) => setEditing(member)}
        />
      )}
    </div>
  );
}
