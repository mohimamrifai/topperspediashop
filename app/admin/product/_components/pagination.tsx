"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

function getPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "ellipsis")[] = [1];

  if (current > 4) pages.push("ellipsis");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 3) pages.push("ellipsis");

  pages.push(total);
  return pages;
}

const baseButtonClass =
  "inline-flex h-8 min-w-8 items-center justify-center rounded-md border border-zinc-200 bg-white px-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 active:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50";

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: Props) {
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(currentPage, totalPages);

  return (
    <div className="flex items-center justify-center gap-1">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Halaman sebelumnya"
        className={baseButtonClass}
      >
        <ChevronLeft className="size-3.5" />
      </button>

      {pages.map((p, i) =>
        p === "ellipsis" ? (
          <span
            key={`e-${i}`}
            className="px-1 text-xs text-zinc-400"
            aria-hidden="true"
          >
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            aria-current={p === currentPage ? "page" : undefined}
            className={`${baseButtonClass} ${
              p === currentPage
                ? "border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700"
                : ""
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Halaman berikutnya"
        className={baseButtonClass}
      >
        <ChevronRight className="size-3.5" />
      </button>
    </div>
  );
}
