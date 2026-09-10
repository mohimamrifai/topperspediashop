type Action = {
  label: string;
  href: string;
};

type Props = {
  actions: Action[];
};

export function SecondaryActions({ actions }: Props) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-2.5 sm:mt-4 sm:gap-3">
      {actions.map(({ label, href }) => (
        <a
          key={label}
          href={href}
          className="rounded-2xl bg-card px-3 py-3.5 text-center text-sm font-semibold text-foreground shadow-sm ring-1 ring-zinc-200/60 transition hover:bg-zinc-50 sm:py-4 sm:text-base"
        >
          {label}
        </a>
      ))}
    </div>
  );
}
