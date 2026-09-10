/**
 * Better Auth client untuk React components.
 *
 * Dipakai di:
 *  - form login (/login, /admin/login)
 *  - form register (/register)
 *  - form change password (/profil/change-password)
 *  - tombol logout
 *
 * Method yang dipakai:
 *  - signIn.username({ username, password })
 *  - signUp.email({ email, password, name, username })
 *  - signOut()
 *  - useSession()
 */
"use client";

import { createAuthClient } from "better-auth/react";
import { usernameClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  // baseURL default ke window.location.origin di browser. Untuk SSR/SSG,
  // baca dari env var. Next.js akan substitute di build time.
  baseURL:
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
  plugins: [usernameClient()],
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
