import { OTHER_REASON, WITHDRAWAL_REJECTION_REASONS } from "@/lib/constants/withdrawal";
import { formatRupiah } from "@/lib/format-rupiah";
import { Check, X } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { initialReview, Withdraw } from "./withdraws-table";
import { reviewWithdrawal } from "@/lib/actions/withdrawals-admin";

export default function ReviewModal({
  withdraw,
  action,
  onClose,
  onSuccess,
}: {
  withdraw: Withdraw;
  action: "complete" | "reject";
  onClose: () => void;
  onSuccess: (updated: Withdraw) => void;
}) {
  const [state, formAction, isPending] = useActionState(
    reviewWithdrawal,
    initialReview,
  );
  const [reasonCode, setReasonCode] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Set mounted=true sekali setelah mount untuk handle portal SSR.
    // Pola yang benar untuk inisialisasi berbasis client-only state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Tutup otomatis saat submit sukses + panggil callback ke parent.
  useEffect(() => {
    if (!state.success) return;
    const newNotes =
      action === "reject"
        ? reasonCode === OTHER_REASON
          ? `Alasan: Lainnya`
          : `Alasan: ${reasonCode || "—"}`
        : withdraw.notes;
    onSuccess({
      ...withdraw,
      status: action === "complete" ? "completed" : "rejected",
      notes: newNotes,
    });
  }, [state.success, action, reasonCode, withdraw, onSuccess]);

  const isComplete = action === "complete";
  const isOther = reasonCode === OTHER_REASON;
  const canSubmit = isComplete || (reasonCode && reasonCode.length > 0);
  const submitDisabled = isPending || !canSubmit;

  // Render via portal ke body supaya tidak nested di <tr> (hydration error).
  // SSR aman: render null sampai mount (document.body hanya ada di client).
  if (!mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isComplete ? "Selesaikan penarikan" : "Tolak penarikan"}
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 p-3 sm:p-4"
      onClick={onClose}
    >
      <form
        action={formAction}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl sm:p-5"
      >
        <input type="hidden" name="id" value={withdraw.id} />
        <input type="hidden" name="action" value={action} />
        {isComplete ? null : (
          <input type="hidden" name="reasonCode" value={reasonCode} />
        )}

        <h2
          className={`text-sm font-bold sm:text-base ${isComplete ? "text-emerald-700" : "text-rose-700"}`}
        >
          {isComplete ? "Selesaikan Penarikan" : "Tolak Penarikan"}
        </h2>
        <p className="mt-1 text-xs text-zinc-600 sm:text-sm">
          <span className="font-medium text-zinc-900">
            {withdraw.memberUsername}
          </span>{" "}
          • {withdraw.bankName} {withdraw.accountNumber} •{" "}
          {formatRupiah(withdraw.amount)}
        </p>

        {isComplete ? null : (
          <div className="mt-3 space-y-2">
            <label htmlFor="reasonCode" className="block">
              <span className="mb-1 block text-xs font-semibold text-zinc-900 sm:text-sm">
                Alasan Penolakan <span className="text-rose-600">*</span>
              </span>
              <select
                id="reasonCode"
                value={reasonCode}
                onChange={(e) => setReasonCode(e.target.value)}
                required
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 sm:text-sm"
              >
                <option value="" disabled>
                  Pilih alasan...
                </option>
                {WITHDRAWAL_REJECTION_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
                <option value={OTHER_REASON}>{OTHER_REASON}</option>
              </select>
            </label>

            {isOther && (
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-zinc-900 sm:text-sm">
                  Tulis Alasan <span className="text-rose-600">*</span>
                </span>
                <textarea
                  name="otherReason"
                  rows={3}
                  required
                  placeholder="cth: Rekening dibekukan oleh bank."
                  className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 sm:text-sm"
                />
              </label>
            )}
          </div>
        )}

        {state.fieldErrors?.reasonCode?.[0] && (
          <p className="mt-2 rounded-md bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 sm:text-sm">
            {state.fieldErrors.reasonCode[0]}
          </p>
        )}
        {state.fieldErrors?.otherReason?.[0] && (
          <p className="mt-2 rounded-md bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 sm:text-sm">
            {state.fieldErrors.otherReason[0]}
          </p>
        )}
        {state.error && (
          <p className="mt-2 rounded-md bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 sm:text-sm">
            {state.error}
          </p>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-zinc-100 px-4 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-200 sm:text-sm"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitDisabled}
            className={`inline-flex items-center justify-center gap-1.5 rounded-md px-4 py-2 text-xs font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm ${
              isComplete
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-rose-600 hover:bg-rose-700"
            }`}
          >
            {isComplete ? <Check className="size-3.5" /> : <X className="size-3.5" />}
            {isPending ? "Memproses..." : isComplete ? "Selesaikan" : "Tolak"}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
}
