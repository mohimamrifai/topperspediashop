"use client";

import Link from "next/link";
import Image from "next/image";
import { useActionState } from "react";

import { signIn, type AuthState } from "@/lib/actions/auth";

const initialState: AuthState = {};

const inputClass =
  "w-full rounded-xl border border-input-border bg-card px-4 py-2 text-sm text-foreground outline-none transition placeholder:text-placeholder focus:border-brand focus:ring-2 focus:ring-brand/20 sm:px-5 sm:py-3 sm:text-base";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(signIn, initialState);

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-6 sm:py-12">
      <form
        action={formAction}
        className="w-full max-w-sm rounded-2xl bg-card p-5 shadow-sm sm:max-w-md sm:p-9"
      >
        <div className="mb-5 flex justify-center sm:mb-8">
          <Image
            src="/logo.webp"
            alt="TopperspediaShop"
            width={88}
            height={88}
            priority
            className="sm:hidden"
          />
          <Image
            src="/logo.webp"
            alt="TopperspediaShop"
            width={112}
            height={112}
            priority
            className="hidden sm:block"
          />
        </div>

        <div className="space-y-2.5 sm:space-y-4">
          <div>
            <input
              type="text"
              name="username"
              placeholder="Nama Pengguna"
              autoComplete="username"
              className={inputClass}
              required
            />
            {state.fieldErrors?.username?.[0] && (
              <p className="mt-1 text-xs text-rose-600">
                {state.fieldErrors.username[0]}
              </p>
            )}
          </div>
          <div>
            <input
              type="password"
              name="password"
              placeholder="Kata Sandi"
              autoComplete="current-password"
              className={inputClass}
              required
            />
            {state.fieldErrors?.password?.[0] && (
              <p className="mt-1 text-xs text-rose-600">
                {state.fieldErrors.password[0]}
              </p>
            )}
          </div>
        </div>

        {state.error && (
          <p className="mt-3 text-center text-xs font-medium text-rose-600 sm:mt-4 sm:text-sm">
            {state.error}
          </p>
        )}

        <div className="mt-4 space-y-2 sm:mt-6 sm:space-y-3">
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground transition hover:brightness-95 active:brightness-90 disabled:opacity-60 sm:px-5 sm:py-3 sm:text-base sm:font-bold"
          >
            {isPending ? "Memproses..." : "Masuk"}
          </button>
          <Link
            href="/register"
            className="block w-full rounded-xl border-2 border-brand bg-card px-4 py-2 text-center text-sm font-semibold text-brand transition hover:bg-brand/5 active:bg-brand/10 sm:px-5 sm:py-3 sm:text-base sm:font-bold"
          >
            Daftar sekarang
          </Link>
        </div>
      </form>
    </div>
  );
}
