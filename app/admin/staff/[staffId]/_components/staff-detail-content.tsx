"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowLeft, UserCog } from "lucide-react";

import type { StaffDetailStats } from "@/lib/team";
import { formatRupiah } from "@/lib/format-rupiah";

type Staff = {
  id: string;
  username: string;
  referralCode: string | null;
  status: string;
  createdAt: string;
  leaderUsername: string | null;
};

const inputClass =
  "w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:text-sm";

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));
}

function formatMonth(monthIso: string): string {
  // monthIso: "YYYY-MM-01"
  const d = new Date(monthIso);
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(d);
}

export function StaffDetailContent({
  staff,
  stats,
  initialFrom,
  initialTo,
}: {
  staff: Staff;
  stats: StaffDetailStats;
  initialFrom: string;
  initialTo: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);

  function applyFilter() {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    startTransition(() => {
      router.push(`/admin/staff/${staff.id}?${params.toString()}`);
    });
  }

  function resetFilter() {
    setFrom("");
    setTo("");
    startTransition(() => {
      router.push(`/admin/staff/${staff.id}`);
    });
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => router.push("/admin/staff")}
          className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 shadow-sm ring-1 ring-zinc-200/60 transition hover:bg-zinc-50 sm:text-sm"
        >
          <ArrowLeft className="size-3" />
          Kembali
        </button>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/60 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-600 sm:size-12">
            <UserCog className="size-5 sm:size-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-bold text-zinc-900 sm:text-lg">
              @{staff.username}
            </h1>
            <p className="mt-0.5 text-[11px] text-zinc-600 sm:text-xs">
              Referral:{" "}
              <span className="font-mono">{staff.referralCode ?? "—"}</span>
              {staff.leaderUsername ? (
                <>
                  {" • Leader: "}
                  <span className="font-medium">@{staff.leaderUsername}</span>
                </>
              ) : null}
              {" • Terdaftar: "}
              {formatDate(staff.createdAt)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
        <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-zinc-200/60 sm:p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500 sm:text-xs">
            Total Member
          </p>
          <p className="mt-1 text-xl font-bold text-zinc-900 sm:text-2xl">
            {stats.totalMembers.toLocaleString("id-ID")}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-zinc-200/60 sm:p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600 sm:text-xs">
            Deposit Disetujui
          </p>
          <p className="mt-1 text-xl font-bold text-emerald-700 sm:text-2xl">
            {formatRupiah(stats.totalDepositApproved)}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-zinc-200/60 sm:p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-rose-600 sm:text-xs">
            Penarikan Selesai
          </p>
          <p className="mt-1 text-xl font-bold text-rose-700 sm:text-2xl">
            {formatRupiah(stats.totalWithdrawalCompleted)}
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-zinc-200/60 sm:p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label
              htmlFor="from"
              className="mb-1 block text-[11px] font-medium text-zinc-700 sm:text-xs"
            >
              Dari
            </label>
            <input
              id="from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex-1">
            <label
              htmlFor="to"
              className="mb-1 block text-[11px] font-medium text-zinc-700 sm:text-xs"
            >
              Sampai
            </label>
            <input
              id="to"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={applyFilter}
              disabled={pending}
              className="rounded-md bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50 sm:text-sm"
            >
              Terapkan
            </button>
            <button
              type="button"
              onClick={resetFilter}
              disabled={pending}
              className="rounded-md bg-zinc-100 px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-200 disabled:opacity-50 sm:text-sm"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-zinc-200/60 sm:p-4">
        <h2 className="text-xs font-bold text-zinc-900 sm:text-sm">
          Rincian Per Bulan
        </h2>
        <p className="mt-0.5 text-[11px] text-zinc-500 sm:text-xs">
          Statistik per bulan untuk staff ini.
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse">
            <thead className="bg-zinc-100">
              <tr>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-600 sm:px-4 sm:py-3 sm:text-xs">
                  Bulan
                </th>
                <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-zinc-600 sm:px-4 sm:py-3 sm:text-xs">
                  Member Baru
                </th>
                <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-emerald-600 sm:px-4 sm:py-3 sm:text-xs">
                  Deposit (jumlah)
                </th>
                <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-emerald-600 sm:px-4 sm:py-3 sm:text-xs">
                  Deposit (total)
                </th>
                <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-rose-600 sm:px-4 sm:py-3 sm:text-xs">
                  Penarikan (jumlah)
                </th>
                <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-rose-600 sm:px-4 sm:py-3 sm:text-xs">
                  Penarikan (total)
                </th>
              </tr>
            </thead>
            <tbody>
              {stats.monthly.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-6 text-center text-xs text-zinc-500 sm:text-sm"
                  >
                    Tidak ada data dalam rentang waktu ini.
                  </td>
                </tr>
              ) : (
                stats.monthly.map((m) => (
                  <tr
                    key={m.month}
                    className="border-t border-zinc-200 transition hover:bg-zinc-50/60"
                  >
                    <td className="px-3 py-2 text-xs font-medium text-zinc-900 sm:px-4 sm:py-3 sm:text-sm">
                      {formatMonth(m.month)}
                    </td>
                    <td className="px-3 py-2 text-right text-xs text-zinc-700 sm:px-4 sm:py-3 sm:text-sm">
                      {m.newMemberCount}
                    </td>
                    <td className="px-3 py-2 text-right text-xs text-zinc-700 sm:px-4 sm:py-3 sm:text-sm">
                      {m.depositCount}
                    </td>
                    <td className="px-3 py-2 text-right text-xs font-medium text-emerald-700 sm:px-4 sm:py-3 sm:text-sm">
                      {formatRupiah(m.depositAmount)}
                    </td>
                    <td className="px-3 py-2 text-right text-xs text-zinc-700 sm:px-4 sm:py-3 sm:text-sm">
                      {m.withdrawalCount}
                    </td>
                    <td className="px-3 py-2 text-right text-xs font-medium text-rose-700 sm:px-4 sm:py-3 sm:text-sm">
                      {formatRupiah(m.withdrawalAmount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
