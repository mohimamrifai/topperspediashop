import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";

import { signOut } from "@/lib/actions/auth";

type Props = {
  icon: LucideIcon;
  label: string;
};

export function LogoutRow({ icon: Icon, label }: Props) {
  return (
    <li>
      <form action={signOut}>
        <button
          type="submit"
          className="group flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-zinc-50 sm:px-5 sm:py-3.5"
        >
          <Icon
            className="size-5 text-rose-500"
            strokeWidth={1.8}
          />
          <span className="flex-1 text-sm font-medium text-rose-500 sm:text-base">
            {label}
          </span>
          <ChevronRight
            className="size-4 text-rose-500 transition group-hover:translate-x-0.5 sm:size-5"
            strokeWidth={2}
          />
        </button>
      </form>
    </li>
  );
}
