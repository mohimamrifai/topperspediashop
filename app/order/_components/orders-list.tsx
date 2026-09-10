"use client";

import { OrderCard } from "./order-card";

type Order = {
  id: number;
  title: string;
  imageUrl: string | null;
  status: string;
  statusLabel: string;
  statusVariant: "blue" | "green" | "yellow" | "rose" | "amber" | "zinc";
  price: string;
  commission: string;
  canSubmit: boolean;
};

export function OrdersList({ initialOrders }: { initialOrders: Order[] }) {
  if (initialOrders.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center text-xs text-zinc-500 shadow-sm ring-1 ring-zinc-200/60 sm:text-sm">
        Belum ada tugas.
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {initialOrders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          onSubmitted={() => {}}
        />
      ))}
    </div>
  );
}
