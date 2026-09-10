"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import AuditLog from "./audit-log";
import LogRow from "./log-row";

const headerCellClass =
  "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-600 sm:px-4 sm:py-3 sm:text-xs";


const inputClass =
  "w-full rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:text-sm";


export function AuditLogsTable({
  initialLogs,
  actionLabels,
}: {
  initialLogs: AuditLog[];
  actionLabels: Record<string, string>;
}) {
  const [logs] = useState<AuditLog[]>(initialLogs);
  const [query, setQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [actorFilter, setActorFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Unique actors (yang muncul di log)
  const actorOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const l of logs) {
      if (l.actorId && l.actorUsername) {
        map.set(l.actorId, l.actorUsername);
      }
    }
    return Array.from(map.entries()).map(([id, username]) => ({
      id,
      username,
    }));
  }, [logs]);

  // Unique actions (yang muncul di log)
  const actionOptions = useMemo(() => {
    const set = new Set<string>();
    for (const l of logs) set.add(l.action);
    return Array.from(set).sort();
  }, [logs]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return logs.filter((l) => {
      if (actionFilter !== "all" && l.action !== actionFilter) return false;
      if (actorFilter !== "all" && l.actorId !== actorFilter) return false;
      if (!q) return true;
      const haystack = [
        l.action,
        l.note ?? "",
        l.actorUsername ?? "",
        l.targetUsername ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [logs, query, actionFilter, actorFilter]);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-zinc-200/60 sm:p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Cari aksi / note / username..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={`${inputClass} pl-8`}
            />
          </div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className={inputClass}
          >
            <option value="all">Semua Aksi</option>
            {actionOptions.map((a) => (
              <option key={a} value={a}>
                {actionLabels[a] ?? a}
              </option>
            ))}
          </select>
          <select
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value)}
            className={inputClass}
          >
            <option value="all">Semua Actor</option>
            {actorOptions.map((a) => (
              <option key={a.id} value={a.id}>
                @{a.username}
              </option>
            ))}
          </select>
          <span className="text-xs text-zinc-500 sm:ml-auto sm:text-sm">
            {filtered.length} / {logs.length} entri
          </span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-zinc-200/60">
        <table className="w-full min-w-[900px] border-collapse">
          <thead className="bg-zinc-100">
            <tr>
              <th className={`${headerCellClass} w-8`}></th>
              <th className={headerCellClass}>Waktu</th>
              <th className={headerCellClass}>Aksi</th>
              <th className={headerCellClass}>Actor</th>
              <th className={headerCellClass}>Target</th>
              <th className={headerCellClass}>Jumlah</th>
              <th className={headerCellClass}>Catatan</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-6 text-center text-xs text-zinc-500 sm:text-sm"
                >
                  {logs.length === 0
                    ? "Belum ada audit log."
                    : "Tidak ada data yang cocok."}
                </td>
              </tr>
            ) : (
              filtered.map((l) => (
                <LogRow
                  key={l.id}
                  log={l}
                  actionLabels={actionLabels}
                  expanded={expandedId === l.id}
                  onToggle={() =>
                    setExpandedId((cur) => (cur === l.id ? null : l.id))
                  }
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
