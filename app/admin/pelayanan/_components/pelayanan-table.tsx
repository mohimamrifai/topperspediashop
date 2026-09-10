"use client";

import { useMemo, useState, useTransition } from "react";
import { ExternalLink, Pencil, Plus, Send, Trash2 } from "lucide-react";

import { deleteChannel } from "@/lib/actions/channels";

import { ChannelModal, type ChannelInput } from "./channel-modal";

const typeLabel: Record<ChannelInput["type"], string> = {
  whatsapp: "WhatsApp",
  telegram: "Telegram",
};

const typeBadgeClass: Record<ChannelInput["type"], string> = {
  whatsapp: "bg-emerald-100 text-emerald-700",
  telegram: "bg-sky-100 text-sky-700",
};

const headerCellClass =
  "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-600 sm:px-4 sm:py-3 sm:text-xs";

const cellClass =
  "px-3 py-2 text-xs text-zinc-700 group-hover:bg-zinc-50/60 sm:px-4 sm:py-3 sm:text-sm";

const inputClass =
  "w-full rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:text-sm";

function ChannelIcon({ type }: { type: ChannelInput["type"] }) {
  if (type === "whatsapp") {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-100 text-emerald-600 ring-1 ring-emerald-200/60 sm:h-11 sm:w-11">
        <Send className="size-4 sm:size-5" strokeWidth={1.8} />
      </div>
    );
  }
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-sky-100 text-sky-600 ring-1 ring-sky-200/60 sm:h-11 sm:w-11">
      <Send className="size-4 sm:size-5" strokeWidth={1.8} />
    </div>
  );
}

export function PelayananTable({
  initialChannels,
}: {
  initialChannels: ChannelInput[];
}) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<ChannelInput | "new" | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return initialChannels;
    return initialChannels.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.url.toLowerCase().includes(q) ||
        typeLabel[c.type].toLowerCase().includes(q),
    );
  }, [initialChannels, query]);

  function handleSaved() {
    setEditing(null);
  }

  function handleDelete(id: number) {
    if (typeof window !== "undefined") {
      const ok = window.confirm("Hapus channel ini?");
      if (!ok) return;
    }
    const fd = new FormData();
    fd.set("id", String(id));
    startDelete(async () => {
      await deleteChannel({}, fd);
    });
  }

  const [, startDelete] = useTransition();

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="inline-flex items-center justify-center gap-1.5 self-start rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700 active:bg-indigo-800 sm:text-sm"
        >
          <Plus className="size-4" />
          Tambah Channel
        </button>
        <input
          type="text"
          placeholder="Cari channel..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={`${inputClass} sm:w-64`}
        />
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-zinc-200/60">
        <table className="w-full min-w-[640px] border-collapse">
          <thead className="bg-zinc-100">
            <tr>
              <th className={headerCellClass}>No</th>
              <th className={headerCellClass}>Jenis</th>
              <th className={headerCellClass}>Label</th>
              <th className={headerCellClass}>URL</th>
              <th className={headerCellClass}>Status</th>
              <th className={headerCellClass}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-8 text-center text-xs text-zinc-500 sm:text-sm"
                >
                  {initialChannels.length === 0
                    ? 'Belum ada channel. Klik "Tambah Channel" untuk mulai.'
                    : "Tidak ada channel yang cocok."}
                </td>
              </tr>
            ) : (
              filtered.map((c, i) => (
                <tr
                  key={c.id}
                  className="group border-t border-zinc-200 transition hover:bg-zinc-50/60"
                >
                  <td className={cellClass}>{i + 1}</td>
                  <td className={cellClass}>
                    <div className="flex items-center gap-2">
                      <ChannelIcon type={c.type} />
                      <span
                        className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide sm:text-[11px] ${typeBadgeClass[c.type]}`}
                      >
                        {typeLabel[c.type]}
                      </span>
                    </div>
                  </td>
                  <td className={`${cellClass} font-medium text-zinc-900`}>
                    {c.label}
                  </td>
                  <td className={`${cellClass} max-w-[260px]`}>
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1 break-all text-indigo-600 transition hover:text-indigo-700"
                    >
                      <span className="truncate">{c.url}</span>
                      <ExternalLink className="size-3 shrink-0" />
                    </a>
                  </td>
                  <td className={cellClass}>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold sm:text-xs ${
                        c.isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {c.isActive ? "Aktif" : "Non-aktif"}
                    </span>
                  </td>
                  <td className={cellClass}>
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => setEditing(c)}
                        aria-label={`Edit ${c.label}`}
                        className="inline-flex items-center justify-center gap-1 rounded-md bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-700 transition hover:bg-sky-200"
                      >
                        <Pencil className="size-3" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(c.id)}
                        aria-label={`Hapus ${c.label}`}
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

      {editing !== null && (
        <ChannelModal
          initial={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
