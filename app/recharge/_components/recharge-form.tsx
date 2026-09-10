"use client";

import { useActionState, useState } from "react";
import { Copy, Landmark, ShieldCheck } from "lucide-react";

import {
  submitDeposit,
  type DepositState,
} from "@/lib/actions/deposits";
import { formatRupiah } from "@/lib/format-rupiah";
import { ImageDropzone } from "@/app/_components/image-dropzone";

type Account = {
  id: number;
  bankName: string;
  accountName: string;
  accountNumber: string;
  notes: string | null;
};

const inputClass =
  "w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm";

const labelClass = "text-xs font-semibold text-zinc-900 sm:text-sm";

const initialState: DepositState = {};

function parseAmount(s: string): number {
  return Number(s.replace(/[^\d]/g, "")) || 0;
}

export function RechargeForm({ accounts }: { accounts: Account[] }) {
  const [state, formAction, isPending] = useActionState(
    submitDeposit,
    initialState,
  );
  const [amountDisplay, setAmountDisplay] = useState("");
  const [accountId, setAccountId] = useState<string>(
    accounts[0]?.id?.toString() ?? "",
  );
  const [copyOk, setCopyOk] = useState(false);

  const activeAccount =
    accounts.find((a) => a.id.toString() === accountId) ?? accounts[0] ?? null;
  const amountValue = parseAmount(amountDisplay);

  function handleCopy() {
    if (!activeAccount) return;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard
        .writeText(activeAccount.accountNumber)
        .then(() => {
          setCopyOk(true);
          setTimeout(() => setCopyOk(false), 1500);
        })
        .catch(() => {});
    }
  }

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
            Isi ulang Anda sedang menunggu persetujuan admin. Saldo akan masuk
            setelah disetujui.
          </p>
          <a
            href="/profil/rechargelist"
            className="mt-4 inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 sm:text-sm"
          >
            Lihat Riwayat
          </a>
        </div>
      </div>
    );
  }

  if (!activeAccount) {
    return (
      <div className="space-y-3">
        <div className="overflow-hidden rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-zinc-200/60 sm:p-6">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-amber-100 text-amber-600 sm:size-16">
            <Landmark className="size-7 sm:size-8" strokeWidth={1.8} />
          </div>
          <h2 className="mt-3 text-sm font-bold text-zinc-900 sm:text-base">
            Rekening Tujuan Belum Tersedia
          </h2>
          <p className="mt-1 text-xs text-zinc-600 sm:text-sm">
            Saat ini belum ada rekening tujuan deposit yang aktif. Silakan
            hubungi admin untuk informasi rekening terbaru.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200/60">
        <div className="flex items-start gap-3 p-4 sm:gap-4 sm:p-5">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 sm:size-14">
            <Landmark className="size-5 sm:size-6" strokeWidth={1.8} />
          </div>
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="text-[10px] font-bold tracking-wider text-emerald-600 sm:text-xs">
              {activeAccount.bankName}
            </p>
            <p className="mt-1 text-lg font-bold tracking-wide text-zinc-900 sm:text-xl">
              {activeAccount.accountNumber}
            </p>
            <p className="mt-0.5 text-[11px] text-zinc-500 sm:text-xs">
              a.n {activeAccount.accountName}
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            aria-label="Salin nomor rekening"
            className="ml-auto inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 transition hover:bg-emerald-100 sm:size-10"
          >
            <Copy className="size-4 sm:size-5" />
          </button>
        </div>
        {accounts.length > 1 && (
          <div className="border-t border-zinc-100 px-4 py-2.5 sm:px-5 sm:py-3">
            <label htmlFor="accountId" className="sr-only">
              Pilih rekening
            </label>
            <select
              id="accountId"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className={inputClass}
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id.toString()}>
                  {a.bankName} - {a.accountNumber} a.n {a.accountName}
                </option>
              ))}
            </select>
          </div>
        )}
        {activeAccount.notes && (
          <p className="border-t border-zinc-100 bg-amber-50 px-4 py-1.5 text-center text-[11px] font-medium text-amber-800 sm:px-5 sm:text-xs">
            {activeAccount.notes}
          </p>
        )}
        {copyOk && (
          <p className="border-t border-zinc-100 bg-emerald-50 px-4 py-1.5 text-center text-[11px] font-medium text-emerald-700 sm:px-5 sm:text-xs">
            Nomor rekening disalin
          </p>
        )}
      </div>

      <form
        action={formAction}
        className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200/60"
      >
        <div className="border-b border-l-4 border-l-emerald-500 border-zinc-200 px-4 py-2.5 sm:px-5 sm:py-3">
          <h2 className="text-xs font-bold text-zinc-900 sm:text-sm">
            Formulir Isi Ulang
          </h2>
        </div>

        <div className="space-y-3 p-4 sm:space-y-4 sm:p-5">
          <div>
            <label
              htmlFor="amount"
              className={`mb-1 block ${labelClass}`}
            >
              Jumlah Isi Ulang
            </label>
            <input
              id="amount"
              name="amount"
              type="text"
              inputMode="numeric"
              placeholder="Minimal Rp 30.000"
              value={amountDisplay}
              onChange={(e) =>
                setAmountDisplay(e.target.value.replace(/[^\d]/g, ""))
              }
              className={inputClass}
            />
            <p className="mt-1 text-[11px] text-zinc-500 sm:text-xs">
              {formatRupiah(amountValue)}
            </p>
            {state.fieldErrors?.amount?.[0] && (
              <p className="mt-1 text-xs text-rose-600">
                {state.fieldErrors.amount[0]}
              </p>
            )}
          </div>

          <div>
            <ImageDropzone
              name="proof"
              label="Upload Bukti Transfer"
              required
              maxSize={5 * 1024 * 1024}
              error={state.fieldErrors?.proof?.[0]}
              helpText="Format JPG/PNG/WEBP, maksimal 5MB."
            />
          </div>

          {state.error && (
            <p className="rounded-md bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 sm:text-sm">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-60 sm:py-3 sm:text-sm"
          >
            <ShieldCheck className="size-4" />
            {isPending ? "Mengirim..." : "Kirimkan"}
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-2xl bg-emerald-50/70 p-4 ring-1 ring-emerald-200/60 sm:p-5">
        <h3 className="text-xs font-bold text-emerald-700 sm:text-sm">
          Panduan Isi Ulang:
        </h3>
        <ol className="mt-2 list-decimal space-y-1 pl-4 text-[11px] text-emerald-900 sm:pl-5 sm:text-xs">
          <li>Lakukan transfer ke rekening yang tertera.</li>
          <li>Masukkan nominal yang sesuai tanpa tanda titik.</li>
          <li>Unggah bukti transfer.</li>
          <li>
            Klik tombol <span className="font-bold">Kirimkan</span> untuk
            memproses isi ulang.
          </li>
          <li>Tunggu beberapa saat hingga isi ulang berhasil.</li>
        </ol>
      </div>
    </div>
  );
}
