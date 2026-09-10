import { desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { products, taskRequests, tasks } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

import { OrdersList } from "./_components/orders-list";
import { PageHeader } from "./_components/header";
import { ExistingTaskToast } from "./_components/existing-task-toast";
import { BottomNav } from "../_components/bottom-nav";

const STATUS_LABEL: Record<string, { label: string; variant: "blue" | "green" | "yellow" | "rose" | "amber" | "zinc" }> = {
  menunggu: { label: "Menunggu", variant: "amber" },
  dipilih: { label: "Dipilih", variant: "blue" },
  dikerjakan: { label: "Dikerjakan", variant: "yellow" },
  selesai: { label: "Selesai", variant: "green" },
  dibatalkan: { label: "Dibatalkan", variant: "rose" },
};

export default async function OrderPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="min-h-full bg-zinc-50 pb-28">
        <PageHeader title="Tugas Saya" />
        <div className="mx-auto mt-3 max-w-lg px-4 sm:mt-4 sm:px-6">
          <p className="text-sm text-zinc-600">Silakan login untuk melihat tugas.</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  const rows = await db
    .select({
      id: tasks.id,
      price: tasks.price,
      commission: tasks.commission,
      status: tasks.status,
      productName: products.name,
      imageUrl: products.imageUrl,
    })
    .from(tasks)
    .leftJoin(products, eq(tasks.productId, products.id))
    .where(eq(tasks.memberId, user.id))
    .orderBy(desc(tasks.createdAt));

  const [pendingRequest] = await db
    .select({ id: taskRequests.id })
    .from(taskRequests)
    .where(eq(taskRequests.memberId, user.id))
    .limit(1);

  const orders = rows.map((row) => {
    const meta = STATUS_LABEL[row.status] ?? {
      label: row.status,
      variant: "zinc" as const,
    };

    return {
      id: row.id,
      title: row.productName ?? "(produk dihapus)",
      imageUrl: row.imageUrl,
      status: row.status,
      statusLabel: meta.label,
      statusVariant: meta.variant,
      price: row.price,
      commission: row.commission,
      canSubmit: row.status === "dipilih",
    };
  });

  // Pesan "tidak ada tugas aktif" / "Mohon menunggu..." muncul ketika
  // member tidak punya tugas berstatus dipilih/dikerjakan. Tetap tampil
  // walau di bawahnya ada card tugas selesai/dibatalkan sebagai histori.
  const hasActiveTask = orders.some(
    (o) => o.status === "dipilih" || o.status === "dikerjakan",
  );

  return (
    <div className="min-h-full bg-zinc-50 pb-28">
      <PageHeader title="Tugas Saya" />
      <ExistingTaskToast />

      <div className="mx-auto mt-3 max-w-lg px-4 sm:mt-4 sm:px-6">
        {!hasActiveTask && (
          <p className="mb-3 text-center text-sm text-zinc-600 sm:mb-4">
            {pendingRequest ? (
              <span>
                <span className="block font-bold">Mohon menunggu...</span>
                <span className="block">Sistem sedang menetapkan produk.</span>
              </span>
            ) : (
              "Tidak ada tugas aktif"
            )}
          </p>
        )}

        {orders.length > 0 && <OrdersList initialOrders={orders} />}
      </div>

      <BottomNav />
    </div>
  );
}
