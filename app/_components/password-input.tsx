"use client";

import { useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export function PasswordInput({ className = "", ...rest }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        className={`w-full rounded-xl border border-input-border bg-card px-4 py-2 pr-10 text-sm text-foreground outline-none transition placeholder:text-placeholder focus:border-brand focus:ring-2 focus:ring-brand/20 sm:px-5 sm:py-3 sm:pr-12 sm:text-base ${className}`}
        {...rest}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Sembunyikan sandi" : "Tampilkan sandi"}
        aria-pressed={visible}
        className="absolute top-1/2 right-3 -translate-y-1/2 text-placeholder transition hover:text-foreground sm:right-4"
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
