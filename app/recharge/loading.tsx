import { Skeleton } from "../_components/skeleton";
import { BottomNav } from "../_components/bottom-nav";

export default function MemberRechargeWithdrawLoading() {
  return (
    <div className="min-h-full bg-zinc-50 pb-24">
      <div className="sticky top-0 z-20 h-14 w-full bg-emerald-600 shadow-sm sm:h-16" />
      <div className="mx-auto mt-3 max-w-lg space-y-3 px-4 sm:mt-4 sm:space-y-4 sm:px-6">
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200/60">
          <div className="p-4 sm:p-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-3 h-7 w-36" />
          </div>
          <div className="border-t border-zinc-100 p-4 sm:p-5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-2 h-5 w-32" />
          </div>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/60 sm:p-5">
          <Skeleton className="mb-3 h-3 w-28" />
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
