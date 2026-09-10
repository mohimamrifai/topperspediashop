import { Loader2 } from "lucide-react";
import { useActionState, useTransition } from "react";
import { Account, initialState } from "./deposit-bank-table";
import { toggleDepositBankAccountActive } from "@/lib/actions/deposit-bank-accounts";

export default function ToggleActiveButton({ account }: { account: Account }) {
  const [, action] = useActionState(
    toggleDepositBankAccountActive,
    initialState,
  );
  const [pending, startTransition] = useTransition();

  function onToggle() {
    const fd = new FormData();
    fd.set("accountId", String(account.id));
    fd.set("isActive", String(!account.isActive));
    startTransition(() => action(fd));
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={pending}
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold transition disabled:opacity-50 sm:text-[11px] ${
        account.isActive
          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
          : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300"
      }`}
    >
      {pending && <Loader2 className="size-3 animate-spin" />}
      {account.isActive ? "Aktif" : "Non-aktif"}
    </button>
  );
}
