import { KeyRound, Loader2, X } from "lucide-react";
import { Admin, AdminRole, initialState, inputClass } from "./team-table";
import useModalLifecycle from "./use-modal-lifecycle";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { updateAdminUser } from "@/lib/actions/admin-users";

export default 
function EditAdminModal({
  admin,
  canEditRole,
  onClose,
  onSaved,
  onResetPassword,
}: {
  admin: Admin;
  /**
   * `true` untuk super admin (boleh ganti role/leader).
   * `false` untuk admin leader (hanya boleh ubah username & leaderId otomatis).
   */
  canEditRole: boolean;
  onClose: () => void;
  onSaved: (msg: string) => void;
  onResetPassword: (a: Admin) => void;
}) {
  const [state, action] = useActionState(updateAdminUser, initialState);
  const [pending, startTransition] = useTransition();
  const [currentRole, setCurrentRole] = useState<AdminRole>(admin.role);
  // Simpan callback terbaru di ref agar useEffect tidak retrigger tiap parent re-render.
  const onSavedRef = useRef(onSaved);
  useEffect(() => {
    onSavedRef.current = onSaved;
  }, [onSaved]);

  // Pakai reference equality: `state === initialState` artinya action belum pernah dipanggil.
  // Aman terhadap React StrictMode (double-invoke effect di dev).
  useEffect(() => {
    if (state === initialState) return;
    if (state.success && state.message) onSavedRef.current(state.message);
  }, [state]);

  useModalLifecycle(onClose);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Edit admin @${admin.username}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between sm:mb-5">
          <h2 className="text-sm font-bold text-zinc-900 sm:text-base">
            Edit Admin @{admin.username}
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

        <form
          action={(fd) => startTransition(() => action(fd))}
          className="space-y-3"
        >
          <input type="hidden" name="adminId" value={admin.id} />

          <div>
            <label
              htmlFor="newRole"
              className="mb-1 block text-[11px] font-medium text-zinc-700 sm:text-xs"
            >
              Role
            </label>
            {canEditRole ? (
              <select
                id="newRole"
                name="newRole"
                required
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value as AdminRole)}
                disabled={pending}
                className={inputClass}
              >
                <option value="admin_leader">Admin Leader</option>
                <option value="admin_staff">Admin Staff</option>
              </select>
            ) : (
              <>
                <input type="hidden" name="newRole" value={admin.role} />
                <input
                  type="text"
                  readOnly
                  value={admin.role === "admin_leader" ? "Admin Leader" : "Admin Staff"}
                  className={`${inputClass} bg-zinc-50`}
                />
                <p className="mt-1 text-[11px] text-zinc-500 sm:text-xs">
                  Leader tidak dapat mengubah role staff.
                </p>
              </>
            )}
            {admin.role === "admin_staff" && (
              <p className="mt-1 text-[11px] text-zinc-500 sm:text-xs">
                Referral code saat ini:{" "}
                <span className="font-mono">{admin.referralCode}</span>
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="newUsername"
              className="mb-1 block text-[11px] font-medium text-zinc-700 sm:text-xs"
            >
              Username
            </label>
            <input
              id="newUsername"
              name="newUsername"
              type="text"
              required
              minLength={3}
              maxLength={20}
              autoComplete="off"
              defaultValue={admin.username}
              disabled={pending}
              className={inputClass}
            />
          </div>

          {currentRole === "admin_staff" && (
            <input type="hidden" name="newLeaderId" value={admin.leaderId ?? ""} />
          )}

          {canEditRole && currentRole === "admin_staff" && (
            <div>
              <label
                htmlFor="newReferralCode"
                className="mb-1 block text-[11px] font-medium text-zinc-700 sm:text-xs"
              >
                Referral Code
              </label>
              <input
                id="newReferralCode"
                name="newReferralCode"
                type="text"
                maxLength={20}
                autoComplete="off"
                defaultValue={admin.referralCode ?? ""}
                placeholder="cth: 12345 atau staff_andi"
                disabled={pending}
                className={`${inputClass} font-mono`}
              />
              <p className="mt-1 text-[11px] text-zinc-500 sm:text-xs">
                Boleh angka, huruf, underscore, dan hyphen. 3-20 karakter. Kosongkan
                untuk mempertahankan yang ada.
              </p>
              {state.fieldErrors?.newReferralCode ? (
                <p className="mt-1 rounded-md bg-rose-50 px-3 py-2 text-[11px] text-rose-700">
                  {state.fieldErrors.newReferralCode[0]}
                </p>
              ) : null}
            </div>
          )}

          {state.fieldErrors?.newLeaderId ? (
            <p className="rounded-md bg-rose-50 px-3 py-2 text-[11px] text-rose-700 sm:text-xs">
              {state.fieldErrors.newLeaderId[0]}
            </p>
          ) : null}

          {state.error && (
            <p className="rounded-md bg-rose-50 px-3 py-2 text-[11px] text-rose-700 sm:text-xs">
              {state.error}
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => onResetPassword(admin)}
              disabled={pending}
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-800 transition hover:bg-amber-200 disabled:opacity-50 sm:text-sm"
            >
              <KeyRound className="size-3" />
              Reset Password
            </button>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
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
                Simpan
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
