"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserCog, X } from "lucide-react";

import type { MemberReferrerInfo } from "@/lib/member-referrer";

type Props = {
  memberUsername: string;
  referrer: MemberReferrerInfo | null;
};

export function MemberReferrerInfoButton({
  memberUsername,
  referrer,
}: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Lihat staff pendaftar ${memberUsername}`}
        className="inline-flex items-center justify-center gap-1 rounded-md bg-violet-100 px-2.5 py-1 text-xs font-medium text-violet-700 transition hover:bg-violet-200"
      >
        <UserCog className="size-3" />
        Staff
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Staff pendaftar ${memberUsername}`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 p-3 sm:p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white shadow-xl ring-1 ring-zinc-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
              <h2 className="text-sm font-semibold text-zinc-900">
                Staff Pendaftar
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Tutup"
                className="rounded-md p-1 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3 px-4 py-4 text-sm">
              <p className="text-zinc-600">
                Member{" "}
                <span className="font-semibold text-zinc-900">
                  @{memberUsername}
                </span>{" "}
                terdaftar melalui:
              </p>

              {referrer ? (
                <dl className="space-y-2 rounded-lg bg-zinc-50 px-3 py-3 text-xs sm:text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-zinc-500">Admin Staff</dt>
                    <dd className="font-medium text-zinc-900">
                      @{referrer.staffUsername}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-zinc-500">Kode Referral</dt>
                    <dd className="font-mono text-zinc-900">
                      {referrer.referralCode ?? "—"}
                    </dd>
                  </div>
                  {referrer.leaderUsername && (
                    <div className="flex justify-between gap-3">
                      <dt className="text-zinc-500">Admin Leader</dt>
                      <dd className="font-medium text-zinc-900">
                        @{referrer.leaderUsername}
                      </dd>
                    </div>
                  )}
                </dl>
              ) : (
                <p className="rounded-lg bg-amber-50 px-3 py-3 text-xs text-amber-900 sm:text-sm">
                  Tidak terdaftar melalui kode referral Admin Staff, atau data
                  staff sudah tidak ada.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-zinc-200 px-4 py-3">
              {referrer && (
                <Link
                  href={`/admin/staff/${referrer.staffId}`}
                  className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 sm:text-sm"
                  onClick={() => setOpen(false)}
                >
                  Lihat Detail Staff
                </Link>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border border-zinc-200 bg-white px-4 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 sm:text-sm"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
