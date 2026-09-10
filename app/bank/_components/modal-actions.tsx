import { Save } from "lucide-react";

export default function ModalActions({
  onCancel,
  onSubmit,
  isPending,
  submitLabel,
  submitVariant = "primary",
}: {
  onCancel: () => void;
  onSubmit?: () => void;
  isPending?: boolean;
  submitLabel: string;
  submitVariant?: "primary" | "danger";
}) {
  const submitClass =
    submitVariant === "danger"
      ? "bg-rose-600 hover:bg-rose-700 active:bg-rose-800"
      : "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800";

  if (onSubmit) {
    return (
      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md bg-zinc-100 px-4 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-200 sm:text-sm"
        >
          Batal
        </button>
        <button
          type="button"
          onClick={onSubmit}
          className={`inline-flex items-center justify-center gap-1.5 rounded-md px-4 py-2 text-xs font-semibold text-white transition sm:text-sm ${submitClass}`}
        >
          <Save className="size-3.5" />
          {submitLabel}
        </button>
      </div>
    );
  }

  return (
    <div className="mt-5 flex justify-end gap-2">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-md bg-zinc-100 px-4 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-200 sm:text-sm"
      >
        Batal
      </button>
      <button
        type="submit"
        disabled={isPending}
        className={`inline-flex items-center justify-center gap-1.5 rounded-md px-4 py-2 text-xs font-semibold text-white transition disabled:opacity-60 sm:text-sm ${submitClass}`}
      >
        <Save className="size-3.5" />
        {isPending ? "Menyimpan..." : submitLabel}
      </button>
    </div>
  );
}