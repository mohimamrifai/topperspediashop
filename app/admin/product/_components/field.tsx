import { inputClass, labelClass } from "./products-table";

export default function Field({
  label,
  name,
  defaultValue,
  placeholder,
  inputMode,
  error,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  inputMode?: "numeric" | "text";
  error?: string;
}) {
  return (
    <label className="block">
      <span className={`mb-1 block ${labelClass}`}>{label}</span>
      <input
        type="text"
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        inputMode={inputMode}
        className={inputClass}
      />
      {error && <span className="mt-1 block text-xs text-rose-600">{error}</span>}
    </label>
  );
}