import { useActionState, useEffect, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/app/_components/toast";
import { PasswordInput } from "../../../_components/password-input";
import {
    type ChangePasswordState,
} from "@/lib/actions/change-password";

const inputClass =
    "w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm";

const labelClass =
    "mb-1 block text-xs font-semibold text-zinc-900 sm:text-sm";

const primaryBtn =
    "mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-60 sm:py-3 sm:text-sm";

const initialState: ChangePasswordState = {};

function FieldError({ errs }: { errs?: string[] }) {
    if (!errs || errs.length === 0) return null;
    return <p className="mt-1 text-xs text-rose-600 sm:text-sm">{errs[0]}</p>;
}


export default function ChangeForm({
    action,
    minLength,
    currentLabel,
    newLabel,
    confirmLabel,
    helpText,
}: {
    action: (
        prev: ChangePasswordState,
        formData: FormData,
    ) => Promise<ChangePasswordState>;
    minLength: number;
    currentLabel: string;
    newLabel: string;
    confirmLabel: string;
    helpText: string;
}) {
    const [state, formAction] = useActionState(action, initialState);
    const [pending, startTransition] = useTransition();
    const { show } = useToast();

    useEffect(() => {
        if (state.success && state.message) {
            show(state.message, "success");
        } else if (state.error) {
            show(state.error, "error");
        }
    }, [state, show]);

    return (
        <form
            action={(fd) => startTransition(() => formAction(fd))}
            className="mx-auto max-w-2xl space-y-3 px-4 pt-8 pb-5 sm:px-6 sm:pt-10 sm:pb-6"
        >
            <p className="text-[11px] text-zinc-500 sm:text-xs">{helpText}</p>

            <div>
                <label htmlFor="current-password" className={labelClass}>
                    {currentLabel}
                </label>
                <PasswordInput
                    id="current-password"
                    name="currentPassword"
                    required
                    className={inputClass}
                    disabled={pending}
                    autoComplete="current-password"
                />
                <FieldError errs={state.fieldErrors?.currentPassword} />
            </div>

            <div>
                <label htmlFor="new-password" className={labelClass}>
                    {newLabel}
                </label>
                <PasswordInput
                    id="new-password"
                    name="newPassword"
                    required
                    minLength={minLength}
                    maxLength={72}
                    className={inputClass}
                    disabled={pending}
                    autoComplete="new-password"
                />
                <FieldError errs={state.fieldErrors?.newPassword} />
            </div>

            <div>
                <label htmlFor="confirm-password" className={labelClass}>
                    {confirmLabel}
                </label>
                <PasswordInput
                    id="confirm-password"
                    name="confirmPassword"
                    required
                    minLength={minLength}
                    maxLength={72}
                    className={inputClass}
                    disabled={pending}
                    autoComplete="new-password"
                />
                <FieldError errs={state.fieldErrors?.confirmPassword} />
            </div>

            {state.error && (
                <p className="text-xs font-medium text-rose-600 sm:text-sm">
                    {state.error}
                </p>
            )}

            <button type="submit" disabled={pending} className={primaryBtn}>
                {pending && <Loader2 className="size-4 animate-spin" />}
                {pending ? "Menyimpan..." : "Kirimkan"}
            </button>
        </form>
    );
}