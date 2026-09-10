"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

const TRACKED_PREFIXES = [
  "/admin/task",
  "/admin/team",
  "/admin/users",
  "/admin/rechargelist",
  "/admin/withdrawlist",
  "/admin/deposit-bank",
  "/admin/product",
  "/admin/pelayanan",
  "/admin/permissions",
  "/admin/commission",
  "/task",
  "/order",
  "/profil",
  "/recharge",
  "/withdraw",
  "/support",
];

function isTrackedPath(pathname: string) {
  return TRACKED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function RealtimeBridge() {
  const pathname = usePathname();
  const router = useRouter();
  const refreshTimerRef = useRef<number | null>(null);
  const lastRefreshRef = useRef(0);

  const enabled = useMemo(
    () => (pathname ? isTrackedPath(pathname) : false),
    [pathname],
  );

  useEffect(() => {
    if (!enabled) return;

    const scheduleRefresh = () => {
      const now = Date.now();
      if (now - lastRefreshRef.current < 800) return;
      if (refreshTimerRef.current !== null) return;

      refreshTimerRef.current = window.setTimeout(() => {
        refreshTimerRef.current = null;
        lastRefreshRef.current = Date.now();
        router.refresh();
      }, 250);
    };

    const source = new EventSource("/api/realtime/stream");

    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as { type?: string };
        if (payload.type !== "audit") return;
      } catch {
        return;
      }

      scheduleRefresh();
    };

    return () => {
      source.close();
      if (refreshTimerRef.current !== null) {
        window.clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [enabled, router]);

  return null;
}
