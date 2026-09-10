import Link from "next/link";

type Props = {
  label: string;
  amount: string;
  topUpHref: string;
  withdrawHref: string;
};

export function TaskBalanceCard({
  label,
  amount,
  topUpHref,
  withdrawHref,
}: Props) {
  return (
    <div className="rounded-2xl bg-brand p-4 text-white shadow-sm sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-white/85 sm:text-sm">{label}</p>
          <p className="mt-0.5 text-2xl font-bold tracking-tight sm:text-3xl">
            {amount}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-stretch gap-1.5 sm:gap-2">
          <Link
            href={topUpHref}
            className="rounded-full bg-white/20 px-2.5 py-1 text-center text-[11px] font-semibold text-white transition hover:bg-white/30 sm:px-3 sm:text-xs"
          >
            Isi Ulang
          </Link>
          <Link
            href={withdrawHref}
            className="rounded-full bg-rose-500 px-2.5 py-1 text-center text-[11px] font-semibold text-white transition hover:bg-rose-600 sm:px-3 sm:text-xs"
          >
            Tarik
          </Link>
        </div>
      </div>
    </div>
  );
}
