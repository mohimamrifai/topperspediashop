"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef } from "react";
import {
  useForm,
  type FieldValues,
  type Path,
  type UseFormProps,
  type UseFormReturn,
} from "react-hook-form";
import type { z } from "zod";

/**
 * State shape yang dipakai bersama oleh server actions.
 */
export type ServerState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
  success?: boolean;
  message?: string;
};

// Bypass generic zod 3 vs 4 mismatch dengan er casting ke
// z.ZodType<FieldValues, FieldValues>. Ini cukup untuk kasus kita
// (semua schema kita adalah z.object(...))
type AnyZodSchema = z.ZodType<FieldValues, FieldValues>;

type InferSchema<T extends AnyZodSchema> = T extends z.ZodType<infer U>
  ? U
  : never;

export type UseZodFormOptions<T extends AnyZodSchema> = {
  schema: T;
  defaultValues?: UseFormProps<InferSchema<T>>["defaultValues"];
  serverState?: ServerState;
  mode?: UseFormProps<InferSchema<T>>["mode"];
};

export function useZodForm<T extends AnyZodSchema>(
  opts: UseZodFormOptions<T>,
): UseFormReturn<InferSchema<T>> {
  const form = useForm<InferSchema<T>>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(opts.schema as any) as any,
    defaultValues: opts.defaultValues,
    mode: opts.mode ?? "onTouched",
  });

  const lastServerState = useRef<ServerState | undefined>(undefined);

  useEffect(() => {
    const state = opts.serverState;
    if (!state?.fieldErrors) return;
    if (lastServerState.current === state) return;
    lastServerState.current = state;

    const keys = Object.keys(state.fieldErrors);
    if (keys.length === 0) return;

    for (const name of keys) {
      const errs = state.fieldErrors[name];
      if (errs && errs[0]) {
        form.setError(name as Path<InferSchema<T>>, {
          type: "server",
          message: errs[0],
        });
      }
    }
    const firstError = keys[0];
    if (firstError) {
      form.setFocus(firstError as Path<InferSchema<T>>);
    }
  }, [opts.serverState, form]);

  return form;
}
