"use client";

import type { Member, MemberLevel } from "./members-table";
import { useActionState, useEffect, useTransition } from "react";
import { updateMemberCreditScore, updateMemberLevel } from "@/lib/actions/member-tools";
import { FieldError, initialState, inputClass, primaryBtn } from "./edit-member-modal";
import { Loader2 } from "lucide-react";

const LEVEL_OPTIONS: { value: MemberLevel; label: string }[] = [
  { value: "classic", label: "Classic" },
  { value: "silver", label: "Silver" },
  { value: "gold", label: "Gold" },
  { value: "platinum", label: "Platinum" },
  { value: "diamond", label: "Diamond" },
  { value: "premier", label: "Premier" },
];

export default function LevelForm({
  member,
  onSaved,
}: {
  member: Member;
  onSaved: (m: Member) => void;
}) {
  const [levelState, levelAction] = useActionState(updateMemberLevel, initialState);
  const [scoreState, scoreAction] = useActionState(updateMemberCreditScore, initialState);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (levelState.success) {
      onSaved({ ...member });
    }
  }, [levelState.success, member, onSaved]);
  useEffect(() => {
    if (scoreState.success) {
      onSaved({ ...member });
    }
  }, [scoreState.success, member, onSaved]);

  return (
    <div className="space-y-3">
      <form
        action={(fd) => {
          fd.set("memberId", member.id);
          startTransition(() => levelAction(fd));
        }}
        className="space-y-2"
      >
        <div>
          <label className="mb-1 block text-[11px] font-medium text-zinc-700 sm:text-xs">
            Level
          </label>
          <select
            name="level"
            defaultValue={member.level}
            className={inputClass}
            disabled={pending}
          >
            {LEVEL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <FieldError errs={levelState.fieldErrors?.level} />
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={pending} className={primaryBtn}>
            {pending && <Loader2 className="size-3 animate-spin" />}
            Simpan Level
          </button>
        </div>
      </form>

      <div className="border-t border-zinc-200 pt-3">
        <form
          action={(fd) => {
            fd.set("memberId", member.id);
            startTransition(() => scoreAction(fd));
          }}
          className="space-y-2"
        >
          <div>
            <label className="mb-1 block text-[11px] font-medium text-zinc-700 sm:text-xs">
              Skor Kredit
            </label>
            <input
              type="number"
              name="creditScore"
              min={0}
              max={1000}
              defaultValue={member.creditScore}
              className={inputClass}
              placeholder="0-1000"
              disabled={pending}
            />
            <FieldError errs={scoreState.fieldErrors?.creditScore} />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={pending} className={primaryBtn}>
              {pending && <Loader2 className="size-3 animate-spin" />}
              Simpan Skor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
