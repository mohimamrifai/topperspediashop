/**
 * Format angka sebagai mata uang Rupiah: "Rp 2.352.727".
 *
 * Single source of truth untuk format Rupiah di seluruh app.
 * Handles `number`, numeric `string`, `null`, `undefined`, dan empty string.
 *
 * @example
 *   formatRupiah(2_352_727)        // "Rp 2.352.727"
 *   formatRupiah("50000")          // "Rp 50.000"
 *   formatRupiah(null)             // "Rp -"
 *   formatRupiah(0)                // "Rp 0"
 *   formatRupiah(NaN)              // "Rp -"
 *
 * @param value - Nilai yang akan diformat
 * @param options.placeholder - Placeholder untuk null/undefined/empty/non-finite (default "Rp -")
 * @returns String berformat "Rp X.XXX.XXX" (atau placeholder)
 */
export function formatRupiah(
  value: number | string | null | undefined,
  options: { placeholder?: string } = {},
): string {
  const placeholder = options.placeholder ?? "Rp -";

  if (value === null || value === undefined || value === "") {
    return placeholder;
  }

  const num = typeof value === "string" ? Number(value) : value;

  if (!Number.isFinite(num)) {
    return placeholder;
  }

  return `Rp ${num.toLocaleString("id-ID")}`;
}

/**
 * Format angka dengan pemisah ribuan (titik) tanpa prefix "Rp".
 *
 * Berguna untuk menampilkan nilai numerik di dalam <input> yang menerima
 * digit-only (mis. filter min/max harga), di mana kita ingin user melihat
 * "50.000" bukan "Rp 50.000".
 *
 * @example
 *   formatThousands(50000)      // "50.000"
 *   formatThousands("50000")    // "50.000"
 *   formatThousands("")         // ""
 *   formatThousands(null)       // ""
 *   formatThousands(NaN)        // ""
 *
 * @param value - Nilai yang akan diformat
 * @returns String berformat "XX.XXX" atau string kosong untuk input kosong/non-finite
 */
export function formatThousands(
  value: number | string | null | undefined,
): string {
  if (value === null || value === undefined || value === "") return "";

  const num = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(num)) return "";

  return num.toLocaleString("id-ID");
}

/**
 * Parse string menjadi digit-only. Memungkinkan user menempel string apapun
 * (mis. "Rp 50.000", "50,000", " 50k ") dan kita tetap dapat angka bersih.
 *
 * @example
 *   parseThousands("50.000")    // "50000"
 *   parseThousands("Rp 50.000") // "50000"
 *   parseThousands("50,000")    // "50000"
 *   parseThousands("")          // ""
 *
 * @param value - String input dari user
 * @returns String berisi hanya karakter digit
 */
export function parseThousands(value: string): string {
  return value.replace(/\D/g, "");
}
