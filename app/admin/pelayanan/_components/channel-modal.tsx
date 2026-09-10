"use client";

import { useActionState, useEffect, useState } from "react";
import { Save, X } from "lucide-react";

import {
  createChannel,
  updateChannel,
  type ChannelState,
} from "@/lib/actions/channels";

const types: { value: "whatsapp" | "telegram"; label: string; placeholder: string }[] = [
  {
    value: "whatsapp",
    label: "WhatsApp",
    placeholder: "https://wa.me/6281234567890",
  },
  {
    value: "telegram",
    label: "Telegram",
    placeholder: "https://t.me/nama_channel",
  },
];

export type ChannelInput = {
  id: number;
  type: "whatsapp" | "telegram";
  label: string;
  url: string;
  isActive: boolean;
  sortOrder: number;
};

const inputClass =
  "w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:text-sm";

const labelClass = "text-xs font-semibold text-zinc-900 sm:text-sm";
const initialState: ChannelState = {};

type Props = {
  initial: ChannelInput | null;
  onClose: () => void;
  onSaved: (saved: NonNullable<ChannelState["saved"]>) => void;
};

export function ChannelModal({ initial, onClose, onSaved }: Props) {
  const [type, setType] = useState<"whatsapp" | "telegram">(
    initial?.type ?? "whatsapp",
  );
  const [state, formAction, isPending] = useActionState(
    initial ? updateChannel : createChannel,
    initialState,
  );

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

  // Auto-close on success (no fieldErrors & no error & done)
  // Pakai reference equality `state === initialState` untuk skip initial mount
  // (aman terhadap React StrictMode yang double-invoke effect di dev).
  useEffect(() => {
    if (state === initialState) return;
    if (isPending) return;
    if (state.error || state.fieldErrors) return;
    if (state.saved) onSaved(state.saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPending, state]);

  const currentType = types.find((t) => t.value === type);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={initial ? "Edit channel" : "Tambah channel"}
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 p-3 sm:p-4"
      onClick={onClose}
    >
      <form
        action={formAction}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl sm:p-5"
      >
        <div className="mb-4 flex items-center justify-between sm:mb-5">
          <h2 className="text-sm font-bold text-zinc-900 sm:text-base">
            {initial ? "Edit Channel" : "Tambah Channel"}
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

        <div className="space-y-3">
          {initial && <input type="hidden" name="id" value={initial.id} />}

          <label className="block">
            <span className={`mb-1 block ${labelClass}`}>Jenis Layanan</span>
            <select
              name="type"
              value={type}
              onChange={(e) =>
                setType(e.target.value as "whatsapp" | "telegram")
              }
              className={inputClass}
            >
              {types.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            {state.fieldErrors?.type?.[0] && (
              <span className="mt-1 block text-xs text-rose-600">
                {state.fieldErrors.type[0]}
              </span>
            )}
          </label>

          <label className="block">
            <span className={`mb-1 block ${labelClass}`}>Label</span>
            <input
              type="text"
              name="label"
              defaultValue={initial?.label ?? ""}
              placeholder="cth: Customer Service 1"
              className={inputClass}
            />
            {state.fieldErrors?.label?.[0] && (
              <span className="mt-1 block text-xs text-rose-600">
                {state.fieldErrors.label[0]}
              </span>
            )}
          </label>

          <label className="block">
            <span className={`mb-1 block ${labelClass}`}>URL</span>
            <input
              type="url"
              name="url"
              defaultValue={initial?.url ?? ""}
              placeholder={currentType?.placeholder}
              className={inputClass}
            />
            {state.fieldErrors?.url?.[0] && (
              <span className="mt-1 block text-xs text-rose-600">
                {state.fieldErrors.url[0]}
              </span>
            )}
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className={`mb-1 block ${labelClass}`}>Urutan</span>
              <input
                type="number"
                name="sortOrder"
                defaultValue={initial?.sortOrder ?? 0}
                inputMode="numeric"
                className={inputClass}
              />
            </label>
            <label className="flex items-end gap-2 pb-2">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked={initial?.isActive ?? true}
                className="size-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className={labelClass}>Aktif</span>
            </label>
          </div>

          {state.error && (
            <p className="rounded-md bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 sm:text-sm">
              {state.error}
            </p>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-zinc-100 px-4 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-200 sm:text-sm"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60 sm:text-sm"
          >
            <Save className="size-3.5" />
            {isPending ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </form>
    </div>
  );
}
