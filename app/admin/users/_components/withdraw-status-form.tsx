import { AlertTriangle, Loader2, Lock, Unlock } from "lucide-react";
import { FieldError, initialState, inputClass, primaryBtn, secondaryBtn } from "./edit-member-modal";
import StatusMessage from "./status-message";
import { useActionState, useEffect, useState, useTransition } from "react";
import { Member } from "./members-table";
import { setMemberWithdrawLock } from "@/lib/actions/member-tools";

export default function WithdrawStatusForm({
  member,
  onSaved,
}: {
  member: Member;
  onSaved: (m: Member) => void;
}) {
  const [state, action] = useActionState(setMemberWithdrawLock, initialState);
  const [pending, startTransition] = useTransition();
  const initialLocked = member.status === "banned";
  const [locked, setLocked] = useState(initialLocked);
  const [reason, setReason] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (state.success) {
      onSaved({ ...member });
      // Reset state lokal dipicu oleh transisi state.success dari server action
      // (bukan derivasi dari state lain), jadi dipanggil di useEffect adalah pola
      // yang benar. Disable rule `react-hooks/set-state-in-effect` untuk baris ini.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReason("");
      setConfirmOpen(false);
    }
  }, [state.success, member, onSaved]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (locked && !confirmOpen) {
      setConfirmOpen(true);
      return;
    }
    const fd = new FormData();
    fd.set("memberId", member.id);
    fd.set("lock", locked ? "true" : "false");
    if (locked) fd.set("reason", reason.trim());
    startTransition(() => action(fd));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center justify-between rounded-md bg-zinc-50 px-3 py-2 text-[11px] sm:text-xs">
        <span className="text-zinc-600">Status saat ini</span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold sm:text-xs ${
            initialLocked
              ? "bg-rose-100 text-rose-700"
              : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {initialLocked ? "Diblokir" : "Aktif"}
        </span>
      </div>

      <label className="flex cursor-pointer items-start gap-2 rounded-md border border-zinc-200 bg-white p-3 transition hover:bg-zinc-50">
        <input
          type="checkbox"
          checked={locked}
          onChange={(e) => setLocked(e.target.checked)}
          disabled={pending}
          className="mt-0.5 size-4 rounded border-zinc-300 text-rose-600 focus:ring-2 focus:ring-rose-500/20"
        />
        <div className="flex-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900 sm:text-sm">
            {locked ? (
              <Lock className="size-3.5 text-rose-600" />
            ) : (
              <Unlock className="size-3.5 text-emerald-600" />
            )}
            Kunci penarikan anggota
          </div>
          <p className="mt-0.5 text-[11px] text-zinc-500 sm:text-xs">
            Centang untuk melarang anggota melakukan transaksi penarikan saldo.
          </p>
        </div>
      </label>

      {locked && (
        <div>
          <label className="mb-1 block text-[11px] font-medium text-zinc-700 sm:text-xs">
            Alasan Penguncian <span className="text-rose-600">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            required
            minLength={3}
            maxLength={500}
            disabled={pending}
            className={inputClass}
            placeholder="cth: Aktivitas mencurigakan, pelanggaran aturan, dsb."
          />
          <FieldError errs={state.fieldErrors?.reason} />
          <p className="mt-1 text-[10px] text-zinc-500 sm:text-[11px]">
            Alasan akan dicatat di log audit untuk dokumentasi.
          </p>
        </div>
      )}

      <StatusMessage state={state} />

      <div className="flex justify-end">
        <button type="submit" disabled={pending} className={primaryBtn}>
          {pending && <Loader2 className="size-3 animate-spin" />}
          {locked ? "Konfirmasi Blokir" : "Buka Penarikan"}
        </button>
      </div>

      {confirmOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Konfirmasi blokir"
          className="fixed inset-0 z-60 flex items-center justify-center bg-zinc-900/50 p-3 sm:p-4"
          onClick={() => !pending && setConfirmOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                <AlertTriangle className="size-5" strokeWidth={1.8} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 sm:text-base">
                  Konfirmasi Blokir Penarikan
                </h3>
                <p className="mt-1 text-[11px] text-zinc-600 sm:text-xs">
                  Anda akan memblokir penarikan saldo untuk anggota
                  <span className="font-semibold text-zinc-900"> @{member.username}</span>.
                  Tindakan ini akan dicatat di log audit.
                </p>
              </div>
            </div>
            {reason.trim() && (
              <div className="mb-3 rounded-md bg-zinc-50 px-3 py-2 text-[11px] sm:text-xs">
                <span className="block text-zinc-500">Alasan:</span>
                <p className="mt-0.5 text-zinc-900">{reason.trim()}</p>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={pending}
                className={secondaryBtn}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  const fd = new FormData();
                  fd.set("memberId", member.id);
                  fd.set("lock", "true");
                  fd.set("reason", reason.trim());
                  startTransition(() => action(fd));
                }}
                disabled={pending || reason.trim().length < 3}
                className="inline-flex items-center justify-center gap-1.5 rounded-md bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50 sm:text-sm"
              >
                {pending && <Loader2 className="size-3 animate-spin" />}
                Ya, Blokir
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
