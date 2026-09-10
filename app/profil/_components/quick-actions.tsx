import type { LucideIcon } from "lucide-react";

type Item = {
  icon: LucideIcon;
  label: string;
  href: string;
};

type Props = {
  items: Item[];
};

export function QuickActions({ items }: Props) {
  return (
    <div className="mt-3 grid grid-cols-4 gap-2.5 sm:gap-3">
      {items.map(({ icon: Icon, label, href }) => (
        <a
          key={label}
          href={href}
          className="group flex flex-col items-center gap-2 rounded-2xl bg-card px-2 py-4 text-center shadow-sm ring-1 ring-zinc-200/60 transition hover:-translate-y-0.5 hover:shadow-md sm:py-5"
        >
          <Icon
            className="size-6 text-brand transition group-hover:scale-105 sm:size-7"
            strokeWidth={1.8}
          />
          <span className="text-xs font-medium text-foreground sm:text-sm">
            {label}
          </span>
        </a>
      ))}
    </div>
  );
}
