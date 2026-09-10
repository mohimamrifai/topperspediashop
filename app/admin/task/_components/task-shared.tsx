/**
 * Tipe data, konstanta, style, dan utilitas yang dipakai bersama
 * oleh TasksTable + 3 modal (TaskStatusModal, CreateTaskModal, ConfirmTaskModal).
 */

import { useEffect } from "react";

import type { TaskReviewState } from "@/lib/actions/tasks-admin";

import type { Status } from "./status-badge";

// ============================================================
// Tipe data
// ============================================================

export type Task = {
  id: number;
  kind: "task" | "request";
  memberId: string;
  memberUsername: string;
  memberBalance: string;
  productName: string | null;
  productId: number | null;
  price: string;
  commission: string;
  status: string;
  createdAt: string;
  /**
   * Nomor urut kronologis baris ini di histori member
   * (gabungan task + request, diurutkan ASC berdasarkan `createdAt`).
   * 1 = baris paling lama milik member tsb.
   */
  ke: number;
};

export type MemberOption = {
  id: string;
  username: string;
  level: string;
  status: string;
};

export type ProductOption = {
  id: number;
  name: string;
  price: string;
  imageUrl: string | null;
  isActive: boolean;
};

// ============================================================
// Konstanta UI
// ============================================================

export const STATUS_OPTIONS: { value: Status | "all"; label: string }[] = [
  { value: "all", label: "Semua Status" },
  { value: "menunggu", label: "Menunggu" },
  { value: "dipilih", label: "Dipilih" },
  { value: "dikerjakan", label: "Dikerjakan" },
  { value: "selesai", label: "Selesai" },
  { value: "dibatalkan", label: "Dibatalkan" },
];

export const STATUS_EDITABLE: { value: Status; label: string }[] = [
  { value: "menunggu", label: "Menunggu" },
  { value: "dipilih", label: "Dipilih" },
  { value: "dikerjakan", label: "Dikerjakan" },
  { value: "selesai", label: "Selesai" },
  { value: "dibatalkan", label: "Dibatalkan" },
];

// ============================================================
// Style class names (Tailwind) — dipakai bersama agar konsisten
// ============================================================

export const headerCellClass =
  "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-600 sm:px-4 sm:py-3 sm:text-xs";

export const aksiHeaderClass =
  "sticky right-0 border-l border-zinc-200 bg-zinc-100 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-600 sm:static sm:border-l-0 sm:px-4 sm:py-3 sm:text-xs";

export const inputClass =
  "w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:text-sm";

export const cellClass =
  "px-3 py-2 text-xs text-zinc-700 sm:px-4 sm:py-3 sm:text-sm";

export const aksiCellClass =
  "sticky right-0 border-l border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-700 group-hover:bg-zinc-50/60 sm:static sm:border-l-0 sm:bg-transparent sm:group-hover:bg-transparent sm:px-4 sm:py-3 sm:text-sm";

// ============================================================
// Formatters & state awal server actions
// ============================================================

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** State awal untuk useActionState — identitas objek dijaga agar `===` aman
 *  terhadap React StrictMode (cek di effect modal). */
export const initialReviewState: TaskReviewState = {};

/** Pasang handler Escape + kunci scroll body saat modal terbuka. */
export function useModalEscape(onClose: () => void) {
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
}
