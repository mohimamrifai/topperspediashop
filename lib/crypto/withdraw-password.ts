import "server-only";

import bcrypt from "bcryptjs";

/**
 * Cost factor untuk bcrypt. 10 = ~100ms hash di hardware modern — cukup
 * untuk verifikasi sandi penarikan yang frekuensinya rendah.
 */
const BCRYPT_COST = 10;

/**
 * Hash plaintext sandi penarikan menjadi bcrypt hash string.
 * Format output: `$2a$10$...` (standar bcrypt).
 *
 * @example
 *   const hash = await hashWithdrawPassword("123456");
 *   await db.update(profiles).set({ withdrawPasswordHash: hash })...
 */
export function hashWithdrawPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, BCRYPT_COST);
}

/**
 * Verifikasi plaintext sandi penarikan terhadap hash bcrypt yang tersimpan
 * di `profiles.withdraw_password_hash`. Menggunakan `bcrypt.compare` yang
 * constant-time — aman dari timing attack.
 *
 * @returns `true` jika cocok, `false` jika tidak cocok atau hash kosong.
 */
export async function verifyWithdrawPassword(
  plaintext: string,
  hash: string | null | undefined,
): Promise<boolean> {
  if (!hash) return false;
  return bcrypt.compare(plaintext, hash);
}
