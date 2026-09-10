import { Check, X } from "lucide-react";
import ReviewModal from "./review-modal";
import { aksiCellClass, cellClass, formatDate, statusLabels, statusStyles, Withdraw } from "./withdraws-table";
import { formatRupiah } from "@/lib/format-rupiah";
import { useState } from "react";

export default function Row({
  withdraw,
  onUpdated,
}: {
  withdraw: Withdraw;
  onUpdated: (w: Withdraw) => void;
}) {
  const [reviewing, setReviewing] = useState<"complete" | "reject" | null>(null);

  return (
    <tr className="group border-t border-zinc-200 transition hover:bg-zinc-50/60">
      <td className={`${cellClass} font-medium text-zinc-900`}>
        {withdraw.memberUsername}
      </td>
      <td className={cellClass}>{withdraw.bankName}</td>
      <td className={cellClass}>{withdraw.accountName}</td>
      <td className={`${cellClass} font-mono tabular-nums`}>
        {withdraw.accountNumber}
      </td>
      <td className={cellClass}>{formatRupiah(withdraw.amount)}</td>
      <td className={cellClass}>{formatDate(withdraw.createdAt)}</td>
      <td className={cellClass}>
        <span
          className={`inline-block rounded-md px-2 py-0.5 text-xs font-semibold ${statusStyles[withdraw.status]}`}
        >
          {statusLabels[withdraw.status]}
        </span>
        {withdraw.notes && (
          <p className="mt-1 text-[10px] text-zinc-500 sm:text-xs">
            {withdraw.notes}
          </p>
        )}
      </td>
      <td className={aksiCellClass}>
        {withdraw.status === "pending" ? (
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => setReviewing("complete")}
              className="inline-flex items-center justify-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-emerald-700"
            >
              <Check className="size-3" />
              Selesai
            </button>
            <button
              type="button"
              onClick={() => setReviewing("reject")}
              className="inline-flex items-center justify-center gap-1 rounded-md bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-rose-700"
            >
              <X className="size-3" />
              Tolak
            </button>
          </div>
        ) : (
          <span className="text-xs text-zinc-400">—</span>
        )}
      </td>

      {reviewing && (
        <ReviewModal
          withdraw={withdraw}
          action={reviewing}
          onClose={() => setReviewing(null)}
          onSuccess={(updated) => {
            onUpdated(updated);
            setReviewing(null);
          }}
        />
      )}
    </tr>
  );
}