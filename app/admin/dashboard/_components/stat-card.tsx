type Variant = "indigo" | "amber" | "emerald" | "blue" | "rose";

const valueClass: Record<Variant, string> = {
  indigo: "text-indigo-600",
  amber: "text-amber-600",
  emerald: "text-emerald-600",
  blue: "text-blue-600",
  rose: "text-rose-600",
};

type Props = {
  label: string;
  value: string;
  variant: Variant;
};

export function StatCard({ label, value, variant }: Props) {
  return (
    <div className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-zinc-200/60 sm:p-4">
      <p className="text-[11px] font-medium text-zinc-500 sm:text-xs">
        {label}
      </p>
      <p
        className={`mt-1 text-lg font-bold sm:text-2xl ${valueClass[variant]}`}
      >
        {value}
      </p>
    </div>
  );
}
