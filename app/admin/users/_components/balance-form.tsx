"use client";
import { Loader2 } from "lucide-react";
import StatusMessage from "./status-message";
import { FieldError, initialState, inputClass, primaryBtn } from "./edit-member-modal";
import { Member } from "./members-table";
import { useActionState, useEffect, useTransition } from "react";
import { adjustMemberBalance } from "@/lib/actions/member-tools";

export default function BalanceForm({
  member,
  onSaved,
}: {
  member: Member;
  onSaved: (m: Member) => void;
}) {
  const [state, action] = useActionState(adjustMemberBalance, initialState);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (state.success) {
      onSaved({ ...member });
    }
  }, [state.success, member, onSaved]);

  return (
    <form
      action={(fd) => {
        fd.set("memberId", member.id);
        startTransition(() => action(fd));
      }}
      className="space-y-2"
    >
      <div>
        <label className="mb-1 block text-[11px] font-medium text-zinc-700 sm:text-xs">
          Saldo Saat Ini
        </label>
        <p className="rounded-md bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-900 sm:text-sm">
          Rp {Number(member.balance).toLocaleString("id-ID")}
        </p>
      </div>
      <div>
        <label className="mb-1 block text-[11px] font-medium text-zinc-700 sm:text-xs">
          Nominal (positif = tambah, negatif = kurangi)
        </label>
        <input
          type="number"
          name="amount"
          step="1000"
          required
          className={inputClass}
          placeholder="cth: 50000 atau -20000"
          disabled={pending}
        />
        <FieldError errs={state.fieldErrors?.amount} />
      </div>
      <StatusMessage state={state} />
      <div className="flex justify-end">
        <button type="submit" disabled={pending} className={primaryBtn}>
          {pending && <Loader2 className="size-3 animate-spin" />}
          Sesuaikan Saldo
        </button>
      </div>
    </form>
  );
}
