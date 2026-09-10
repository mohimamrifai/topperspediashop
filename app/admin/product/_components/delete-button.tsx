import { deleteProduct } from "@/lib/actions/products";
import { useState, useTransition } from "react";

export default function DeleteButton({
  id,
  onDeleted,
}: {
  id: number;
  onDeleted: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState(false);

  function handleDelete() {
    const fd = new FormData();
    fd.set("id", String(id));
    startTransition(async () => {
      await deleteProduct({}, fd);
      onDeleted();
    });
  }

  if (confirm) {
    return (
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="rounded-md bg-rose-600 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-rose-700 disabled:opacity-60"
        >
          {isPending ? "..." : "Yakin?"}
        </button>
        <button
          type="button"
          onClick={() => setConfirm(false)}
          className="rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-200"
        >
          Batal
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirm(true)}
      className="rounded-md bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-700 transition hover:bg-rose-200"
    >
      Hapus
    </button>
  );
}