"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Unlock } from "lucide-react";

import {
  bulkLockMemberWithdrawals,
  setMemberWithdrawLock,
  type MemberToolState,
} from "@/lib/actions/member-tools";

import { ConfirmDialog } from "./confirm-dialog";

export const DUPLICATE_IP_LOCK_REASON = "IP registrasi duplikat";

const actionBtn =
  "inline-flex items-center justify-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-60";

const initialState: MemberToolState = {};

export function QuickWithdrawLockButton({
  memberId,
  username,
  isLocked,
}: {
  memberId: string;
  username: string;
  isLocked: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [state, setState] = useState<MemberToolState>(initialState);

  function submitLock(lock: boolean) {
    const fd = new FormData();
    fd.set("memberId", memberId);
    fd.set("lock", lock ? "true" : "false");
    if (lock) fd.set("reason", DUPLICATE_IP_LOCK_REASON);

    startTransition(async () => {
      const result = await setMemberWithdrawLock(state, fd);
      setState(result);
      if (result.success) {
        setConfirmOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setState(initialState);
          setConfirmOpen(true);
        }}
        disabled={pending}
        className={
          isLocked
            ? `${actionBtn} bg-emerald-100 text-emerald-700 hover:bg-emerald-200`
            : `${actionBtn} bg-rose-100 text-rose-700 hover:bg-rose-200`
        }
      >
        {pending ? (
          <Loader2 className="size-3 animate-spin" />
        ) : isLocked ? (
          <Unlock className="size-3" />
        ) : (
          <Lock className="size-3" />
        )}
        {isLocked ? "Buka" : "Kunci"}
      </button>

      <ConfirmDialog
        open={confirmOpen}
        title={isLocked ? "Buka Kunci Penarikan" : "Kunci Penarikan"}
        description={
          isLocked ? (
            <>
              Anda akan membuka kembali penarikan untuk anggota{" "}
              <span className="font-semibold text-zinc-900">@{username}</span>.
            </>
          ) : (
            <>
              Anda akan mengunci penarikan untuk anggota{" "}
              <span className="font-semibold text-zinc-900">@{username}</span>.
              Tindakan ini akan dicatat di log audit.
            </>
          )
        }
        confirmLabel={isLocked ? "Ya, Buka" : "Ya, Kunci"}
        pending={pending}
        error={state.error}
        onCancel={() => {
          if (!pending) setConfirmOpen(false);
        }}
        onConfirm={() => submitLock(!isLocked)}
      >
        {!isLocked && (
          <div className="mb-3 rounded-md bg-zinc-50 px-3 py-2 text-[11px] sm:text-xs">
            <span className="block text-zinc-500">Alasan:</span>
            <p className="mt-0.5 text-zinc-900">{DUPLICATE_IP_LOCK_REASON}</p>
          </div>
        )}
      </ConfirmDialog>
    </>
  );
}

export function BulkLockDuplicateButton({
  memberIds,
  label = "Kunci Duplikat",
}: {
  memberIds: string[];
  label?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [state, setState] = useState<MemberToolState>(initialState);

  if (memberIds.length === 0) return null;

  function handleConfirm() {
    const fd = new FormData();
    fd.set("memberIds", JSON.stringify(memberIds));
    fd.set("reason", DUPLICATE_IP_LOCK_REASON);

    startTransition(async () => {
      const result = await bulkLockMemberWithdrawals(state, fd);
      setState(result);
      if (result.success) {
        setConfirmOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setState(initialState);
          setConfirmOpen(true);
        }}
        disabled={pending}
        className="inline-flex items-center justify-center gap-1.5 rounded-md bg-rose-600 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60 sm:text-xs"
      >
        {pending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Lock className="size-3.5" />
        )}
        {label}
      </button>

      <ConfirmDialog
        open={confirmOpen}
        title="Kunci Akun Duplikat"
        description={
          <>
            Anda akan mengunci penarikan untuk{" "}
            <span className="font-semibold text-zinc-900">
              {memberIds.length} akun duplikat
            </span>
            . Akun tertua di IP ini tidak akan dikunci.
          </>
        }
        confirmLabel={`Ya, Kunci ${memberIds.length} Akun`}
        pending={pending}
        error={state.error}
        onCancel={() => {
          if (!pending) setConfirmOpen(false);
        }}
        onConfirm={handleConfirm}
      >
        <div className="mb-3 rounded-md bg-zinc-50 px-3 py-2 text-[11px] sm:text-xs">
          <span className="block text-zinc-500">Alasan:</span>
          <p className="mt-0.5 text-zinc-900">{DUPLICATE_IP_LOCK_REASON}</p>
        </div>
      </ConfirmDialog>
    </>
  );
}
