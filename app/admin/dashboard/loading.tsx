import { CardSkeleton, Skeleton } from "@/app/_components/skeleton";

export default function AdminDashboardLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-4 sm:space-y-5 sm:py-5">
      <Skeleton className="h-14 w-full rounded-xl" />

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
        <CardSkeleton className="h-24" />
        <CardSkeleton className="h-24" />
      </div>
    </div>
  );
}
