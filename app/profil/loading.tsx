import { Skeleton } from "../_components/skeleton";
import { BottomNav } from "../_components/bottom-nav";

export default function ProfilLoading() {
  return (
    <div className="min-h-full bg-zinc-50 pb-24">
      <div className="h-32 w-full bg-emerald-600 sm:h-40">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 pt-6 sm:px-6 sm:pt-7">
          <Skeleton className="size-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32 bg-emerald-400" />
            <Skeleton className="h-3 w-24 bg-emerald-400" />
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto -mt-10 max-w-2xl space-y-3 px-4 sm:-mt-12 sm:space-y-4 sm:px-6">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/60 sm:p-5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-8 w-40" />
          <div className="mt-4 grid grid-cols-4 gap-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
        <Skeleton className="h-16 w-full" />
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/60 sm:p-5">
          <Skeleton className="mb-3 h-3 w-28" />
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
