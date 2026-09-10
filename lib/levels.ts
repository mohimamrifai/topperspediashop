/**
 * Level configuration — multiplier komisi & threshold auto-level.
 * Dipakai oleh server action (lib/actions/tasks-admin.ts) dan bisa juga
 * diimpor dari client component untuk menampilkan label/rate.
 */

import { db } from "@/lib/db";
import { commissionSettings } from "@/lib/db/schema";

export const LEVEL_MULTIPLIER = {
  classic: 1.0,
  silver: 1.25,
  gold: 1.5,
  platinum: 1.75,
  diamond: 2.0,
  premier: 2.5,
} as const;

export type Level = keyof typeof LEVEL_MULTIPLIER;

export const TASK_LEVEL_RANK: Record<Level, number> = {
  classic: 0,
  silver: 1,
  gold: 2,
  platinum: 3,
  diamond: 4,
  premier: 5,
};

export const LEVEL_LABEL: Record<Level, string> = {
  classic: "Classic",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
  diamond: "Diamond",
  premier: "Premier",
};

export const LEVEL_RATE_PERCENT: Record<Level, number> = {
  classic: 20,
  silver: 25,
  gold: 30,
  platinum: 35,
  diamond: 40,
  premier: 50,
};

/**
 * Cache sederhana untuk commission_settings (in-memory, per-process).
 * Di-invalidate via `revalidateCommissionCache()` saat super admin update.
 */
let commissionCache: { value: Record<Level, number>; ts: number } | null = null;
const CACHE_TTL_MS = 60_000; // 1 menit

/**
 * Ambil persentase komisi (0-100) untuk sebuah level.
 * Sumber prioritas:
 *  1. Tabel `commission_settings` (overrideable oleh super admin via /admin/commission/settings).
 *  2. Fallback ke `LEVEL_RATE_PERCENT` (default) jika tabel kosong/error.
 *
 * Hasil di-cache selama 1 menit per-process.
 */
export async function getCommissionRate(level: Level): Promise<number> {
  const fallback = LEVEL_RATE_PERCENT[level] ?? 20;

  // Cek cache
  if (commissionCache && Date.now() - commissionCache.ts < CACHE_TTL_MS) {
    return commissionCache.value[level] ?? fallback;
  }

  try {
    const rows = await db
      .select({ level: commissionSettings.level, percent: commissionSettings.percent })
      .from(commissionSettings);
    const value: Record<Level, number> = { ...LEVEL_RATE_PERCENT };
    for (const r of rows) {
      const lvl = r.level as Level;
      const num = Number(r.percent);
      if (!Number.isNaN(num) && num >= 0 && num <= 100) {
        value[lvl] = num;
      }
    }
    commissionCache = { value, ts: Date.now() };
    return value[level] ?? fallback;
  } catch {
    // DB error / tabel belum ada → fallback
    return fallback;
  }
}

/** Hapus cache (panggil setelah update commission_settings). */
export function revalidateCommissionCache(): void {
  commissionCache = null;
}

/**
 * Auto-level berdasarkan jumlah tugas selesai kumulatif member.
 * Hanya naik; tidak auto-turun.
 */
export function levelFromCompletedTasks(count: number): Level {
  if (count >= 100) return "premier";
  if (count >= 50) return "diamond";
  if (count >= 30) return "platinum";
  if (count >= 15) return "gold";
  if (count >= 5) return "silver";
  return "classic";
}
