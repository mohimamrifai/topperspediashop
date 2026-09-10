import { Skeleton } from "./_components/skeleton";

export default function GlobalLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <div className="h-1 w-full animate-pulse bg-linear-to-r from-emerald-200 via-emerald-400 to-emerald-200" />
      <div className="mx-auto w-full max-w-2xl space-y-3 px-4 py-6 sm:space-y-4 sm:py-8">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}
