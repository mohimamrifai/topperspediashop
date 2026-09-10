"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import {
  signUp,
  type AuthState,
} from "@/lib/actions/auth";
import { useZodForm } from "@/lib/forms";
import { registerSchema, type RegisterInput } from "@/lib/schemas/auth";
import { FormField } from "../_components/form-field";
import { PasswordInput } from "../_components/password-input";

const initialState: AuthState = {};

const inputClass =
  "w-full rounded-xl border border-input-border bg-card px-4 py-2 text-sm text-foreground outline-none transition placeholder:text-placeholder focus:border-brand focus:ring-2 focus:ring-brand/20 sm:px-5 sm:py-3 sm:text-base";

export default function RegisterPage() {
  const [state, setState] = useState<AuthState>(initialState);
  const [isPending, startTransition] = useTransition();

  const form = useZodForm({
    schema: registerSchema,
    serverState: state,
    defaultValues: {
      kodeUndangan: "",
      namaPengguna: "",
      kataSandi: "",
      konfirmasiSandi: "",
      sandiPenarikan: "",
      konfirmasiSandiPenarikan: "",
    },
  });

  function onValid(values: RegisterInput) {
    const fd = new FormData();
    for (const [k, v] of Object.entries(values)) {
      fd.append(k, v);
    }
    startTransition(async () => {
      try {
        const result = await signUp(state, fd);
        setState(result ?? {});
      } catch (err) {
        setState({
          error:
            err instanceof Error
              ? err.message
              : "Terjadi kesalahan tak terduga. Silakan coba lagi.",
        });
      }
    });
  }

  const { errors } = form.formState;
  // Tampilkan error apa pun yang dikirim server, selama string dan tidak kosong.
  const topError =
    typeof state.error === "string" && state.error.trim().length > 0
      ? state.error.trim()
      : null;

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-6 sm:py-12">
      <form
        onSubmit={form.handleSubmit(onValid)}
        className="w-full max-w-sm rounded-2xl bg-card p-5 shadow-sm sm:max-w-lg sm:p-9"
        noValidate
      >
        <h1 className="mb-5 text-center text-2xl font-bold text-brand sm:mb-7 sm:text-3xl">
          Daftar Akun
        </h1>

        <div className="space-y-2.5 sm:space-y-4">
          <FormField name="kodeUndangan" error={errors.kodeUndangan}>
            {(props) => (
              <input
                {...props}
                {...form.register("kodeUndangan")}
                type="text"
                placeholder="Kode Undangan"
                autoComplete="off"
                className={inputClass}
              />
            )}
          </FormField>

          <FormField name="namaPengguna" error={errors.namaPengguna}>
            {(props) => (
              <input
                {...props}
                {...form.register("namaPengguna")}
                type="text"
                placeholder="Nama Pengguna"
                autoComplete="username"
                className={inputClass}
              />
            )}
          </FormField>

          <FormField name="kataSandi" error={errors.kataSandi}>
            {(props) => (
              <PasswordInput
                {...props}
                {...form.register("kataSandi")}
                placeholder="Kata Sandi"
                autoComplete="new-password"
              />
            )}
          </FormField>

          <FormField name="konfirmasiSandi" error={errors.konfirmasiSandi}>
            {(props) => (
              <PasswordInput
                {...props}
                {...form.register("konfirmasiSandi")}
                placeholder="Konfirmasi Sandi"
                autoComplete="new-password"
              />
            )}
          </FormField>

          <FormField name="sandiPenarikan" error={errors.sandiPenarikan}>
            {(props) => (
              <PasswordInput
                {...props}
                {...form.register("sandiPenarikan")}
                placeholder="Sandi Penarikan"
                autoComplete="off"
              />
            )}
          </FormField>

          <FormField
            name="konfirmasiSandiPenarikan"
            error={errors.konfirmasiSandiPenarikan}
          >
            {(props) => (
              <PasswordInput
                {...props}
                {...form.register("konfirmasiSandiPenarikan")}
                placeholder="Konfirmasi Sandi Penarikan"
                autoComplete="off"
              />
            )}
          </FormField>
        </div>

        {topError ? (
          <p className="mt-3 text-center text-xs font-medium text-rose-600 sm:mt-4 sm:text-sm">
            {topError}
          </p>
        ) : null}

        <div className="mt-5 sm:mt-7">
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground transition hover:brightness-95 active:brightness-90 disabled:opacity-60 sm:px-5 sm:py-3 sm:text-base sm:font-bold"
          >
            {isPending ? "Memproses..." : "Daftar Sekarang"}
          </button>
        </div>

        <p className="mt-3 text-center text-sm text-brand sm:mt-4 sm:text-base">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-semibold hover:underline">
            Masuk
          </Link>
        </p>
      </form>
    </div>
  );
}
