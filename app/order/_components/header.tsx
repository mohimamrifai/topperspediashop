type Props = {
  title: string;
};

export function PageHeader({ title }: Props) {
  return (
    <div className="bg-brand text-white">
      <div className="mx-auto max-w-2xl px-4 py-3.5 text-center sm:py-4">
        <h1 className="text-base font-semibold sm:text-lg">{title}</h1>
      </div>
    </div>
  );
}
