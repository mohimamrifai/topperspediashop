"use client";

import { useState } from "react";
import ChangeForm from "./change-form";
import {
  changeLoginPassword,
  changeWithdrawPassword,
} from "@/lib/actions/change-password";


const tabBtnClass = (active: boolean) =>
  `relative flex-1 px-2 py-3 text-center text-xs font-medium transition sm:py-3.5 sm:text-sm ${
    active ? "text-emerald-600" : "text-zinc-500 hover:text-zinc-700"
  }`;

type TabKey = "login" | "withdraw";

const TABS: { key: TabKey; label: string }[] = [
  { key: "login", label: "Kata sandi masuk" },
  { key: "withdraw", label: "Kata Sandi Penarikan" },
];


export function ChangePasswordContent() {
  const [tab, setTab] = useState<TabKey>("login");

  return (
    <>
      <div className="sticky top-[52px] z-20 border-b border-zinc-200 bg-white sm:top-[58px]">
        <div className="mx-auto flex max-w-2xl">
          {TABS.map(({ key, label }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={tabBtnClass(active)}
              >
                {label}
                {active && (
                  <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-emerald-500 sm:inset-x-6" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {tab === "login" ? (
        <ChangeForm
          action={changeLoginPassword}
          minLength={6}
          currentLabel="Kata sandi lama"
          newLabel="Kata sandi baru"
          confirmLabel="Konfirmasi sandi"
          helpText="Digunakan untuk masuk ke aplikasi."
        />
      ) : (
        <ChangeForm
          action={changeWithdrawPassword}
          minLength={6}
          currentLabel="Sandi penarikan lama"
          newLabel="Sandi penarikan baru"
          confirmLabel="Konfirmasi sandi penarikan"
          helpText="Digunakan saat melakukan penarikan saldo."
        />
      )}
    </>
  );
}
