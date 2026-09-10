import { type NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";

const MEMBER_PREFIXES = [
  "/profil",
  "/recharge",
  "/withdraw",
  "/bank",
  "/task",
  "/order",
  "/support",
];

const ADMIN_PREFIXES = ["/admin"];
const ADMIN_PUBLIC = ["/admin/login"];
const INTERNAL_USER_HEADER = "x-topperspediashop-user";

function encodeInternalHeader(value: unknown) {
  return encodeURIComponent(JSON.stringify(value));
}

function startsWithAny(pathname: string, prefixes: string[]) {
  return prefixes.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

function isAdminPublic(pathname: string) {
  return ADMIN_PUBLIC.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

export async function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  const session = await auth.api.getSession({
    headers: request.headers,
  });
  const user = session?.user ?? null;
  if (user) {
    requestHeaders.set(INTERNAL_USER_HEADER, encodeInternalHeader(user));
  } else {
    requestHeaders.delete(INTERNAL_USER_HEADER);
  }
  const { pathname } = request.nextUrl;
  const role = (user as { role?: string } | null)?.role ?? null;

  // Halaman admin: wajib login, kecuali /admin/login
  if (startsWithAny(pathname, ADMIN_PREFIXES) && !isAdminPublic(pathname)) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  // Halaman member: wajib login sebagai role member
  if (startsWithAny(pathname, MEMBER_PREFIXES)) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    // Non-member (admin_staff / admin_leader / super_admin) yang akses
    // halaman member akan dilempar ke dashboard admin. Role diset di
    // kolom `public.user.role` saat signup (lihat lib/actions/auth.ts
    // & admin-users.ts).
    if (role !== "member") {
      const url = request.nextUrl.clone();
      url.pathname = role ? "/admin/dashboard" : "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  // Sudah login & membuka halaman login/register → lempar ke profil
  if (user && (pathname === "/login" || pathname === "/register")) {
    const url = request.nextUrl.clone();
    url.pathname = role === "member" ? "/profil" : "/admin/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
