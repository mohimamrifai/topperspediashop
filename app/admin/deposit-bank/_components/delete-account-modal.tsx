import { Loader2, Trash2 } from "lucide-react";
import { Account, initialState, useModalLifecycle } from "./deposit-bank-table";
import { useActionState, useEffect, useTransition } from "react";
import { deleteDepositBankAccount } from "@/lib/actions/deposit-bank-accounts";

export default function DeleteAccountModal({
  account,
  onClose,
  onDeleted,
}: {
  account: Account;
  onClose: () => void;
  onDeleted: (msg: string) => void;
}) {
  const [state, action] = useActionState(deleteDepositBankAccount, initialState);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (state === initialState) return;
    if (state.success) onDeleted("Rekening dihapus.");
  }, [state, onDeleted]);

  useModalLifecycle(onClose);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Hapus rekening"
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-sm font-bold text-rose-700 sm:text-base">
          Hapus Rekening?
        </h2>
        <p className="mt-2 text-xs text-zinc-700 sm:text-sm">
          Anda akan menghapus rekening{" "}
          <strong>
            {account.bankName} - {account.accountNumber}
          </strong>{" "}
          a.n {account.accountName}.
        </p>

        <form
          action={(fd) => startTransition(() => action(fd))}
          className="mt-4"
        >
          <input type="hidden" name="accountId" value={account.id} />

          {state.error && (
            <p className="mb-3 rounded-md bg-rose-50 px-3 py-2 text-[11px] text-rose-700 sm:text-xs">
              {state.error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="rounded-md bg-zinc-100 px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-200 disabled:opacity-50 sm:text-sm"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50 sm:text-sm"
            >
              {pending && <Loader2 className="size-3 animate-spin" />}
              <Trash2 className="size-3" />
              Hapus
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}