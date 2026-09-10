import Link from "next/link";
import { and, asc, desc, eq, gte, ilike, lte, sql } from "drizzle-orm";
import { ArrowLeft, ChevronLeft, ChevronRight, Package } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { getScope } from "@/lib/access";
import { getCurrentProfile } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { products, profiles, taskRequests } from "@/lib/db/schema";
import { formatRupiah } from "@/lib/format-rupiah";

import { FilterBar } from "./_components/filter-bar";
import { SelectProductForm } from "./_components/select-product-form";

const PAGE_SIZE = 50;

type SortKey = "price_asc" | "price_desc";

function isSortKey(v: string | undefined): v is SortKey {
  return v === "price_asc" || v === "price_desc";
}

export default async function AssignProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ taskId: string }>;
  searchParams: Promise<{
    q?: string;
    inactive?: string;
    sort?: string;
    min?: string;
    max?: string;
    page?: string;
  }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role === "member") redirect("/admin/login");

  const { taskId: taskIdRaw } = await params;
  const taskId = Number(taskIdRaw);
  if (!Number.isFinite(taskId) || taskId <= 0) notFound();

  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const includeInactive = sp.inactive === "1";
  const sort: SortKey = isSortKey(sp.sort) ? sp.sort : "price_asc";
  const minPrice = (sp.min ?? "").trim();
  const maxPrice = (sp.max ?? "").trim();
  const minNum = minPrice ? Number(minPrice) : null;
  const maxNum = maxPrice ? Number(maxPrice) : null;
  const page = Math.max(1, Number(sp.page) || 1);

  // Ambil request + member, validasi scope
  const [requestRow] = await db
    .select({
      id: taskRequests.id,
      memberId: taskRequests.memberId,
      memberUsername: profiles.username,
      memberLevel: profiles.level,
      memberStatus: profiles.status,
      memberBalance: profiles.balance,
      createdAt: taskRequests.createdAt,
    })
    .from(taskRequests)
    .leftJoin(profiles, eq(taskRequests.memberId, profiles.id))
    .where(eq(taskRequests.id, taskId))
    .limit(1);

  if (!requestRow) notFound();

  // Validasi scope admin
  const scope = await getScope(profile.id);
  if (scope) {
    const memberIds = scope.memberIds;
    const unrestricted = scope.unrestricted;
    if (!unrestricted) {
      if (!memberIds || !memberIds.includes(requestRow.memberId)) {
        notFound();
      }
    }
  }

  // Susun filter dan sort untuk products
  const filters = [];
  if (!includeInactive) {
    filters.push(eq(products.isActive, true));
  }
  if (q) {
    filters.push(ilike(products.name, `%${q}%`));
  }
  if (minNum !== null && Number.isFinite(minNum) && minNum >= 0) {
    filters.push(gte(products.price, String(minNum)));
  }
  if (maxNum !== null && Number.isFinite(maxNum) && maxNum >= 0) {
    filters.push(lte(products.price, String(maxNum)));
  }
  const where = filters.length > 0 ? and(...filters) : undefined;
  const orderBy = sort === "price_asc" ? asc(products.price) : desc(products.price);

  // Hitung total (untuk pagination)
  const totalCountQuery = db
    .select({ count: sql<number>`count(*)::int` })
    .from(products)
    .where(where ?? sql`TRUE`);
  const [totalRow] = await totalCountQuery;
  const totalCount = totalRow?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const offset = (currentPage - 1) * PAGE_SIZE;

  // Ambil products (satu query)
  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      price: products.price,
      imageUrl: products.imageUrl,
      isActive: products.isActive,
    })
    .from(products)
    .where(where ?? sql`TRUE`)
    .orderBy(orderBy, desc(products.id))
    .limit(PAGE_SIZE)
    .offset(offset);

  // Build URL helper untuk filter & pagination
  function buildHref(overrides: Partial<{
    q: string;
    inactive: string;
    sort: SortKey;
    min: string;
    max: string;
    page: number;
  }>) {
    const params = new URLSearchParams();
    const nextQ = overrides.q !== undefined ? overrides.q : q;
    const nextInactive =
      overrides.inactive !== undefined ? overrides.inactive : includeInactive ? "1" : "";
    const nextSort = overrides.sort !== undefined ? overrides.sort : sort;
    const nextMin = overrides.min !== undefined ? overrides.min : minPrice;
    const nextMax = overrides.max !== undefined ? overrides.max : maxPrice;
    const nextPage = overrides.page !== undefined ? overrides.page : currentPage;
    if (nextQ) params.set("q", nextQ);
    if (nextInactive) params.set("inactive", nextInactive);
    if (nextSort !== "price_asc") params.set("sort", nextSort);
    if (nextMin) params.set("min", nextMin);
    if (nextMax) params.set("max", nextMax);
    if (nextPage > 1) params.set("page", String(nextPage));
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  }

  const prevHref = currentPage > 1 ? buildHref({ page: currentPage - 1 }) : null;
  const nextHref = currentPage < totalPages ? buildHref({ page: currentPage + 1 }) : null;

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-4 sm:space-y-5 sm:py-5">
      {/* Header */}
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/60 sm:p-5">
        <div className="flex items-start gap-3">
          <Link
            href="/admin/task"
            className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
            aria-label="Kembali"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-bold text-zinc-900 sm:text-base">
              Pilih Produk untuk Request #{requestRow.id}
            </h1>
            <p className="mt-1 text-[11px] text-zinc-500 sm:text-xs">
              Untuk anggota{" "}
              <span className="font-semibold text-zinc-700">
                @{requestRow.memberUsername ?? "(user dihapus)"}
              </span>{" "}
              · Diajukan{" "}
              {new Intl.DateTimeFormat("id-ID", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }).format(requestRow.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Filter bar (auto-apply, tanpa tombol Terapkan) */}
      <FilterBar
        defaults={{
          q,
          min: minPrice,
          max: maxPrice,
          inactive: includeInactive,
          sort,
        }}
        totalCount={totalCount}
      />

      {/* Tabel produk */}
      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200/60">
        <table className="w-full min-w-[640px] border-collapse">
          <thead className="bg-zinc-100">
            <tr>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-600 sm:px-4 sm:py-3 sm:text-xs">
                #
              </th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-600 sm:px-4 sm:py-3 sm:text-xs">
                Produk
              </th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-600 sm:px-4 sm:py-3 sm:text-xs">
                Harga
              </th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-600 sm:px-4 sm:py-3 sm:text-xs">
                Status
              </th>
              <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-zinc-600 sm:px-4 sm:py-3 sm:text-xs">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-10 text-center text-xs text-zinc-500 sm:text-sm"
                >
                  {totalCount === 0
                    ? "Belum ada produk."
                    : "Tidak ada produk yang cocok."}
                </td>
              </tr>
            ) : (
              rows.map((p, i) => (
                <tr
                  key={p.id}
                  className="group border-t border-zinc-200 transition hover:bg-zinc-50/60"
                >
                  <td className="px-3 py-2 text-xs text-zinc-500 sm:px-4 sm:py-3 sm:text-sm">
                    {offset + i + 1}
                  </td>
                  <td className="px-3 py-2 sm:px-4 sm:py-3">
                    <div className="flex items-center gap-2.5">
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.imageUrl}
                          alt=""
                          className="size-10 shrink-0 rounded object-cover ring-1 ring-zinc-200 sm:size-11"
                        />
                      ) : (
                        <div className="flex size-10 shrink-0 items-center justify-center rounded bg-zinc-100 text-[10px] font-semibold text-zinc-400 ring-1 ring-zinc-200 sm:size-11">
                          <Package className="size-4" strokeWidth={1.5} />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="truncate text-xs font-medium text-zinc-900 sm:text-sm">
                          {p.name}
                        </div>
                        <div className="text-[10px] text-zinc-500 sm:text-[11px]">
                          ID: {p.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-xs font-semibold text-emerald-600 sm:px-4 sm:py-3 sm:text-sm">
                    {formatRupiah(p.price)}
                  </td>
                  <td className="px-3 py-2 sm:px-4 sm:py-3">
                    {p.isActive ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 sm:text-xs">
                        Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-zinc-200 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 sm:text-xs">
                        Non-aktif
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right sm:px-4 sm:py-3">
                    <SelectProductForm
                      taskId={requestRow.id}
                      productId={p.id}
                      disabled={!p.isActive}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col items-center justify-between gap-2 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-zinc-200/60 sm:flex-row sm:p-4">
          <span className="text-xs text-zinc-500 sm:text-sm">
            Halaman {currentPage} dari {totalPages}
          </span>
          <div className="flex items-center gap-1">
            {prevHref ? (
              <Link
                href={`/admin/task/${requestRow.id}/assign${prevHref}`}
                className="inline-flex h-8 min-w-8 items-center justify-center gap-1 rounded-md border border-zinc-200 bg-white px-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
              >
                <ChevronLeft className="size-3.5" />
                Sebelumnya
              </Link>
            ) : (
              <span className="inline-flex h-8 min-w-8 cursor-not-allowed items-center justify-center gap-1 rounded-md border border-zinc-200 bg-zinc-50 px-2 text-xs font-medium text-zinc-400">
                <ChevronLeft className="size-3.5" />
                Sebelumnya
              </span>
            )}
            {nextHref ? (
              <Link
                href={`/admin/task/${requestRow.id}/assign${nextHref}`}
                className="inline-flex h-8 min-w-8 items-center justify-center gap-1 rounded-md border border-zinc-200 bg-white px-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
              >
                Berikutnya
                <ChevronRight className="size-3.5" />
              </Link>
            ) : (
              <span className="inline-flex h-8 min-w-8 cursor-not-allowed items-center justify-center gap-1 rounded-md border border-zinc-200 bg-zinc-50 px-2 text-xs font-medium text-zinc-400">
                Berikutnya
                <ChevronRight className="size-3.5" />
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
