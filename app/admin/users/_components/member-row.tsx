"use client";

import { Pencil, Star } from "lucide-react";

import { formatRupiah } from "@/lib/format-rupiah";

import { MemberReferrerInfoButton } from "./member-referrer-info-button";
import type { Member, MemberLevel } from "./members-table";

const LEVEL_LABEL: Record<MemberLevel, string> = {
  classic: "Classic",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
  diamond: "Diamond",
  premier: "Premier",
};

const LEVEL_CLASS: Record<MemberLevel, string> = {
  classic: "bg-zinc-100 text-zinc-700",
  silver: "bg-slate-200 text-slate-700",
  gold: "bg-amber-100 text-amber-700",
  platinum: "bg-indigo-100 text-indigo-700",
  diamond: "bg-sky-100 text-sky-700",
  premier: "bg-violet-100 text-violet-700",
};

const STATUS_LABEL: Record<string, string> = {
  online: "Aktif",
  offline: "Offline",
  banned: "Diblokir",
};

const STATUS_CLASS: Record<string, string> = {
  online: "bg-emerald-100 text-emerald-700",
  offline: "bg-zinc-100 text-zinc-600",
  banned: "bg-rose-100 text-rose-700",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

const cellClass =
  "px-3 py-2 text-xs text-zinc-700 sm:px-4 sm:py-3 sm:text-sm";

const aksiCellClass =
  "sticky right-0 border-l border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-700 group-hover:bg-zinc-50/60 sm:static sm:border-l-0 sm:bg-transparent sm:group-hover:bg-transparent sm:px-4 sm:py-3 sm:text-sm";

export function MemberRow({
  member,
  isSuperAdmin = false,
  onEdit,
}: {
  member: Member;
  isSuperAdmin?: boolean;
  onEdit: () => void;
}) {
  return (
    <tr className="group border-t border-zinc-200 transition hover:bg-zinc-50/60">
      <td className={`${cellClass} font-medium text-zinc-900`}>
        {member.username}
      </td>
      <td className={`${cellClass} font-mono tabular-nums`}>
        {member.phone ? (
          <a
            href={`https://wa.me/${member.phone.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-700 underline-offset-2 hover:underline"
          >
            {member.phone}
          </a>
        ) : (
          <span className="text-zinc-400">—</span>
        )}
      </td>
      <td className={cellClass}>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold sm:text-xs ${LEVEL_CLASS[member.level]}`}
        >
          {member.level === "diamond" || member.level === "premier" ? (
            <Star className="size-2.5 fill-current" />
          ) : null}
          {LEVEL_LABEL[member.level]}
        </span>
      </td>
      <td className={cellClass}>{member.creditScore}</td>
      <td className={`${cellClass} font-medium text-emerald-700`}>
        {formatRupiah(member.balance)}
      </td>
      <td className={cellClass}>
        {Number(member.frozenBalance) > 0
          ? formatRupiah(member.frozenBalance)
          : "—"}
      </td>
      <td className={cellClass}>
        <span
          className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold sm:text-xs ${
            STATUS_CLASS[member.status] ?? "bg-zinc-100 text-zinc-600"
          }`}
        >
          {STATUS_LABEL[member.status] ?? member.status}
        </span>
      </td>
      <td className={`${cellClass} whitespace-nowrap`}>
        {formatDate(member.createdAt)}
      </td>
      <td className={`${aksiCellClass} whitespace-nowrap`}>
        <div className="flex items-center justify-end gap-1.5">
          {isSuperAdmin && (
            <MemberReferrerInfoButton
              memberUsername={member.username}
              referrer={member.referrer ?? null}
            />
          )}
          <button
            type="button"
            aria-label={`Edit ${member.username}`}
            onClick={onEdit}
            className="inline-flex items-center justify-center gap-1 rounded-md bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-700 transition hover:bg-sky-200"
          >
            <Pencil className="size-3" />
            Tools
          </button>
        </div>
      </td>
    </tr>
  );
}
