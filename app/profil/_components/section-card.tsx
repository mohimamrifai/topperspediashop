import type { ReactNode } from "react";

type Props = {
  title: string;
  children: ReactNode;
};

export function SectionCard({ title, children }: Props) {
  return (
    <section className="mt-4 overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-zinc-200/60 sm:mt-5">
      <h2 className="px-4 pt-3.5 pb-2 text-xs font-semibold text-zinc-500 sm:px-5 sm:pt-4 sm:text-sm">
        {title}
      </h2>
      <ul className="divide-y divide-zinc-100">{children}</ul>
    </section>
  );
}
