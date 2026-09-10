"use client";

import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

type Props = React.InputHTMLAttributes<HTMLInputElement>;

export const PasswordInput = forwardRef<HTMLInputElement, Props>(
  function PasswordInput({ className = "", ...rest }, ref) {
    const [shown, setShown] = useState(false);
    return (
      <div className="relative">
        <input
          ref={ref}
          {...rest}
          type={shown ? "text" : "password"}
          className={`pr-10 ${className}`}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={shown ? "Sembunyikan sandi" : "Tampilkan sandi"}
          onClick={() => setShown((s) => !s)}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-zinc-500 transition hover:text-zinc-900"
        >
          {shown ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    );
  },
);
