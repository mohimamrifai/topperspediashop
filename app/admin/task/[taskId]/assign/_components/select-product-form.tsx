"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";

import {
  assignProduct,
  type AssignProductState,
} from "@/lib/actions/tasks-admin";

const initialState: AssignProductState = {};

type Props = {
  taskId: number;
  productId: number;
  disabled?: boolean;
};

export function SelectProductForm({ taskId, productId, disabled }: Props) {
  const [state, action, pending] = useActionState(assignProduct, initialState);

  return (
    <div className="flex flex-col items-end gap-1">
      <form action={action} className="flex items-center gap-2">
        <input type="hidden" name="taskId" value={taskId} />
        <input type="hidden" name="productId" value={productId} />
        <button
          type="submit"
          disabled={pending || disabled}
          title={
            disabled
              ? "Produk non-aktif tidak dapat dipilih"
              : "Pilih produk ini"
          }
          className="inline-flex items-center justify-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700 active:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
        >
          {pending && <Loader2 className="size-3 animate-spin" />}
          Pilih
        </button>
      </form>
      {state.error && (
        <p className="max-w-[200px] text-right text-[10px] text-rose-600 sm:text-[11px]">
          {state.error}
        </p>
      )}
    </div>
  );
}
