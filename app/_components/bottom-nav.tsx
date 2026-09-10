"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  Home,
  ShoppingBag,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Item = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const items: Item[] = [
  { label: "Beranda", href: "/", icon: Home },
  { label: "Tugas", href: "/task", icon: ClipboardList },
  { label: "Order", href: "/order", icon: ShoppingBag },
  { label: "Profil", href: "/profil", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <ul className="mx-auto flex max-w-2xl items-stretch justify-around">
        {items.map(({ label, href, icon: Icon }) => {
          const active = pathname === href;
          return (
            <li key={label} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition sm:py-3 sm:text-xs ${
                  active
                    ? "text-brand"
                    : "text-zinc-500 hover:text-foreground"
                }`}
              >
                <Icon
                  className="size-5 sm:size-6"
                  strokeWidth={active ? 2.2 : 1.8}
                />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
