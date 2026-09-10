import { Loader2 } from "lucide-react";
import { FieldError, initialState, inputClass, primaryBtn, tabBtnClass } from "./edit-member-modal";
import StatusMessage from "./status-message";
import { Member } from "./members-table";
import { useActionState, useEffect, useState, useTransition } from "react";
import { resetMemberLoginPassword, resetMemberWithdrawPassword } from "@/lib/actions/member-tools";

const PASSWORD_TABS = [
  { key: "login", label: "Login" },
  { key: "withdraw", label: "Penarikan" },
] as const;

type PasswordTab = (typeof PASSWORD_TABS)[number]["key"];

export default function PasswordForm({
  member,
  onSaved,
}: {
  member: Member;
  onSaved: (m: Member) => void;
}) {
  const [tab, setTab] = useState<PasswordTab>("login");
  const [loginState, loginAction] = useActionState(resetMemberLoginPassword, initialState);
  const [withdrawState, withdrawAction] = useActionState(
    resetMemberWithdrawPassword,
    initialState,
  );
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (loginState.success || withdrawState.success) {
      onSaved({ ...member });
    }
  }, [loginState.success, withdrawState.success, member, onSaved]);

  const isLogin = tab === "login";
  const state = isLogin ? loginState : withdrawState;
  const action = isLogin ? loginAction : withdrawAction;
  const minLength = isLogin ? 8 : 6;
  const helpText = isLogin
    ? "Digunakan untuk masuk ke aplikasi."
    : "Digunakan saat melakukan penarikan saldo.";

  return (
    <div className="space-y-3">
      <div className="flex gap-1 rounded-lg bg-zinc-100 p-1">
        {PASSWORD_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            disabled={pending}
            className={tabBtnClass(tab === t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <form
        action={(fd) => {
          fd.set("memberId", member.id);
          startTransition(() => action(fd));
        }}
        className="space-y-2"
      >
        <p className="text-[11px] text-zinc-500 sm:text-xs">{helpText}</p>
        <div>
          <label className="mb-1 block text-[11px] font-medium text-zinc-700 sm:text-xs">
            Kata Sandi Baru
          </label>
          <input
            type="password"
            name="newPassword"
            minLength={minLength}
            maxLength={72}
            required
            className={inputClass}
            placeholder={`Minimal ${minLength} karakter`}
            disabled={pending}
            autoComplete="new-password"
          />
          <FieldError errs={state.fieldErrors?.newPassword} />
        </div>
        <StatusMessage state={state} />
        <div className="flex justify-end">
          <button type="submit" disabled={pending} className={primaryBtn}>
            {pending && <Loader2 className="size-3 animate-spin" />}
            Reset {isLogin ? "Login" : "Penarikan"}
          </button>
        </div>
      </form>
    </div>
  );
}
