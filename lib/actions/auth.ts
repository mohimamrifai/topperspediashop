"use server";

import { eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { hashWithdrawPassword } from "@/lib/crypto/withdraw-password";
import { db } from "@/lib/db";
import { profiles, user as authUsers } from "@/lib/db/schema";
import { getClientIp } from "@/lib/request-ip";
import { registerSchema, loginSchema } from "@/lib/schemas/auth";

export type AuthState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
};

function syntheticEmail(username: string) {
  return `${username.toLowerCase()}@topperspediashop.app`;
}

async function updateMemberLastSeenIp(userId: string) {
  const clientIp = getClientIp(await headers());
  if (!clientIp) return;

  await db
    .update(profiles)
    .set({ lastSeenIp: clientIp, updatedAt: new Date() })
    .where(eq(profiles.id, userId));
}

/**
 * Sign in pakai Better Auth signInUsername (username plugin).
 * nextCookies plugin di lib/auth.ts auto-forward Set-Cookie ke Next.js.
 */
export async function signIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  // Sign out dulu agar tidak bentrok dengan sesi lama
  try {
    await auth.api.signOut({ headers: await headers() });
  } catch {
    // No active session — aman untuk lanjut
  }

  let result;
  try {
    result = await auth.api.signInUsername({
      body: { username: parsed.data.username, password: parsed.data.password },
      headers: await headers(),
    });
  } catch {
    return { error: "Nama pengguna atau kata sandi salah." };
  }

  if (!result || !("user" in result) || !result.user) {
    return { error: "Nama pengguna atau kata sandi salah." };
  }

  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, result.user.id))
    .limit(1);

  if (profile?.role && profile.role !== "member") {
    redirect("/admin/dashboard");
  }

  await updateMemberLastSeenIp(result.user.id);
  redirect("/profil");
}

/**
 * Admin sign in — sama dengan signIn tapi reject kalau role = member.
 */
export async function adminSignIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await auth.api.signOut({ headers: await headers() });
  } catch {
    // ignore
  }

  let result;
  try {
    result = await auth.api.signInUsername({
      body: { username: parsed.data.username, password: parsed.data.password },
      headers: await headers(),
    });
  } catch {
    return { error: "Username atau password salah." };
  }

  if (!result || !("user" in result) || !result.user) {
    return { error: "Username atau password salah." };
  }

  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, result.user.id))
    .limit(1);

  if (!profile || profile.role === "member") {
    // Sign out karena ini akun non-admin mencoba akses admin area
    try {
      await auth.api.signOut({ headers: await headers() });
    } catch {
      // ignore
    }
    return { error: "Akun ini tidak memiliki akses admin." };
  }

  redirect("/admin/dashboard");
}

type BetterAuthErrorLike = {
  message?: string;
  status?: number;
  code?: string;
  body?: {
    message?: string;
    code?: string;
  };
};

function extractBetterAuthError(err: unknown): BetterAuthErrorLike {
  if (!err) return {};
  if (typeof err === "string") return { message: err };
  if (err instanceof Error) {
    return err as Error & BetterAuthErrorLike;
  }
  if (typeof err === "object") {
    return err as BetterAuthErrorLike;
  }
  return { message: String(err) };
}

function mapRegisterAuthError(err: unknown): AuthState {
  const detail = extractBetterAuthError(err);
  const rawCode = detail.body?.code ?? detail.code ?? "";
  const code = rawCode.toUpperCase();
  const message = (detail.body?.message ?? detail.message ?? "").toLowerCase();

  if (code === "PASSWORD_TOO_SHORT" || message.includes("password too short")) {
    return {
      fieldErrors: {
        kataSandi: ["Kata sandi minimal 6 karakter."],
      },
    };
  }

  if (code === "PASSWORD_TOO_LONG" || message.includes("password too long")) {
    return {
      fieldErrors: {
        kataSandi: ["Kata sandi terlalu panjang."],
      },
    };
  }

  if (
    code === "USER_ALREADY_EXISTS" ||
    code === "EMAIL_ALREADY_EXISTS" ||
    message.includes("already exists")
  ) {
    return {
      fieldErrors: {
        namaPengguna: ["Nama pengguna sudah dipakai."],
      },
    };
  }

  return {
    error: "Terjadi kendala saat membuat akun. Silakan coba lagi.",
  };
}

