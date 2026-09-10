import { Eye, EyeOff, KeyRound, Loader2, X } from "lucide-react";
import { Admin, initialState, inputClass } from "./team-table";
import useModalLifecycle from "./use-modal-lifecycle";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { resetAdminPassword } from "@/lib/actions/admin-users";

export default function ResetPasswordModal({
  admin,
  onClose,
  onReset,
}: {
  admin: Admin;
  onClose: () => void;
  onReset: (msg: string) => void;
}) {
  const [state, action] = useActionState(resetAdminPassword, initialState);
  const [pending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  // Simpan callback terbaru di ref agar useEffect tidak retrigger tiap parent re-render
  // (arrow function dari parent bikin reference identity berubah setiap render).
  const onResetRef = useRef(onReset);
  useEffect(() => {
    onResetRef.current = onReset;
  }, [onReset]);

  useEffect(() => {
    if (state === initialState) return;
    if (state.success) onResetRef.current(state.message ?? "Password di-reset.");
  }, [state]);

  useModalLifecycle(onClose);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Reset password @${admin.username}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between sm:mb-5">
          <h2 className="text-sm font-bold text-zinc-900 sm:text-base">
            Reset Password @{admin.username}
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

        {state.success ? (
          <div className="space-y-3">
            <div className="rounded-md bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800 sm:text-xs">
              {state.message}
            </div>
            <p className="rounded-md bg-amber-50 px-3 py-2 text-[11px] text-amber-800 sm:text-xs">
              <strong>Penting:</strong> Berikan password baru ke admin terkait
              melalui channel yang aman. Password tidak akan ditampilkan lagi di
              sistem.
            </p>
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 sm:text-sm"
              >
                Selesai
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-[11px] text-zinc-600 sm:text-xs">
              Masukkan password baru untuk admin{" "}
              <span className="font-semibold text-zinc-900">@{admin.username}</span>.
              Password lama akan diganti dengan yang baru.
            </p>
            <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-[11px] text-amber-800 sm:text-xs">
              <strong>Catatan:</strong> Pastikan untuk membagikan password baru
              ke admin terkait karena tidak akan ditampilkan lagi.
            </p>

            <form
              action={(fd) => startTransition(() => action(fd))}
              className="mt-4 space-y-3"
            >
              <input type="hidden" name="adminId" value={admin.id} />

              <div>
                <label
                  htmlFor="password"
                  className="mb-1 block text-[11px] font-medium text-zinc-700 sm:text-xs"
                >
                  Password Baru <span className="text-rose-600">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    maxLength={72}
                    autoComplete="new-password"
                    placeholder="Minimal 6 karakter"
                    disabled={pending}
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Sembunyikan" : "Tampilkan"}
                    className="rounded-md bg-zinc-100 p-2 text-zinc-600 transition hover:bg-zinc-200"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                {state.fieldErrors?.password ? (
                  <p className="mt-1 rounded-md bg-rose-50 px-3 py-2 text-[11px] text-rose-700 sm:text-xs">
                    {state.fieldErrors.password[0]}
                  </p>
                ) : null}
              </div>

              <div>
                <label
                  htmlFor="passwordConfirmation"
                  className="mb-1 block text-[11px] font-medium text-zinc-700 sm:text-xs"
                >
                  Konfirmasi Password Baru{" "}
                  <span className="text-rose-600">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="passwordConfirmation"
                    name="passwordConfirmation"
                    type={showPasswordConfirmation ? "text" : "password"}
                    required
                    minLength={6}
                    maxLength={72}
                    autoComplete="new-password"
                    placeholder="Ketik ulang password"
                    disabled={pending}
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirmation((v) => !v)}
                    aria-label={showPasswordConfirmation ? "Sembunyikan" : "Tampilkan"}
                    className="rounded-md bg-zinc-100 p-2 text-zinc-600 transition hover:bg-zinc-200"
                  >
                    {showPasswordConfirmation ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                {state.fieldErrors?.passwordConfirmation ? (
                  <p className="mt-1 rounded-md bg-rose-50 px-3 py-2 text-[11px] text-rose-700 sm:text-xs">
                    {state.fieldErrors.passwordConfirmation[0]}
                  </p>
                ) : null}
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
                  className="inline-flex items-center justify-center gap-1.5 rounded-md bg-amber-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50 sm:text-sm"
                >
                  {pending && <Loader2 className="size-3 animate-spin" />}
                  <KeyRound className="size-3" />
                  Reset Password
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}