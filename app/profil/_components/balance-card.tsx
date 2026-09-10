type Props = {
  label: string;
  amount: string;
};

export function BalanceCard({ label, amount }: Props) {
  return (
    <div className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-zinc-200/60 sm:p-6">
      <p className="text-xs font-medium text-zinc-500 sm:text-sm">{label}</p>
      <p className="mt-1.5 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        {amount}
      </p>
    </div>
  );
}
