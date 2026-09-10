"use client";

import { useActionState, useState } from "react";
import { AlertOctagon, Landmark, Lock, ShieldCheck } from "lucide-react";
import Link from "next/link";

import {
  submitWithdrawal,
  type WithdrawState,
} from "@/lib/actions/withdrawals";
import { formatRupiah } from "@/lib/format-rupiah";
import { MIN_WITHDRAWAL_AMOUNT } from "@/lib/constants/withdrawal";

const inputClass =
  "w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm";

const labelClass = "text-xs font-semibold text-emerald-700 sm:text-sm";

const initialState: WithdrawState = {};

type Bank = {
  id: number;
  bankName: string;
  accountName: string;
  accountNumber: string;
  isPrimary: boolean;
};

type Props = {
  username: string;
  balance: string;
  frozenBalance: string;
  banks: Bank[];
  isWithdrawLocked: boolean;
  withdrawLockReason: string | null;
};

export function WithdrawContent({
  username,
  balance,
  frozenBalance,
  banks,
  isWithdrawLocked,
  withdrawLockReason,
}: Props) {
  const [state, formAction, isPending] = useActionState(
    submitWithdrawal,
    initialState,
  );
  const [amount, setAmount] = useState("");
  const [bankId, setBankId] = useState<string>(
    banks.find((b) => b.isPrimary)?.id?.toString() ??
      banks[0]?.id?.toString() ??
      "",
  );

  const balanceNum = Number(balance);
  const balanceBelowMinimum = balanceNum < MIN_WITHDRAWAL_AMOUNT;

  // Alasan pemblokiran baru ditampilkan setelah member mencoba mengirim.
  // State ini otomatis reset tiap mount/unmount (termasuk saat halaman di-reload),
  // sehingga admin yang memperbarui alasan akan terlihat setelah member kembali
  // mencoba mengirim.
  const [showLockReason, setShowLockReason] = useState(false);

  if (state.success) {
    return (
      <div className="space-y-3">
        <div className="overflow-hidden rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-zinc-200/60 sm:p-6">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 sm:size-16">
            <ShieldCheck className="size-7 sm:size-8" strokeWidth={1.8} />
          </div>
          <h2 className="mt-3 text-sm font-bold text-zinc-900 sm:text-base">
            Pengajuan Berhasil Dikirim
          </h2>
          <p className="mt-1 text-xs text-zinc-600 sm:text-sm">
            Penarikan Anda sedang menunggu persetujuan admin. Saldo akan
            ditransfer ke rekening setelah disetujui.
          </p>
          <a
            href="/profil/withdrawlist"
            className="mt-4 inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 sm:text-sm"
          >
            Lihat Riwayat
          </a>
        </div>
      </div>
    );
  }

  if (banks.length === 0) {
    return (
      <div className="space-y-3">
        <div className="rounded-2xl bg-emerald-600 p-4 text-center text-white shadow-sm sm:p-5">
          <p className="text-2xl font-bold tracking-tight sm:text-3xl">
            {formatRupiah(Number(balance))}
          </p>
          <p className="mt-1 text-xs text-white/85 sm:text-sm">Saldo Akun</p>
        </div>
        <div className="overflow-hidden rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-zinc-200/60 sm:p-6">
          <p className="text-sm font-semibold text-zinc-900 sm:text-base">
            Belum ada rekening
          </p>
          <p className="mt-1 text-xs text-zinc-600 sm:text-sm">
            Tambahkan rekening tujuan penarikan terlebih dahulu.
          </p>
          <Link
            href="/bank"
            className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-md bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 sm:text-sm"
          >
            <Landmark className="size-4" />
            Tambah Rekening
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-emerald-600 p-4 text-center text-white shadow-sm sm:p-5">
        <p className="text-2xl font-bold tracking-tight sm:text-3xl">
          {formatRupiah(Number(balance))}
        </p>
        <p className="mt-1 text-xs text-white/85 sm:text-sm">Saldo Akun</p>
        {Number(frozenBalance) > 0 && (
          <p className="mt-1 text-[11px] text-white/75 sm:text-xs">
            (Dicairkan: {formatRupiah(Number(frozenBalance))})
          </p>
        )}
      </div>

      {isWithdrawLocked && showLockReason && withdrawLockReason && (
        <div className="flex items-start gap-2.5 rounded-2xl bg-rose-50 px-4 py-3 ring-1 ring-rose-200/70 sm:gap-3 sm:px-5 sm:py-4">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600 sm:size-9">
            <AlertOctagon className="size-4 sm:size-5" strokeWidth={1.8} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="space-y-0.5 text-[11px] text-rose-900/90 sm:text-xs">
              <p className="font-semibold text-rose-700">Alasan:</p>
              <p className="whitespace-pre-line text-rose-900">
                {withdrawLockReason}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200/60">
        <div className="border-l-4 border-l-emerald-500 px-4 py-2.5 sm:px-5 sm:py-3">
          <h2 className="text-xs font-bold text-zinc-900 sm:text-sm">
            Informasi Akun
          </h2>
        </div>
        <div className="space-y-1 px-4 py-3.5 text-xs text-zinc-700 sm:px-5 sm:py-4 sm:text-sm">
          <p>
            Username:{" "}
            <span className="font-semibold text-zinc-900">{username}</span>
          </p>
          <p>
            Rekening:{" "}
            <span className="font-semibold text-zinc-900">
              {banks.find((b) => b.id.toString() === bankId)?.bankName} -{" "}
              {banks.find((b) => b.id.toString() === bankId)?.accountNumber}
            </span>
          </p>
        </div>
      </div>

      <form
        action={formAction}
        onSubmit={(e) => {
          // Saat penarikan diblokir, jangan kirim ke server — cukup tampilkan alasan.
          if (isWithdrawLocked) {
            e.preventDefault();
            setShowLockReason(true);
          }
        }}
        className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200/60"
      >
        <div className="border-l-4 border-l-emerald-500 px-4 py-2.5 sm:px-5 sm:py-3">
          <h2 className="text-xs font-bold text-zinc-900 sm:text-sm">
            Jumlah Penarikan
          </h2>
        </div>

        <div className="space-y-3 p-4 sm:space-y-4 sm:p-5">
          {balanceBelowMinimum && (
            <div className="flex items-start gap-2 rounded-md bg-amber-50 px-3 py-2 text-[11px] text-amber-800 ring-1 ring-amber-200/60 sm:text-xs">
              <Lock className="mt-0.5 size-3.5 shrink-0" />
              <div>
                <p className="font-semibold">
                  Saldo belum memenuhi minimal penarikan.
                </p>
                <p className="mt-0.5 text-amber-700/90">
                  Minimal penarikan {formatRupiah(MIN_WITHDRAWAL_AMOUNT)}. Saldo
                  Anda saat ini {formatRupiah(balanceNum)}. Selesaikan lebih
                  banyak tugas untuk menaikkan saldo.
                </p>
              </div>
            </div>
          )}

          <fieldset disabled={balanceBelowMinimum || isPending} className="space-y-3 sm:space-y-4">
            <div>
              <label className={`mb-1 block ${labelClass}`}>
                Rekening Tujuan
              </label>
              <select
                name="bankAccountId"
                value={bankId}
                onChange={(e) => setBankId(e.target.value)}
                className={inputClass}
              >
                {banks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.bankName} - {b.accountNumber} (a.n {b.accountName})
                    {b.isPrimary ? " • Utama" : ""}
                  </option>
                ))}
              </select>
              {state.fieldErrors?.bankAccountId?.[0] && (
                <p className="mt-1 text-xs text-rose-600">
                  {state.fieldErrors.bankAccountId[0]}
                </p>
              )}
            </div>

            <div>
              <label className={`mb-1 block ${labelClass}`}>
                Jumlah Penarikan
              </label>
              <input
                name="amount"
                type="text"
                inputMode="numeric"
                value={amount}
                onChange={(e) =>
                  setAmount(e.target.value.replace(/[^\d]/g, ""))
                }
                placeholder="cth: 150000"
                className={inputClass}
              />
              {state.fieldErrors?.amount?.[0] && (
                <p className="mt-1 text-xs text-rose-600">
                  {state.fieldErrors.amount[0]}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="withdraw-password"
                className={`mb-1 block ${labelClass}`}
              >
                Kata Sandi Penarikan
              </label>
              <input
                id="withdraw-password"
                name="withdrawPassword"
                type="password"
                placeholder="Kata sandi penarikan"
                className={inputClass}
              />
              {state.fieldErrors?.withdrawPassword?.[0] && (
                <p className="mt-1 text-xs text-rose-600">
                  {state.fieldErrors.withdrawPassword[0]}
                </p>
              )}
            </div>

            {state.error && (
              <p className="rounded-md bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 sm:text-sm">
                {state.error}
              </p>
            )}

            <button
              type="submit"
              disabled={isPending || balanceBelowMinimum}
              onClick={() => {
                if (isWithdrawLocked) setShowLockReason(true);
              }}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 active:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 sm:py-3 sm:text-sm"
            >
              <ShieldCheck className="size-4" />
              {isPending ? "Mengirim..." : "Kirimkan"}
            </button>
          </fieldset>
        </div>
      </form>

      <div className="overflow-hidden rounded-2xl bg-emerald-50/70 p-4 ring-1 ring-emerald-200/60 sm:p-5">
        <h3 className="text-xs font-bold text-emerald-700 sm:text-sm">
          Catatan Penting
        </h3>
        <ol className="mt-2 list-decimal space-y-1 pl-4 text-[11px] text-emerald-900 sm:pl-5 sm:text-xs">
          <li>
            Masukkan nominal penarikan dalam angka, tanpa menggunakan tanda
            titik, koma, atau simbol lainnya. Contoh: 150000.
          </li>
          <li>
            <strong>Minimal penarikan {formatRupiah(MIN_WITHDRAWAL_AMOUNT)}.</strong>{" "}
            Jika saldo belum memenuhi, form penarikan akan otomatis terkunci.
          </li>
          <li>
            Gunakan kata sandi penarikan khusus yang telah Anda buat, bukan
            kata sandi login akun.
          </li>
          <li>
            Pastikan informasi rekening bank yang Anda gunakan sudah benar dan
            sesuai.
          </li>
          <li>
            Jika mengalami kendala atau pertanyaan, silakan hubungi layanan
            pelanggan kami untuk mendapatkan bantuan.
          </li>
        </ol>
      </div>
    </div>
  );
}
