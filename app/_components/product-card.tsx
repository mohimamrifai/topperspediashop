import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  title: string;
  href: string;
  imageSlot?: ReactNode;
};

export function ProductCard({ title, href, imageSlot }: Props) {
  return (
    <article className="overflow-hidden rounded-xl bg-white text-center shadow-sm ring-1 ring-zinc-200/70">
      <div className="relative md:m-4 m-2 aspect-square overflow-hidden rounded-md bg-zinc-50">
        <div className="flex h-full w-full items-center justify-center">
          {imageSlot}
        </div>
      </div>
      <div className="space-y-2 p-2.5 sm:p-3">
        <h3 className="line-clamp-2 text-[11px] font-medium uppercase leading-tight tracking-wide text-zinc-900 sm:text-xs">
          {title}
        </h3>
        <Link
          href={href}
          className="block rounded-md bg-emerald-600 py-2 text-center text-[11px] font-bold text-white transition hover:bg-emerald-700 active:bg-emerald-800 md:mx-6 sm:text-xs"
        >
          Promosikan
        </Link>
      </div>
    </article>
  );
}
