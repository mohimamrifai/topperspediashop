"use client";

import { RefreshButton } from "@/app/_components/refresh-button";

export function TaskPageHeader() {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h1 className="text-lg font-bold text-zinc-900 sm:text-xl">Tugas</h1>
      <RefreshButton label="Refresh" />
    </div>
  );
}
