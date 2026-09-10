import { User } from "lucide-react";

type Props = {
  name: string;
  tier: string;
  score: number;
  status: string;
};

export function ProfileHeader({ name, tier, score, status }: Props) {
  return (
    <div className="relative overflow-hidden rounded-b-3xl bg-brand text-white">
      <div className="absolute -top-12 -right-10 size-44 rounded-full bg-emerald-700/40" />
      <div className="absolute -top-6 right-32 size-20 rounded-full bg-emerald-700/30" />
      <div className="absolute -bottom-20 right-1/3 size-40 rounded-full bg-emerald-700/35" />
      <div className="absolute -bottom-10 -right-6 size-28 rounded-full bg-emerald-700/30" />

      <div className="relative mx-auto max-w-2xl px-5 pt-6 pb-16 sm:px-6 sm:pt-8 sm:pb-20">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex size-12 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/30 sm:size-14">
            <User className="size-6 text-white sm:size-7" strokeWidth={1.8} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-lg font-semibold sm:text-xl">
                {name}
              </h1>
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase ring-1 ring-white/25 sm:text-xs">
                {tier}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-white/85 sm:text-sm">
              Skor Kredit | {score} • {status}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
