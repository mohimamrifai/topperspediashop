import { Skeleton } from "../_components/skeleton";
import { BottomNav } from "../_components/bottom-nav";

export default function OrderLoading() {
  return (
    <div className="min-h-full bg-zinc-50 pb-28">
      <div className="sticky top-0 z-20 h-14 w-full bg-emerald-600 shadow-sm sm:h-16" />
      <div className="mx-auto mt-3 max-w-lg space-y-3 px-4 sm:mt-4 sm:space-y-4 sm:px-6">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200/60"
          >
            <div className="flex items-start gap-3 p-3 sm:gap-4 sm:p-4">
              <Skeleton className="size-16 shrink-0 sm:size-20" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            <div className="border-t border-zinc-100 px-3 py-2.5 sm:px-4 sm:py-3">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-24" />
              </div>
              <div className="mt-1 flex justify-between">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <BottomNav />
    </div>
  );
}
