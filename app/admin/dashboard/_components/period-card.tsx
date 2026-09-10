type Variant = "blue" | "red";

const dotClass: Record<Variant, string> = {
  blue: "bg-blue-500",
  red: "bg-rose-500",
};

type Props = {
  title: string;
  amount: string;
  variant: Variant;
};

export function PeriodCard({ title, amount, variant }: Props) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/60 sm:p-5">
      <h3 className="flex items-center gap-2 text-xs font-semibold text-zinc-700 sm:text-sm">
        <span className={`inline-block size-4 rounded ${dotClass[variant]}`} />
        {title}
      </h3>
      <p className="mt-2 text-2xl font-bold text-zinc-900 sm:text-3xl">
        {amount}
      </p>
    </div>
  );
}
