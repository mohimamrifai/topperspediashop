import "server-only";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { cache } from "react";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";

const INTERNAL_USER_HEADER = "x-topperspediashop-user";

type ForwardedUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  username?: string | null;
  displayUsername?: string | null;
  role?: string | null;
  banned?: boolean | null;
  banReason?: string | null;
  banExpires?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  emailVerified?: boolean | null;
};

function parseForwardedHeader<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(decodeURIComponent(value)) as T;
  } catch {
    return null;
  }
}

const getForwardedAuthContext = cache(async () => {
  const requestHeaders = await headers();
  return {
    user: parseForwardedHeader<ForwardedUser>(
      requestHeaders.get(INTERNAL_USER_HEADER),
    ),
  };
});

export const getAuthSession = cache(async () => {
  const forwarded = await getForwardedAuthContext();
  if (forwarded.user) {
    return { user: forwarded.user, session: null };
  }

  return await auth.api.getSession({ headers: await headers() });
});

export const getCurrentUser = cache(async () => {
  return (await getAuthSession())?.user ?? null;
});

export const requireCurrentUser = cache(async () => {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHENTICATED");
  }
  return user;
});

export const getCurrentProfile = cache(async () => {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const [profile] = await db
    .select({
      id: profiles.id,
      role: profiles.role,
      accessOverrides: profiles.accessOverrides,
      referredBy: profiles.referredBy,
      leaderId: profiles.leaderId,
      username: profiles.username,
      status: profiles.status,
      level: profiles.level,
      referralCode: profiles.referralCode,
    })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);
  return profile ?? null;
});

export const requireCurrentProfile = cache(async () => {
  const profile = await getCurrentProfile();
  if (!profile) {
    throw new Error("UNAUTHENTICATED");
  }
  return profile;
});

export const requireCurrentAdminProfile = cache(async () => {
  const profile = await requireCurrentProfile();
  if (profile.role === "member") {
    throw new Error("FORBIDDEN");
  }
  return profile;
});
