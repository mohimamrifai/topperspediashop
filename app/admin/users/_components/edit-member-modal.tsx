"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

import {
  type MemberToolState,
} from "@/lib/actions/member-tools";

import type { Member } from "./members-table";
import LevelForm from "./level-form";
import BalanceForm from "./balance-form";
import WithdrawStatusForm from "./withdraw-status-form";
import PasswordForm from "./password-form";

const TABS = [
  { key: "level", label: "Level & Skor" },
  { key: "saldo", label: "Edit Saldo" },
  { key: "penarikan", label: "Status Penarikan" },
  { key: "password", label: "Password" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export const initialState: MemberToolState = {};

export const inputClass =
  "w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:text-sm";

export const tabBtnClass = (active: boolean) =>
  `flex-1 rounded-md px-2 py-1.5 text-[11px] font-semibold transition sm:text-xs ${
    active
      ? "bg-white text-indigo-700 shadow-sm"
      : "text-zinc-600 hover:text-zinc-900"
  }`;

export const primaryBtn =
  "inline-flex items-center justify-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50 sm:text-sm";

export const secondaryBtn =
  "rounded-md border border-zinc-200 bg-white px-4 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 sm:text-sm";

export function ErrorMsg({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-[11px] text-rose-600 sm:text-xs">{msg}</p>;
}

export function FieldError({ errs }: { errs?: string[] }) {
  if (!errs || errs.length === 0) return null;
  return <ErrorMsg msg={errs[0]} />;
}

type Props = {
  member: Member;
  onClose: () => void;
  onSaved: (member: Member) => void;
};

export function EditMemberModal({ member, onClose, onSaved }: Props) {
  const [tab, setTab] = useState<TabKey>("level");

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Edit anggota ${member.username}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between sm:mb-4">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 sm:text-base">
              Tools Anggota
            </h2>
            <p className="mt-0.5 text-[11px] text-zinc-500 sm:text-xs">
              @{member.username}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="rounded-md p-1 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mb-3 flex gap-1 rounded-lg bg-zinc-100 p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={tabBtnClass(tab === t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {tab === "level" && <LevelForm member={member} onSaved={onSaved} />}
          {tab === "saldo" && <BalanceForm member={member} onSaved={onSaved} />}
          {tab === "penarikan" && <WithdrawStatusForm member={member} onSaved={onSaved} />}
          {tab === "password" && <PasswordForm member={member} onSaved={onSaved} />}
        </div>

        <div className="mt-4 flex justify-end border-t border-zinc-200 pt-3">
          <button type="button" onClick={onClose} className={secondaryBtn}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
