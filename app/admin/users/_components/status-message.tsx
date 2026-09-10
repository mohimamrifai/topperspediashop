"use client";
import { MemberToolState } from "@/lib/actions/member-tools";
import { X } from "lucide-react";
import { useState, useEffect } from "react";

export default function StatusMessage({ state }: { state: MemberToolState }) {
  const [show, setShow] = useState(true);
  useEffect(() => {
    // Reset show=true setiap kali `state` berubah (mis. error/success baru),
    // supaya pesan tampil lagi walau user sebelumnya sudah menutupnya.
    // Pola yang benar untuk re-show notifikasi terhadap perubahan state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShow(true);
  }, [state]);
  if (!show) return null;
  if (state.error) {
    return (
      <div className="mt-3 flex items-start justify-between gap-2 rounded-md bg-rose-50 px-3 py-2 text-[11px] text-rose-700 sm:text-xs">
        <span>{state.error}</span>
        <button type="button" onClick={() => setShow(false)} aria-label="Tutup pesan">
          <X className="size-3" />
        </button>
      </div>
    );
  }
  if (state.success) {
    return (
      <div className="mt-3 flex items-start justify-between gap-2 rounded-md bg-emerald-50 px-3 py-2 text-[11px] text-emerald-700 sm:text-xs">
        <span>{state.message ?? "Berhasil."}</span>
        <button type="button" onClick={() => setShow(false)} aria-label="Tutup pesan">
          <X className="size-3" />
        </button>
      </div>
    );
  }
  return null;
}