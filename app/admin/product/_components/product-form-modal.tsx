"use client";

import { useActionState, useEffect } from "react";
import { initialState, labelClass, Product } from "./products-table";
import { createProduct, updateProduct } from "@/lib/actions/products";
import ModalShell from "./modal-sheel";
import Field from "./field";
import { ImageDropzone } from "@/app/_components/image-dropzone";
import { Save } from "lucide-react";

export default function ProductFormModal({
  mode,
  product,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  product?: Product;
  onClose: () => void;
  onSaved: (p: Product) => void;
}) {
  const [state, formAction, isPending] = useActionState(
    mode === "create" ? createProduct : updateProduct,
    initialState,
  );

  useEffect(() => {
    if (!state.success || !state.product) return;
    onSaved(state.product);
    onClose();
  }, [state, onClose, onSaved]);

  return (
    <ModalShell
      title={mode === "create" ? "Tambah Produk" : "Edit Produk"}
      onClose={onClose}
    >
      <form action={formAction} className="space-y-3">
        {mode === "edit" && <input type="hidden" name="id" value={product?.id} />}

        <Field
          label="Nama Produk"
          name="name"
          defaultValue={product?.name}
          error={state.fieldErrors?.name?.[0]}
        />
        <Field
          label="Harga (Rp)"
          name="price"
          inputMode="numeric"
          defaultValue={
            product ? String(Math.round(Number(product.price))) : ""
          }
          error={state.fieldErrors?.price?.[0]}
        />
        <ImageDropzone
          label="Gambar Produk"
          initialUrl={product?.imageUrl ?? null}
          error={state.fieldErrors?.image?.[0]}
          onFileChange={() => {}}
          helpText="Format JPG/PNG/WEBP, maksimal 2MB."
        />

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={product?.isActive ?? true}
            className="size-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className={labelClass}>Aktif</span>
        </label>

        {state.error && (
          <p className="rounded-md bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 sm:text-sm">
            {state.error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-zinc-100 px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-200 sm:text-sm"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60 sm:text-sm"
          >
            <Save className="size-3.5" />
            {isPending ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
