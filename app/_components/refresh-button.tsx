"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

type Props = {
  label?: string;
  className?: string;
};

export function RefreshButton({ label = "Refresh", className = "" }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleRefresh() {
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleRefresh}
      disabled={pending}
      aria-label={label}
      className={`inline-flex items-center justify-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 active:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm ${className}`}
    >
      <RefreshCw className={`size-3.5 ${pending ? "animate-spin" : ""}`} />
      {label}
    </button>
  );
}
