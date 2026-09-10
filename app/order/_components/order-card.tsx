"use client";

import { useState } from "react";
import { Package } from "lucide-react";

import { RatingModal } from "./rating-modal";
import { formatRupiah } from "@/lib/format-rupiah";

type StatusVariant = "blue" | "green" | "yellow" | "rose" | "amber" | "zinc";

const statusClass: Record<StatusVariant, string> = {
  blue: "bg-sky-100 text-sky-700",
  green: "bg-emerald-100 text-emerald-700",
  yellow: "bg-yellow-100 text-yellow-700",
  amber: "bg-amber-100 text-amber-700",
  rose: "bg-rose-100 text-rose-700",
  zinc: "bg-zinc-100 text-zinc-600",
};

type Order = {
  id: number;
  title: string;
  imageUrl: string | null;
  status: string;
  statusLabel: string;
  statusVariant: StatusVariant;
  price: string;
  commission: string;
  canSubmit: boolean;
};

type Props = {
  order: Order;
  onSubmitted: (id: number) => void;
};

export function OrderCard({ order, onSubmitted }: Props) {
  const [showRating, setShowRating] = useState(false);

  return (
    <article className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-zinc-200/60">
      <div className="flex items-start gap-3 p-3 sm:gap-4 sm:p-4">
        <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-100 sm:size-20">
          {order.imageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={order.imageUrl}
              alt={order.title}
              className="size-full object-cover"
            />
          ) : (
            <Package className="size-6 text-zinc-300 sm:size-8" strokeWidth={1.5} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-xs font-medium leading-snug text-foreground sm:text-sm">
            {order.title}
          </p>
          <span
            className={`mt-2 inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold sm:text-[11px] ${statusClass[order.statusVariant]}`}
          >
            {order.statusLabel}
          </span>
        </div>
      </div>

      <div className="border-t border-zinc-100 px-3 py-2.5 sm:px-4 sm:py-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-zinc-500 sm:text-sm">Harga Produk</span>
          <span className="text-sm font-semibold text-foreground sm:text-base">
            {formatRupiah(order.price)}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="text-xs text-zinc-500 sm:text-sm">Komisi</span>
          <span className="text-sm font-semibold text-foreground sm:text-base">
            {formatRupiah(order.commission)}
          </span>
        </div>
      </div>

      {order.canSubmit && (
        <div className="flex justify-end border-t border-zinc-100 px-3 py-2.5 sm:px-4 sm:py-3">
          <button
            type="button"
            onClick={() => setShowRating(true)}
            className="rounded-full bg-brand px-4 py-1.5 text-xs font-semibold text-white transition hover:brightness-95 active:brightness-90 sm:px-5 sm:py-2 sm:text-sm"
          >
            Kirimkan
          </button>
        </div>
      )}

      {showRating && (
        <RatingModal
          taskId={order.id}
          productName={order.title}
          commission={formatRupiah(order.commission)}
          onClose={() => setShowRating(false)}
          onCompleted={() => {
            onSubmitted(order.id);
            setShowRating(false);
          }}
        />
      )}
    </article>
  );
}
