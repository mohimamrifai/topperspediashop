import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { bankAccounts, withdrawals } from "@/lib/db/schema";
import { formatRupiah } from "@/lib/format-rupiah";
import { getCurrentUser } from "@/lib/auth/session";

import { BottomNav } from "../../_components/bottom-nav";

const STATUS_LABEL: Record<string, string> = {
  pending: "Menunggu",
  completed: "Selesai",
  rejected: "Ditolak",
};

const STATUS_CLASS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
};

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export default async function WithdrawHistoryPage() {
  const user = await getCurrentUser();

  const rows = user
    ? await db
        .select({
          id: withdrawals.id,
          amount: withdrawals.amount,
          status: withdrawals.status,
          notes: withdrawals.notes,
          createdAt: withdrawals.createdAt,
          bankName: bankAccounts.bankName,
          accountNumber: bankAccounts.accountNumber,
        })
        .from(withdrawals)
        .leftJoin(
          bankAccounts,
          eq(withdrawals.bankAccountId, bankAccounts.id),
        )
        .where(eq(withdrawals.memberId, user.id))
        .orderBy(desc(withdrawals.createdAt))
    : [];

  return (
    <div className="min-h-full bg-zinc-50 pb-24">
      <header className="sticky top-0 z-30 bg-emerald-600 text-white shadow-sm">
        <div className="relative mx-auto flex max-w-2xl items-center px-4 py-3 sm:px-6 sm:py-3.5">
          <Link
            href="/profil"
            aria-label="Kembali"
            className="absolute left-4 inline-flex items-center justify-center text-white transition hover:text-white/80 sm:left-6"
          >
            <ArrowLeft className="size-4 sm:size-5" />
          </Link>
          <h1 className="mx-auto text-sm font-bold sm:text-base">
            Riwayat Penarikan
          </h1>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-4 sm:px-6 sm:py-5">
        {rows.length === 0 ? (
          <p className="py-8 text-center text-xs text-zinc-500 sm:py-12 sm:text-sm">
            Belum ada riwayat penarikan.
          </p>
        ) : (
          <ul className="space-y-2">
            {rows.map((r) => (
              <li
                key={r.id}
                className="overflow-hidden rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/60 sm:p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-bold text-zinc-900 sm:text-lg">
                      {formatRupiah(r.amount)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-zinc-500 sm:text-xs">
                      {formatDate(r.createdAt)}
                    </p>
                    {r.bankName && (
                      <p className="mt-0.5 text-[11px] text-zinc-600 sm:text-xs">
                        {r.bankName} - {r.accountNumber}
                      </p>
                    )}
                    {r.notes && (
                      <p className="mt-1 text-[11px] text-zinc-600 sm:text-xs">
                        Catatan: {r.notes}
                      </p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold sm:text-xs ${
                      STATUS_CLASS[r.status] ?? "bg-zinc-100 text-zinc-700"
                    }`}
                  >
                    {STATUS_LABEL[r.status] ?? r.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