/**
 * Sign up member via Better Auth `signUpEmail`, sehingga hook database dan
 * cookie session tetap berjalan seperti flow produksi.
 */
export async function signUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    kodeUndangan: formData.get("kodeUndangan"),
    namaPengguna: formData.get("namaPengguna"),
    kataSandi: formData.get("kataSandi"),
    konfirmasiSandi: formData.get("konfirmasiSandi"),
    sandiPenarikan: formData.get("sandiPenarikan"),
    konfirmasiSandiPenarikan: formData.get("konfirmasiSandiPenarikan"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const username = parsed.data.namaPengguna;
  const referralCode = parsed.data.kodeUndangan;

  // Validasi kode undangan harus ada di tabel profiles
  const [staff] = await db
    .select({ id: profiles.id, username: profiles.username })
    .from(profiles)
    .where(eq(profiles.referralCode, referralCode))
    .limit(1);

  if (!staff) {
    return { fieldErrors: { kodeUndangan: ["Kode undangan tidak valid."] } };
  }

  // Cek username unik
  const [existing] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.username, username))
    .limit(1);

  if (existing) {
    return { fieldErrors: { namaPengguna: ["Nama pengguna sudah dipakai."] } };
  }

  // Drop sesi lama
  try {
    await auth.api.signOut({ headers: await headers() });
  } catch {
    // ignore
  }

  let createdUser;
  try {
    createdUser = await auth.api.signUpEmail({
      headers: await headers(),
      body: {
        email: syntheticEmail(username),
        password: parsed.data.kataSandi,
        name: username,
        username,
      },
    });
  } catch (error) {
    console.error("[signUp] createUser error:", { username, error });
    return mapRegisterAuthError(error);
  }

  if (!createdUser?.user) {
    return { error: "Gagal membuat akun baru." };
  }

  // 2. Set field tambahan (referral, sandi penarikan) di profile.
  //    Idempotent terhadap hook database Better Auth: kalau akun sudah
  //    pernah dibuat, ON CONFLICT hanya set field yang masih kosong/null.
  //    Hash sandi penarikan di-Node (bcrypt) — bukan SQL.
  const withdrawHash = await hashWithdrawPassword(
    parsed.data.sandiPenarikan,
  );
  const clientIp = getClientIp(await headers());
  try {
    await db
      .insert(profiles)
      .values({
        id: createdUser.user.id,
        username,
        role: "member",
        balance: "30000",
        referredBy: staff.id,
        withdrawPasswordHash: withdrawHash,
        registrationIp: clientIp,
        lastSeenIp: clientIp,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: profiles.id,
        set: {
          // Jangan timpa referral/withdraw-password yang sudah ada.
          referredBy: sql`COALESCE(${profiles.referredBy}, EXCLUDED.referred_by)`,
          withdrawPasswordHash: sql`COALESCE(${profiles.withdrawPasswordHash}, EXCLUDED.withdraw_password_hash)`,
          registrationIp: sql`COALESCE(${profiles.registrationIp}, EXCLUDED.registration_ip)`,
          lastSeenIp: sql`COALESCE(${profiles.lastSeenIp}, EXCLUDED.last_seen_ip)`,
          // Saldo awal 30rb hanya untuk akun baru yang belum punya referral.
          balance: sql`CASE WHEN ${profiles.referredBy} IS NULL AND ${profiles.balance} = 0 THEN 30000 ELSE ${profiles.balance} END`,
          updatedAt: sql`now()`,
        },
      });
  } catch (error) {
    console.error("[signUp] profile sync error:", { username, error });
    try {
      await db.delete(authUsers).where(eq(authUsers.id, createdUser.user.id));
    } catch (cleanupError) {
      console.error("[signUp] cleanup orphan user error:", {
        username,
        userId: createdUser.user.id,
        cleanupError,
      });
    }
    return { error: "Pendaftaran gagal. Silakan coba lagi." };
  }

  revalidatePath("/profil");
  redirect("/profil");
}

export async function signOut() {
  try {
    await auth.api.signOut({ headers: await headers() });
  } catch {
    // ignore
  }
  redirect("/login");
}

export async function adminSignOut() {
  try {
    await auth.api.signOut({ headers: await headers() });
  } catch {
    // ignore
  }
  redirect("/admin/login");
}
