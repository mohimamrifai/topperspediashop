import { inputClass, labelClass } from "./bank-content";

export default function Field({
  label,
  name,
  defaultValue,
  placeholder,
  inputMode,
  error,
}: {
  label: React.ReactNode;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  inputMode?: "numeric" | "tel" | "text";
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
      {error && (
        <span className="mt-1 block text-xs text-rose-600">{error}</span>
      )}
    </label>
  );
}