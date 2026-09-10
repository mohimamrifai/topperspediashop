"use client";

import { useMemo, useState } from "react";
import { Package, Plus } from "lucide-react";
import { formatRupiah } from "@/lib/format-rupiah";

import {
  type ProductState,
} from "@/lib/actions/products";

import { Pagination } from "./pagination";
import DeleteButton from "./delete-button";
import ProductFormModal from "./product-form-modal";

export type Product = {
  id: number;
  name: string;
  imageUrl: string | null;
  price: string;
  isActive: boolean;
};

const ITEMS_PER_PAGE = 6;
export const inputClass =
  "w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:text-sm";
export const labelClass = "text-xs font-semibold text-zinc-900 sm:text-sm";
export const initialState: ProductState = {};

export function ProductsTable({
  initialProducts,
}: {
  initialProducts: Product[];
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return initialProducts;
    return initialProducts.filter((p) => p.name.toLowerCase().includes(q));
  }, [initialProducts, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginated = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  function handleQueryChange(value: string) {
    setQuery(value);
    setPage(1);
  }

  return (
    <>
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200/60">
        <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center justify-center gap-1.5 self-start rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700 active:bg-indigo-800 sm:text-sm"
          >
            <Plus className="size-4" />
            Tambah Produk
          </button>
          <input
            type="text"
            placeholder="Cari produk..."
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            className={`${inputClass} sm:w-64`}
          />
        </div>

        <div className="border-t border-zinc-200">
          <table className="w-full border-collapse">
            <thead className="bg-zinc-100">
              <tr>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-600 sm:px-4 sm:py-3 sm:text-xs">
                  Gambar
                </th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-600 sm:px-4 sm:py-3 sm:text-xs">
                  Nama Produk
                </th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-600 sm:px-4 sm:py-3 sm:text-xs">
                  Harga
                </th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-600 sm:px-4 sm:py-3 sm:text-xs">
                  Status
                </th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-600 sm:px-4 sm:py-3 sm:text-xs">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-8 text-center text-xs text-zinc-500 sm:text-sm"
                  >
                    {initialProducts.length === 0
                      ? "Belum ada produk. Klik \"Tambah Produk\" untuk mulai."
                      : "Tidak ada produk yang cocok."}
                  </td>
                </tr>
              ) : (
                paginated.map((p) => (
                  <tr
                    key={p.id}
                    className="border-t border-zinc-200 transition hover:bg-zinc-50/60"
                  >
                    <td className="px-3 py-2 sm:px-4 sm:py-3">
                      {p.imageUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="h-12 w-12 rounded-md object-cover ring-1 ring-zinc-200/60"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-zinc-100 ring-1 ring-zinc-200/60">
                          <Package className="size-5 text-zinc-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-zinc-700 sm:px-4 sm:py-3 sm:text-sm">
                      {p.name}
                    </td>
                    <td className="px-3 py-2 text-xs font-medium text-zinc-900 sm:px-4 sm:py-3 sm:text-sm">
                      {formatRupiah(p.price)}
                    </td>
                    <td className="px-3 py-2 sm:px-4 sm:py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold sm:text-xs ${p.isActive
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-zinc-100 text-zinc-600"
                          }`}
                      >
                        {p.isActive ? "Aktif" : "Non-aktif"}
                      </span>
                    </td>
                    <td className="px-3 py-2 sm:px-4 sm:py-3">
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => setEditing(p)}
                          className="rounded-md bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-700 transition hover:bg-sky-200"
                        >
                          Edit
                        </button>
                        <DeleteButton
                          id={p.id}
                          onDeleted={() => {}}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col items-center justify-between gap-2 border-t border-zinc-200 p-3 sm:flex-row sm:p-4">
          <span className="text-xs text-zinc-500 sm:text-sm">
            Menampilkan {paginated.length === 0 ? 0 : startIndex + 1}–
            {startIndex + paginated.length} dari {filtered.length} produk
          </span>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </div>

      {creating && (
        <ProductFormModal
          mode="create"
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
          }}
        />
      )}
      {editing && (
        <ProductFormModal
          mode="edit"
          product={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
          }}
        />
      )}
    </>
  );
}
