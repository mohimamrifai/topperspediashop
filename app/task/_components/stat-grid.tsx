type Stat = {
  label: string;
  value: string;
};

type Props = {
  stats: Stat[];
};

export function StatGrid({ stats }: Props) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-2.5 sm:mt-4 sm:gap-3">
      {stats.map(({ label, value }) => (
        <div
          key={label}
          className="rounded-2xl bg-card p-3.5 text-center shadow-sm ring-1 ring-zinc-200/60 sm:p-4"
        >
          <p className="text-[11px] text-zinc-500 sm:text-xs">{label}</p>
          <p className="mt-1 text-base font-bold text-foreground sm:text-lg">
            {value}
          </p>
        </div>
      ))}
    </div>
  );
}
