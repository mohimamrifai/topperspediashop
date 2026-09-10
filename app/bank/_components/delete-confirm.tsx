import { deleteBankAccount } from "@/lib/actions/bank-accounts";
import ModalActions from "./modal-actions";
import ModalShell from "./modal-shell";
import { useToast } from "@/app/_components/toast";
import { useTransition } from "react";

export default function DeleteConfirm({
  id,
  onCancel,
  onDeleted,
}: {
  id: number;
  onCancel: () => void;
  onDeleted: () => void;
}) {
  const [, startTransition] = useTransition();
  const { show } = useToast();

  function handleDelete() {
    const fd = new FormData();
    fd.set("id", String(id));
    startTransition(async () => {
      const res = await deleteBankAccount({}, fd);
      if (res.error) {
        show(res.error, "error");
        return;
      }
      show("Rekening dihapus.", "success");
      onDeleted();
    });
  }

  return (
    <ModalShell onClose={onCancel} title="Hapus Rekening">
      <p className="text-xs text-zinc-700 sm:text-sm">
        Yakin ingin menghapus rekening ini? Tindakan ini tidak dapat dibatalkan.
      </p>
      <ModalActions
        onCancel={onCancel}
        onSubmit={handleDelete}
        submitLabel="Hapus"
        submitVariant="danger"
      />
    </ModalShell>
  );
}