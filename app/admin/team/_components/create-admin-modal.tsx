import { AdminUserState, createAdminUser } from "@/lib/actions/admin-users";
import { inputClass, LeaderOption } from "./team-table";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Copy, Eye, EyeOff, Loader2, X } from "lucide-react";
import LeaderSelect from "./leader-select";
import { initialState } from "./team-table";

export default function CreateAdminModal({
  leaders,
  canCreateLeader,
  currentLeaderId,
  onClose,
  onCreated,
}: {
  leaders: LeaderOption[];
  /**
   * `true` untuk super admin (boleh membuat Admin Leader).
   * `false` untuk admin leader (hanya boleh membuat Admin Staff, dengan leaderId otomatis).
   */
  canCreateLeader: boolean;
  /**
   * ID admin leader yang sedang login. Dipakai sebagai default leaderId
   * ketika admin leader membuat staff baru.
   */
  currentLeaderId: string;
  onClose: () => void;
  onCreated: (result: AdminUserState) => void;
}) {
  const [state, action] = useActionState(createAdminUser, initialState);
  const [pending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [role, setRole] = useState<"admin_leader" | "admin_staff" | "">(
    canCreateLeader ? "" : "admin_staff",
  );
  // Simpan callback terbaru di ref agar useEffect tidak retrigger tiap parent re-render.
  const onCreatedRef = useRef(onCreated);
  useEffect(() => {
    onCreatedRef.current = onCreated;
  }, [onCreated]);

  // Pakai reference equality: `state === initialState` artinya action belum pernah dipanggil.
  // Aman terhadap React StrictMode (double-invoke effect di dev).
  useEffect(() => {
    if (state === initialState) return;
    if (state.success) {
      onCreatedRef.current(state);
    }
  }, [state]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tambah Admin"
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between sm:mb-5">
          <h2 className="text-sm font-bold text-zinc-900 sm:text-base">
            Tambah Admin
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
            {state.generatedReferralCode && (
              <div>
                <label className="mb-1 block text-[11px] font-medium text-zinc-700 sm:text-xs">
                  Referral Code
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={state.generatedReferralCode}
                    className={`${inputClass} font-mono tracking-wider`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (state.generatedReferralCode) {
                        navigator.clipboard.writeText(state.generatedReferralCode);
                      }
                    }}
                    aria-label="Salin referral"
                    className="rounded-md bg-indigo-100 p-2 text-indigo-700 transition hover:bg-indigo-200"
                  >
                    <Copy className="size-4" />
                  </button>
                </div>
              </div>
            )}
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
          <form
            action={(fd) => startTransition(() => action(fd))}
            className="space-y-3"
          >
            <div>
              <label
                htmlFor="role"
                className="mb-1 block text-[11px] font-medium text-zinc-700 sm:text-xs"
              >
                Role
              </label>
              {canCreateLeader ? (
                <select
                  id="role"
                  name="role"
                  required
                  value={role}
                  onChange={(e) =>
                    setRole(e.target.value as "admin_leader" | "admin_staff" | "")
                  }
                  disabled={pending}
                  className={inputClass}
                >
                  <option value="" disabled>
                    Pilih role...
                  </option>
                  <option value="admin_leader">Admin Leader</option>
                  <option value="admin_staff">Admin Staff</option>
                </select>
              ) : (
                <>
                  <input type="hidden" name="role" value="admin_staff" />
                  <input
                    type="text"
                    readOnly
                    value="Admin Staff"
                    className={`${inputClass} bg-zinc-50`}
                  />
                  <p className="mt-1 text-[11px] text-zinc-500 sm:text-xs">
                    Leader hanya dapat membuat Admin Staff di bawah dirinya.
                  </p>
                </>
              )}
            </div>

            {role === "admin_staff" && canCreateLeader && (
              <LeaderSelect
                leaders={leaders}
                name="leaderId"
                disabled={pending}
                required
              />
            )}

            {role === "admin_staff" && !canCreateLeader && (
              <input type="hidden" name="leaderId" value={currentLeaderId} />
            )}

            <div>
              <label
                htmlFor="username"
                className="mb-1 block text-[11px] font-medium text-zinc-700 sm:text-xs"
              >
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                minLength={3}
                maxLength={20}
                autoComplete="off"
                placeholder="cth: leader_budi atau staff_ana"
                disabled={pending}
                className={inputClass}
              />
              <p className="mt-1 text-[11px] text-zinc-500 sm:text-xs">
                3-20 karakter, hanya huruf, angka, dan underscore.
              </p>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-[11px] font-medium text-zinc-700 sm:text-xs"
              >
                Password <span className="text-rose-600">*</span>
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
              <p className="mt-1 text-[11px] text-zinc-500 sm:text-xs">
                Password diisi manual oleh admin. Minimal 6 karakter.
              </p>
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
                Konfirmasi Password <span className="text-rose-600">*</span>
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

            {role === "admin_staff" && (
              <div>
                <label
                  htmlFor="referralCode"
                  className="mb-1 block text-[11px] font-medium text-zinc-700 sm:text-xs"
                >
                  Referral Code Manual <span className="text-zinc-400">(opsional)</span>
                </label>
                <input
                  id="referralCode"
                  name="referralCode"
                  type="text"
                  maxLength={20}
                  autoComplete="off"
                  placeholder="cth: 12345 atau staff_andi"
                  disabled={pending}
                  className={`${inputClass} font-mono`}
                />
                <p className="mt-1 text-[11px] text-zinc-500 sm:text-xs">
                  Boleh angka, huruf, underscore, dan hyphen. 3-20 karakter. Kosongkan
                  untuk auto-generate.
                </p>
                {state.fieldErrors?.referralCode ? (
                  <p className="mt-1 rounded-md bg-rose-50 px-3 py-2 text-[11px] text-rose-700">
                    {state.fieldErrors.referralCode[0]}
                  </p>
                ) : null}
              </div>
            )}

            {state.fieldErrors?.username ? (
              <p className="rounded-md bg-rose-50 px-3 py-2 text-[11px] text-rose-700 sm:text-xs">
                {state.fieldErrors.username[0]}
              </p>
            ) : null}
            {state.fieldErrors?.leaderId ? (
              <p className="rounded-md bg-rose-50 px-3 py-2 text-[11px] text-rose-700 sm:text-xs">
                {state.fieldErrors.leaderId[0]}
              </p>
            ) : null}
            {state.fieldErrors?.role ? (
              <p className="rounded-md bg-rose-50 px-3 py-2 text-[11px] text-rose-700 sm:text-xs">
                {state.fieldErrors.role[0]}
              </p>
            ) : null}

            {state.error && (
              <p className="rounded-md bg-rose-50 px-3 py-2 text-[11px] text-rose-700 sm:text-sm">
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
                disabled={
                  pending ||
                  (role === "admin_staff" && canCreateLeader && leaders.length === 0)
                }
                className="inline-flex items-center justify-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50 sm:text-sm"
              >
                {pending && <Loader2 className="size-3 animate-spin" />}
                Buat Admin
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}