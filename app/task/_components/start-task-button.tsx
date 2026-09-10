"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";

import { requestTask } from "@/lib/actions/tasks-member";

type Props = {
  orderHref: string;
  label?: string;
};

export function StartTaskButton({
  orderHref,
  label = "Mulai Tugas",
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await requestTask();
      // Selalu arahkan ke /order. Kalau user sudah punya request/task
      // aktif sebelumnya, halaman /order akan menampilkan toast.
      const url = result.hasExisting
        ? `${orderHref}?hasExisting=1`
        : orderHref;
      router.push(url);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:brightness-95 active:brightness-90 disabled:opacity-60 sm:mt-4 sm:py-3 sm:text-base"
    >
      {pending && <Loader2 className="size-3.5 animate-spin sm:size-4" />}
      {label}
    </button>
  );
}
