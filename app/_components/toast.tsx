"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, Info, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type ToastVariant = "success" | "info" | "error";

type Toast = {
  id: number;
  message: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  show: (message: string, variant?: ToastVariant) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const variantIcon: Record<ToastVariant, LucideIcon> = {
  success: CheckCircle2,
  info: Info,
  error: XCircle,
};

const variantClass: Record<ToastVariant, string> = {
  success: "border-emerald-200 bg-white text-emerald-700",
  info: "border-zinc-200 bg-white text-zinc-900",
  error: "border-rose-200 bg-white text-rose-700",
};

const iconClass: Record<ToastVariant, string> = {
  success: "text-emerald-600",
  info: "text-zinc-600",
  error: "text-rose-600",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const show = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      const id = ++idRef.current;
      setToasts((cur) => [...cur, { id, message, variant }]);
    },
    [],
  );

  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((t) =>
      window.setTimeout(() => {
        setToasts((cur) => cur.filter((x) => x.id !== t.id));
      }, 3000),
    );
    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [toasts]);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-3 sm:top-6"
      >
        {toasts.map((t) => {
          const Icon = variantIcon[t.variant];
          return (
            <div
              key={t.id}
              role="status"
              className={`pointer-events-auto flex max-w-sm items-center gap-2 rounded-full border px-4 py-2 shadow-lg ring-1 ring-zinc-900/5 ${variantClass[t.variant]}`}
            >
              <Icon className={`size-4 shrink-0 ${iconClass[t.variant]}`} />
              <span className="text-xs font-medium sm:text-sm">{t.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast harus dipakai di dalam <ToastProvider />");
  }
  return ctx;
}
