import { Skeleton, TableSkeleton } from "@/app/_components/skeleton";

export default function AdminTableLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-4 sm:space-y-5 sm:py-5">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/60"
          >
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-2 h-7 w-32" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-zinc-200/60 sm:p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Skeleton className="h-9 flex-1 sm:max-w-xs" />
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-4 w-32 sm:ml-auto" />
        </div>
      </div>
      <TableSkeleton rows={6} cols={7} />
    </div>
  );
}
