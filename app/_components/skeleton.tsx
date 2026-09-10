import type { ComponentProps } from "react";

type Props = ComponentProps<"div"> & {
  className?: string;
};

export function Skeleton({ className = "", ...rest }: Props) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-md bg-zinc-200/80 ${className}`}
      {...rest}
    />
  );
}

export function CardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/60 sm:p-5 ${className}`}
    >
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-7 w-32" />
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="border-t border-zinc-200">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-3 py-3 sm:px-4 sm:py-4">
          <Skeleton className="h-3 w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-zinc-200/60">
      <table className="w-full min-w-[600px] border-collapse">
        <thead className="bg-zinc-100">
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="px-3 py-2 sm:px-4 sm:py-3">
                <Skeleton className="h-3 w-16" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} cols={cols} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
