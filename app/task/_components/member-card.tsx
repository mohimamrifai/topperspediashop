type Props = {
  title: string;
  subtitle: string;
};

export function MemberCard({ title, subtitle }: Props) {
  return (
    <div className="relative mt-3 overflow-hidden rounded-2xl bg-card p-4 pl-5 shadow-sm ring-1 ring-zinc-200/60 sm:mt-4 sm:p-5 sm:pl-6">
      <div className="absolute inset-y-0 left-0 w-1 bg-brand" />
      <p className="text-sm font-semibold text-foreground sm:text-base">
        {title}
      </p>
      <p className="text-xs text-zinc-500 sm:text-sm">{subtitle}</p>
    </div>
  );
}
