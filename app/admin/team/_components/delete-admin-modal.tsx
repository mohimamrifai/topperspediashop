import { Loader2, Trash2, X } from "lucide-react";
import { ROLE_LABELS } from "./role-badge";
import { Admin, initialState } from "./team-table";
import { useActionState, useEffect, useRef, useTransition } from "react";
import { deleteAdminUser } from "@/lib/actions/admin-users";
import useModalLifecycle from "./use-modal-lifecycle";

export default 
function DeleteAdminModal({
  admin,
  onClose,
  onDeleted,
}: {
  admin: Admin;
  onClose: () => void;
  onDeleted: (msg: string) => void;
}) {
  const [state, action] = useActionState(deleteAdminUser, initialState);
  const [pending, startTransition] = useTransition();
  const onDeletedRef = useRef(onDeleted);
  useEffect(() => {
    onDeletedRef.current = onDeleted;
  }, [onDeleted]);

  useEffect(() => {
    if (state === initialState) return;
    if (state.success && state.message) onDeletedRef.current(state.message);
  }, [state]);

  useModalLifecycle(onClose);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Hapus admin @${admin.username}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between sm:mb-4">
          <h2 className="text-sm font-bold text-rose-700 sm:text-base">
            Hapus Admin?
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

        <p className="text-xs text-zinc-700 sm:text-sm">
          Anda akan menghapus akun{" "}
          <strong>@{admin.username}</strong> ({ROLE_LABELS[admin.role] ?? admin.role}).
        </p>
        {admin.role === "admin_staff" && admin.memberCount > 0 && (
          <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-[11px] text-amber-800 sm:text-xs">
            <strong>Perhatian:</strong> {admin.memberCount} anggota akan kehilangan
            koneksi referral (akan jadi orphan, tidak di bawah siapa-siapa).
          </p>
        )}

        <form
          action={(fd) => startTransition(() => action(fd))}
          className="mt-4 space-y-3"
        >
          <input type="hidden" name="adminId" value={admin.id} />

          {state.error && (
            <p className="rounded-md bg-rose-50 px-3 py-2 text-[11px] text-rose-700 sm:text-xs">
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