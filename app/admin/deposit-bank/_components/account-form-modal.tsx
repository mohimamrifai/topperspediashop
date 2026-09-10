import { Loader2, X } from "lucide-react";
import { Account, initialState, inputClass, useModalLifecycle } from "./deposit-bank-table";
import { useActionState, useEffect, useTransition } from "react";
import { addDepositBankAccount, updateDepositBankAccount } from "@/lib/actions/deposit-bank-accounts";

type Props = {
  account: Account | null;
  onClose: () => void;
  onSaved: (msg: string) => void;
  actorRole: "super_admin" | "admin_leader" | "admin_staff" | "member";
  leaderOptions: { id: string; username: string }[];
  currentLeaderUsername: string | null;
};

export default function AccountFormModal({
  account,
  onClose,
  onSaved,
  actorRole,
  leaderOptions,
  currentLeaderUsername,
}: Props) {
  const [state, action] = useActionState(
    account ? updateDepositBankAccount : addDepositBankAccount,
    initialState,
  );
  const [pending, startTransition] = useTransition();

  // Tutup otomatis + panggil callback ke parent saat submit sukses.
  useEffect(() => {
    if (state === initialState) return;
    if (state.success) {
      onSaved(account ? "Rekening diperbarui." : "Rekening ditambahkan.");
    }
  }, [state, onSaved, account]);

  useModalLifecycle(onClose);

  const isSuperAdmin = actorRole === "super_admin";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={account ? "Edit rekening" : "Tambah rekening"}
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 p-3 sm:p-4"
      onClick={onClose}
    >
      <form
        action={(fd) => startTransition(() => action(fd))}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl sm:p-6"
      >
        <div className="mb-4 flex items-center justify-between sm:mb-5">
          <h2 className="text-sm font-bold text-zinc-900 sm:text-base">
            {account ? "Edit Rekening" : "Tambah Rekening Tujuan"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="rounded-md p-1 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-3">
          {account && <input type="hidden" name="accountId" value={account.id} />}

          {/* Field Untuk Tim: hanya super admin yang bisa pilih, leader auto. */}
          {isSuperAdmin ? (
            <div>
              <label htmlFor="leaderId" className="mb-1 block text-[11px] font-medium text-zinc-700 sm:text-xs">
                Untuk Tim
              </label>
              <select
                id="leaderId"
                name="leaderId"
                defaultValue={account?.leaderId ?? ""}
                disabled={pending}
                className={inputClass}
              >
                <option value="">Global (untuk semua tim)</option>
                {leaderOptions.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.username}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[10px] text-zinc-500 sm:text-[11px]">
                Pilih leader tertentu, atau kosongkan untuk rekening global.
              </p>
            </div>
          ) : (
            <div className="rounded-md bg-indigo-50 px-3 py-2 text-[11px] text-indigo-800 sm:text-xs">
              <span className="font-semibold">Otomatis untuk tim Anda:</span> @
              {currentLeaderUsername ?? "—"}
            </div>
          )}

          <div>
            <label htmlFor="bankName" className="mb-1 block text-[11px] font-medium text-zinc-700 sm:text-xs">
              Nama Bank
            </label>
            <input
              id="bankName"
              name="bankName"
              type="text"
              required
              maxLength={60}
              defaultValue={account?.bankName ?? ""}
              placeholder="cth: Bank MNC"
              disabled={pending}
              className={inputClass}
            />
            {state.fieldErrors?.bankName?.[0] && (
              <p className="mt-1 text-[11px] text-rose-600 sm:text-xs">
                {state.fieldErrors.bankName[0]}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="accountName" className="mb-1 block text-[11px] font-medium text-zinc-700 sm:text-xs">
              Nama Pemilik
            </label>
            <input
              id="accountName"
              name="accountName"
              type="text"
              required
              maxLength={80}
              defaultValue={account?.accountName ?? ""}
              placeholder="a.n ..."
              disabled={pending}
              className={inputClass}
            />
            {state.fieldErrors?.accountName?.[0] && (
              <p className="mt-1 text-[11px] text-rose-600 sm:text-xs">
                {state.fieldErrors.accountName[0]}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="accountNumber" className="mb-1 block text-[11px] font-medium text-zinc-700 sm:text-xs">
              Nomor Rekening
            </label>
            <input
              id="accountNumber"
              name="accountNumber"
              type="text"
              required
              maxLength={40}
              defaultValue={account?.accountNumber ?? ""}
              placeholder="cth: 1234567890"
              disabled={pending}
              className={`${inputClass} font-mono tracking-wider`}
            />
            {state.fieldErrors?.accountNumber?.[0] && (
              <p className="mt-1 text-[11px] text-rose-600 sm:text-xs">
                {state.fieldErrors.accountNumber[0]}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="notes" className="mb-1 block text-[11px] font-medium text-zinc-700 sm:text-xs">
              Catatan (opsional)
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={2}
              maxLength={200}
              defaultValue={account?.notes ?? ""}
              placeholder="cth: Transfer sebelum jam 3 sore"
              disabled={pending}
              className={inputClass}
            />
          </div>

          {state.error && (
            <p className="rounded-md bg-rose-50 px-3 py-2 text-[11px] text-rose-700 sm:text-xs">
              {state.error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
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
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50 sm:text-sm"
            >
              {pending && <Loader2 className="size-3 animate-spin" />}
              {account ? "Simpan" : "Tambah"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
