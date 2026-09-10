import { inputClass, LeaderOption } from "./team-table";

export default function LeaderSelect({
  leaders,
  name,
  defaultValue,
  disabled,
  required,
}: {
  leaders: LeaderOption[];
  name: string;
  defaultValue?: string;
  disabled?: boolean;
  required?: boolean;
}) {
  if (leaders.length === 0) {
    return (
      <div>
        <label
          htmlFor={name}
          className="mb-1 block text-[11px] font-medium text-zinc-700 sm:text-xs"
        >
          Leader <span className="text-rose-600">*</span>
        </label>
        <p className="rounded-md bg-amber-50 px-3 py-2 text-[11px] text-amber-800 sm:text-xs">
          Belum ada Admin Leader. Buat leader terlebih dahulu sebelum menambah staff.
        </p>
        <input type="hidden" name={name} value="" />
      </div>
    );
  }
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-1 block text-[11px] font-medium text-zinc-700 sm:text-xs"
      >
        Leader <span className="text-rose-600">*</span>
      </label>
      <select
        id={name}
        name={name}
        required={required}
        defaultValue={defaultValue ?? ""}
        disabled={disabled}
        className={inputClass}
      >
        <option value="" disabled>
          Pilih leader...
        </option>
        {leaders.map((l) => (
          <option key={l.id} value={l.id}>
            @{l.username}
          </option>
        ))}
      </select>
    </div>
  );
}