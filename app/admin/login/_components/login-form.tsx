"use client";

import { useActionState, useMemo } from "react";

import { adminSignIn, type AuthState } from "@/lib/actions/auth";

const initialState: AuthState = {};

const DAY_NAMES = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
] as const;

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
] as const;

function formatTanggal(d: Date): string {
  const day = DAY_NAMES[d.getDay()];
  const date = d.getDate();
  const month = MONTH_NAMES[d.getMonth()];
  const year = d.getFullYear();
  return `${day}, ${date} ${month} ${year}`;
}

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    adminSignIn,
    initialState,
  );

  // Tanggal dihitung ulang setiap render agar selalu mengikuti hari ini
  // (otomatis berubah tiap hari tanpa rebuild/deploy).
  const todayLabel = useMemo(() => formatTanggal(new Date()), []);

  return (
    <div className="relative w-full max-w-sm rounded-xl border-2 border-cyan-400/70 bg-zinc-900/80 p-5 shadow-[0_0_30px_rgba(34,211,238,0.35),inset_0_0_30px_rgba(34,211,238,0.08)] backdrop-blur-sm sm:p-7">
      <h1
        className="mb-5 text-center text-2xl font-bold text-cyan-400 sm:mb-6 sm:text-3xl"
        style={{
          textShadow:
            "0 0 10px rgba(34,211,238,0.85), 0 0 22px rgba(34,211,238,0.5)",
        }}
      >
        Selamat datang!
      </h1>

      <form action={formAction} className="space-y-2.5 sm:space-y-3">
        <input
          type="text"
          name="username"
          placeholder="Username Admin"
          autoComplete="username"
          className="w-full rounded-md border-2 border-cyan-400/60 bg-zinc-900/50 px-4 py-2 text-sm text-cyan-100 outline-none transition placeholder:text-cyan-100/40 hover:border-cyan-400 focus:border-cyan-400 focus:shadow-[0_0_12px_rgba(34,211,238,0.45)] sm:py-2.5 sm:text-base"
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          autoComplete="current-password"
          className="w-full rounded-md border-2 border-cyan-400/60 bg-zinc-900/50 px-4 py-2 text-sm text-cyan-100 outline-none transition placeholder:text-cyan-100/40 hover:border-cyan-400 focus:border-cyan-400 focus:shadow-[0_0_12px_rgba(34,211,238,0.45)] sm:py-2.5 sm:text-base"
          required
        />
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-md bg-cyan-400 px-4 py-2 text-sm font-bold text-zinc-900 transition hover:bg-cyan-300 hover:shadow-[0_0_18px_rgba(34,211,238,0.55)] active:bg-cyan-500 disabled:opacity-60 sm:py-2.5 sm:text-base"
        >
          {isPending ? "Memproses..." : "Login"}
        </button>
      </form>

      {state.error && (
        <p className="mt-3 text-center text-xs font-medium text-rose-400 sm:text-sm">
          {state.error}
        </p>
      )}

      <div className="mt-5 rounded-lg border border-cyan-400/40 bg-zinc-900/60 p-3.5 sm:mt-6 sm:p-4">
        <h2 className="text-sm font-bold text-cyan-400 underline underline-offset-2 sm:text-base">
          {todayLabel.split(",")[0]} - Eksekusi
        </h2>
        <p className="mt-0.5 text-[11px] text-cyan-100/55 sm:text-xs">
          {todayLabel}
        </p>
        <p className="mt-2 text-[11px] leading-relaxed text-cyan-100/80 sm:text-xs">
          Rencana tanpa tindakan tidak berarti. Hari ini adalah tentang
          menyelesaikan pekerjaan satu per satu.
        </p>
      </div>
    </div>
  );
}
