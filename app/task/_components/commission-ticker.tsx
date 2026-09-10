"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

const names = [
  "M**a",
  "B**i",
  "S**i",
  "R**i",
  "A**i",
  "D**a",
  "P**i",
  "T**i",
  "N**i",
  "L**a",
];

function randomAmount() {
  return Math.floor(Math.random() * 250_000 + 30_000).toLocaleString("id-ID");
}

function pickName() {
  return names[Math.floor(Math.random() * names.length)];
}

export function CommissionTicker() {
  const [name, setName] = useState("M**a");
  const [amount, setAmount] = useState("45.346");
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const swap = () => {
      setVisible(false);
      const t = window.setTimeout(() => {
        setName(pickName());
        setAmount(randomAmount());
        setVisible(true);
      }, 250);
      return t;
    };

    const interval = window.setInterval(swap, 3500);
    return () => {
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div className="mt-3 flex items-center gap-3 rounded-2xl bg-amber-50/80 p-3.5 ring-1 ring-amber-200/60 sm:mt-4 sm:gap-4 sm:p-4">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-100 sm:size-10">
        <Sparkles
          className="size-4 text-amber-600 sm:size-5"
          strokeWidth={2}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 sm:text-[11px]">
          Pemberitahuan
        </p>
        <p
          aria-live="polite"
          className={`mt-0.5 text-sm font-medium text-foreground transition-opacity duration-300 sm:text-base ${
            visible ? "opacity-100" : "opacity-0"
          }`}
        >
          {name} menerima komisi{" "}
          <span className="font-bold text-brand">Rp {amount}</span>
        </p>
      </div>
    </div>
  );
}
