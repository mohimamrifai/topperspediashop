import { LogOut } from "lucide-react";

import { adminSignOut } from "@/lib/actions/auth";

type Props = {
  variant?: "icon" | "full";
  className?: string;
};

export function AdminLogoutButton({ variant = "full", className = "" }: Props) {
  return (
    <form action={adminSignOut}>
      <button
        type="submit"
        aria-label="Logout"
        className={
          variant === "icon"
            ? `rounded-md p-1.5 text-rose-400 transition hover:bg-rose-500/10 hover:text-rose-300 ${className}`
            : `inline-block whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold text-rose-400 transition hover:bg-rose-500/10 hover:text-rose-300 sm:px-4 sm:text-sm ${className}`
        }
      >
        {variant === "icon" ? <LogOut className="size-4" /> : "Logout"}
      </button>
    </form>
  );
}
