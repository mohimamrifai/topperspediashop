import { desc } from "drizzle-orm";

import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";

import { ProductsTable } from "./_components/products-table";

export default async function AdminProductPage() {
  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      imageUrl: products.imageUrl,
      price: products.price,
      isActive: products.isActive,
    })
    .from(products)
    .orderBy(desc(products.createdAt));

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-4 sm:space-y-5 sm:py-5">
      <ProductsTable
        initialProducts={rows.map((r) => ({
          id: r.id,
          name: r.name,
          imageUrl: r.imageUrl,
          price: r.price,
          isActive: r.isActive,
        }))}
      />
    </div>
  );
}
