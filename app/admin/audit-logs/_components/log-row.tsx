import AuditLog from "./audit-log";
import { formatRupiah } from "@/lib/format-rupiah";
import ACTION_BADGES from "./action-badges";
import ROLE_LABELS from "./role-labels";
import formatDate from "./format-date";
import { ChevronDown, ChevronRight } from "lucide-react";


const cellClass =
  "px-3 py-2 text-xs text-zinc-700 sm:px-4 sm:py-3 sm:text-sm";

function safeJsonParse(s: string | null): Record<string, unknown> | null {
  if (!s) return null;
  try {
    const v = JSON.parse(s);
    if (v && typeof v === "object" && !Array.isArray(v)) return v as Record<string, unknown>;
    return null;
  } catch {
    return null;
  }
}

export default function LogRow({
  log,
  actionLabels,
  expanded,
  onToggle,
}: {
  log: AuditLog;
  actionLabels: Record<string, string>;
  expanded: boolean;
  onToggle: () => void;
}) {
  const meta = safeJsonParse(log.metadata);
  const badgeClass = ACTION_BADGES[log.action] ?? "bg-zinc-200 text-zinc-700";
  const actionLabel = actionLabels[log.action] ?? log.action;
  const amountText = formatRupiah(log.amount ?? 0);

  return (
    <>
      <tr
        className="group cursor-pointer border-t border-zinc-200 transition hover:bg-zinc-50/60"
        onClick={onToggle}
      >
        <td className={`${cellClass} text-zinc-400`}>
          {meta ? (
            expanded ? (
              <ChevronDown className="size-3.5" />
            ) : (
              <ChevronRight className="size-3.5" />
            )
          ) : null}
        </td>
        <td className={`${cellClass} font-mono text-[11px] text-zinc-600 sm:text-xs`}>
          {formatDate(log.createdAt)}
        </td>
        <td className={cellClass}>
          <span
            className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold sm:text-xs ${badgeClass}`}
          >
            {actionLabel}
          </span>
        </td>
        <td className={cellClass}>
          <div className="flex flex-col">
            <span className="font-medium text-zinc-900">
              {log.actorUsername ?? "(dihapus)"}
            </span>
            <span className="text-[10px] text-zinc-500 sm:text-[11px]">
              {log.actorRole ? ROLE_LABELS[log.actorRole] ?? log.actorRole : "—"}
            </span>
          </div>
        </td>
        <td className={cellClass}>
          <div className="flex flex-col">
            <span className="font-medium text-zinc-900">
              {log.targetUsername ?? "(dihapus)"}
            </span>
            <span className="text-[10px] text-zinc-500 sm:text-[11px]">
              {log.targetRole ? ROLE_LABELS[log.targetRole] ?? log.targetRole : "—"}
            </span>
          </div>
        </td>
        <td className={`${cellClass} font-mono`}>
          {amountText ?? <span className="text-zinc-400">—</span>}
        </td>
        <td className={cellClass}>
          <span className="line-clamp-2 text-zinc-600">{log.note ?? "—"}</span>
        </td>
      </tr>
      {expanded && meta && (
        <tr className="border-t border-zinc-200 bg-zinc-50/50">
          <td colSpan={7} className="px-3 py-2 sm:px-4 sm:py-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 sm:text-xs">
              Metadata
            </div>
            <pre className="mt-1 overflow-x-auto rounded-md bg-zinc-900 px-3 py-2 text-[11px] text-zinc-100 sm:text-xs">
              {JSON.stringify(meta, null, 2)}
            </pre>
          </td>
        </tr>
      )}
    </>
  );
}