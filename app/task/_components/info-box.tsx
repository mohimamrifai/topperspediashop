import type { ReactNode } from "react";

type Props = {
  label: string;
  children: ReactNode;
};

export function InfoBox({ label, children }: Props) {
  return (
    <div className="mt-3 rounded-2xl bg-sky-50/80 p-3.5 text-xs leading-relaxed text-zinc-600 ring-1 ring-sky-200/60 sm:mt-4 sm:p-4 sm:text-sm">
      <p>
        <span className="font-bold text-zinc-800">{label}</span>
        {children}
      </p>
    </div>
  );
}
