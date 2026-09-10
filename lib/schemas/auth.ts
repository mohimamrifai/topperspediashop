import { z } from "zod";

/**
 * Skema bersama untuk form autentikasi.
 * Dipakai di server (lib/actions/auth.ts) dan client (form).
 */

export const loginSchema = z.object({
  username: z.string().trim().min(3, "Nama pengguna minimal 3 karakter."),
  password: z.string().min(6, "Kata sandi minimal 6 karakter."),
});

export const registerSchema = z
  .object({
    kodeUndangan: z
      .string()
      .trim()
      .min(1, "Kode undangan wajib diisi.")
      .max(30, "Kode undangan maksimal 30 karakter."),
    namaPengguna: z
      .string()
      .trim()
      .min(3, "Nama pengguna minimal 3 karakter.")
      .max(30, "Nama pengguna maksimal 30 karakter.")
      .regex(/^[a-zA-Z0-9_]+$/, "Hanya huruf, angka, dan underscore."),
    kataSandi: z.string().min(6, "Kata sandi minimal 6 karakter."),
    konfirmasiSandi: z.string().min(6, "Konfirmasi kata sandi wajib diisi."),
    sandiPenarikan: z.string().min(6, "Sandi penarikan minimal 6 karakter."),
    konfirmasiSandiPenarikan: z
      .string()
      .min(6, "Konfirmasi sandi penarikan wajib diisi."),
  })
  .refine((d) => d.kataSandi === d.konfirmasiSandi, {
    message: "Konfirmasi kata sandi tidak cocok.",
    path: ["konfirmasiSandi"],
  })
  .refine((d) => d.sandiPenarikan === d.konfirmasiSandiPenarikan, {
    message: "Konfirmasi sandi penarikan tidak cocok.",
    path: ["konfirmasiSandiPenarikan"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
