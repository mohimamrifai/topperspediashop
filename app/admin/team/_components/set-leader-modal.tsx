import { useActionState, useEffect, useRef, useTransition } from "react";
import { Admin, LeaderOption, initialState, inputClass } from "./team-table";
import { setStaffLeader } from "@/lib/actions/admin-users";
import { Link2, Loader2, X } from "lucide-react";
import useModalLifecycle from "./use-modal-lifecycle";

export default function SetLeaderModal({
  staff,
  leaders,
  isCurrentSuperAdmin,
  currentLeaderId,
  currentLeaderUsername,
  onClose,
  onSaved,
}: {
  staff: Admin;
  leaders: LeaderOption[];
  isCurrentSuperAdmin: boolean;
  /**
   * ID leader yang sedang login. Dipakai sebagai default value (dan
   * satu-satunya pilihan) untuk role `admin_leader`.
   */
  currentLeaderId: string;
  /** Username leader yang sedang login, untuk fallback ketika leaders belum termuat. */
  currentLeaderUsername: string;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const [state, action] = useActionState(setStaffLeader, initialState);
  const [pending, startTransition] = useTransition();
  const onSavedRef = useRef(onSaved);
  useEffect(() => {
    onSavedRef.current = onSaved;
  }, [onSaved]);

  useEffect(() => {
    if (state === initialState) return;
    if (state.success && state.message) onSavedRef.current(state.message);
  }, [state]);

  useModalLifecycle(onClose);

  // Daftar opsi leader yang boleh dipilih:
  //  - super admin: semua leader
  //  - admin leader: hanya diri sendiri (dropdown disabled, value terkunci)
  const options: LeaderOption[] = isCurrentSuperAdmin
    ? leaders
    : [{ id: currentLeaderId, username: currentLeaderUsername }];

  const isOrphan = !staff.leaderUsername;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Set leader untuk @${staff.username}`}
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
            {isOrphan ? "Kaitkan Staff ke Leader" : "Ganti Leader Staff"}
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

        <p className="text-[11px] text-zinc-600 sm:text-xs">
          Staff{" "}
          <span className="font-semibold text-zinc-900">@{staff.username}</span>{" "}
          {isOrphan ? (
            <>
              saat ini{" "}
              <span className="font-semibold text-rose-600">belum terikat</span> ke
              leader manapun. Pilih leader untuk staff ini.
            </>
          ) : (
            <>
              saat ini di bawah{" "}
              <span className="font-semibold text-zinc-900">@{staff.leaderUsername}</span>.
              Pilih leader baru.
            </>
          )}
        </p>

        {options.length === 0 ? (
          <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-[11px] text-amber-800 sm:text-xs">
            Belum ada Admin Leader. Buat leader terlebih dahulu.
          </p>
        ) : (
          <div className="mt-3">
            <label
              htmlFor="newLeaderId"
              className="mb-1 block text-[11px] font-medium text-zinc-700 sm:text-xs"
            >
              Leader <span className="text-rose-600">*</span>
            </label>
            <select
              id="newLeaderId"
              name="newLeaderId"
              required
              defaultValue={isOrphan ? currentLeaderId : staff.leaderId ?? currentLeaderId}
              disabled={pending || !isCurrentSuperAdmin}
              className={inputClass}
            >
              {isCurrentSuperAdmin && (
                <option value="" disabled>
                  Pilih leader...
                </option>
              )}
              {options.map((l) => (
                <option key={l.id} value={l.id}>
                  @{l.username}
                </option>
              ))}
            </select>
            {!isCurrentSuperAdmin && (
              <p className="mt-1 text-[11px] text-zinc-500 sm:text-xs">
                Leader hanya dapat menetapkan diri sendiri sebagai leader.
              </p>
            )}
            {state.fieldErrors?.newLeaderId?.[0] && (
              <p className="mt-1 rounded-md bg-rose-50 px-3 py-2 text-[11px] text-rose-700 sm:text-xs">
                {state.fieldErrors.newLeaderId[0]}
              </p>
            )}
          </div>
        )}

        <input type="hidden" name="staffId" value={staff.id} />

        {state.error && (
          <p className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-[11px] text-rose-700 sm:text-xs">
            {state.error}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2">
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
            disabled={pending || options.length === 0}
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50 sm:text-sm"
          >
            {pending && <Loader2 className="size-3 animate-spin" />}
            <Link2 className="size-3" />
            {isOrphan ? "Kaitkan" : "Ganti Leader"}
          </button>
        </div>
      </form>
    </div>
  );
}