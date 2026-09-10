"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useToast } from "@/app/_components/toast";

/**
 * Tampilkan toast merah "kamu masih memiliki tugas aktif" kalau
 * halaman /order dibuka dengan ?hasExisting=1 — flag yang diset oleh
 * StartTaskButton ketika user sudah punya request/task aktif.
 *
 * Toast auto-dismiss dan parameter URL dihapus setelah tampil
 * supaya refresh halaman tidak memunculkan toast lagi.
 */
export function ExistingTaskToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { show } = useToast();
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    if (searchParams.get("hasExisting") !== "1") return;
    fired.current = true;
    show("kamu masih memiliki tugas aktif", "error");
    // Bersihkan query param tanpa scroll / re-render halaman
    const url = new URL(window.location.href);
    url.searchParams.delete("hasExisting");
    window.history.replaceState({}, "", url.toString());
  }, [searchParams, show, router]);

  return null;
}
