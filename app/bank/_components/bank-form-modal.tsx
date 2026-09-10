import { useActionState, useEffect } from "react";
import BankFormFields from "./bank-form-fields";
import ModalActions from "./modal-actions";
import ModalShell from "./modal-shell";
import { Bank, initialState } from "./bank-content";
import { addBankAccount, updateBankAccount } from "@/lib/actions/bank-accounts";

export default function BankFormModal({
  mode,
  initial,
  onClose,
}: {
  mode: "create" | "edit";
  initial?: Bank;
  onClose: () => void;
}) {
  const action = mode === "create" ? addBankAccount : updateBankAccount;
  const [state, formAction, isPending] = useActionState(action, initialState);

  // Tutup modal HANYA setelah action return nilai baru (bukan initial mount).
  // Cek via reference equality: `state === initialState` artinya action belum pernah dipanggil.
  // Aman terhadap React StrictMode (yang double-invoke effect di dev) karena
  // reference `initialState` stabil di setiap render.
  useEffect(() => {
    if (state === initialState) return;
    if (isPending) return;
    if (state.error || state.fieldErrors) return;
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPending, state]);

  return (
    <ModalShell
      onClose={onClose}
      title={mode === "create" ? "Tambah Rekening" : "Edit Rekening"}
    >
      <form
        action={(fd) => {
          if (mode === "edit" && initial) fd.set("id", String(initial.id));
          formAction(fd);
        }}
        className="space-y-3"
      >
        <BankFormFields state={state} initial={initial} />
        <ModalActions
          onCancel={onClose}
          isPending={isPending}
          submitLabel={mode === "create" ? "Simpan" : "Perbarui"}
        />
      </form>
    </ModalShell>
  );
}