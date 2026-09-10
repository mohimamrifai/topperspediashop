/**
 * Konstanta terkait penarikan saldo.
 * Sumber tunggal untuk client & server.
 */

export { formatRupiah } from "@/lib/format-rupiah";

export const MIN_WITHDRAWAL_AMOUNT = 50_000;
export const MAX_WITHDRAWAL_AMOUNT = 100_000_000;

export const WITHDRAWAL_REJECTION_REASONS = [
  "Rekening tidak valid",
  "Nama pemilik rekening tidak sesuai",
  "Aktivitas mencurigakan",
  "Saldo tidak cukup",
] as const;

export type WithdrawalRejectionReason = (typeof WITHDRAWAL_REJECTION_REASONS)[number];
export const OTHER_REASON = "Lainnya";

/**
 * Alasan yang akan otomatis men-ban member (sesuai PRD section "Penarikan
 * — Alasan Reject & Lock Member"). Saat admin reject withdrawal dengan salah
 * satu alasan ini, sistem otomatis `status = 'banned'` di `profiles` untuk
 * member terkait.
 */
export const WITHDRAWAL_AUTO_BAN_REASONS: readonly WithdrawalRejectionReason[] = [
  "Rekening tidak valid",
  "Aktivitas mencurigakan",
];
