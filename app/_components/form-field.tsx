"use client";

import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import type { FieldError } from "react-hook-form";

type Props = {
  name: string;
  label?: string;
  error?: FieldError | string;
  children: (props: InputHTMLAttributes<HTMLInputElement>) => ReactNode;
  className?: string;
};

function errorMessage(error: FieldError | string | undefined): string | null {
  if (!error) return null;
  if (typeof error === "string") return error;
  return error.message ?? null;
}

/**
 * Generic field wrapper: label + input (atau komponen apapun) + error message.
 *
 * Pakai:
 *   <FormField name="username" label="Username" error={errors.username}>
 *     {(props) => <input {...props} type="text" />}
 *   </FormField>
 */
export function FormField({ name, label, error, children, className }: Props) {
  const msg = errorMessage(error);
  const inputProps: InputHTMLAttributes<HTMLInputElement> = {
    name,
    "aria-invalid": Boolean(msg) || undefined,
    "aria-describedby": msg ? `${name}-error` : undefined,
  };
  return (
    <div className={className}>
      {label ? (
        <label
          htmlFor={name}
          className="mb-1 block text-[11px] font-medium text-zinc-700 sm:text-xs"
        >
          {label}
        </label>
      ) : null}
      {children(inputProps)}
      {msg ? (
        <p
          id={`${name}-error`}
          role="alert"
          className="mt-1 text-[11px] text-rose-600 sm:text-xs"
        >
          {msg}
        </p>
      ) : null}
    </div>
  );
}

type TextAreaProps = {
  name: string;
  label?: string;
  error?: FieldError | string;
  rows?: number;
  placeholder?: string;
  className?: string;
};

const textareaClass =
  "w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:text-sm";

export const FormTextarea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  function FormTextarea(
    { name, label, error, rows = 3, placeholder, className },
    ref,
  ) {
    const msg = errorMessage(error);
    return (
      <div className={className}>
        {label ? (
          <label
            htmlFor={name}
            className="mb-1 block text-[11px] font-medium text-zinc-700 sm:text-xs"
          >
            {label}
          </label>
        ) : null}
        <textarea
          ref={ref}
          id={name}
          name={name}
          rows={rows}
          placeholder={placeholder}
          aria-invalid={Boolean(msg) || undefined}
          aria-describedby={msg ? `${name}-error` : undefined}
          className={textareaClass}
        />
        {msg ? (
          <p
            id={`${name}-error`}
            role="alert"
            className="mt-1 text-[11px] text-rose-600 sm:text-xs"
          >
            {msg}
          </p>
        ) : null}
      </div>
    );
  },
);
