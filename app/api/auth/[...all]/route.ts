/**
 * Next.js App Router handler untuk Better Auth.
 *
 * Semua endpoint auth (signUp, signIn, signOut, getSession, dll.) di-mount
 * di `/api/auth/*` (lihat basePath default Better Auth).
 */
import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/lib/auth";

export const { GET, POST, PATCH, PUT, DELETE } = toNextJsHandler(auth);
