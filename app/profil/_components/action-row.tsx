import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";

type Props = {
  icon: LucideIcon;
  label: string;
  href: string;
  danger?: boolean;
};

export function ActionRow({ icon: Icon, label, href, danger }: Props) {
  const tone = danger ? "text-rose-500" : "text-brand";

  return (
    <li>
      <a
        href={href}
        className="group flex items-center gap-3 px-4 py-3 transition hover:bg-zinc-50 sm:px-5 sm:py-3.5"
      >
        <Icon className={`size-5 ${tone}`} strokeWidth={1.8} />
        <span
          className={`flex-1 text-sm font-medium sm:text-base ${
            danger ? tone : "text-foreground"
          }`}
        >
          {label}
        </span>
        <ChevronRight
          className={`size-4 transition group-hover:translate-x-0.5 sm:size-5 ${
            danger ? tone : "text-zinc-300"
          }`}
          strokeWidth={2}
        />
      </a>
    </li>
  );
}
