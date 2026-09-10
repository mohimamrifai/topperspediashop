type HeaderList = {
  get(name: string): string | null;
};

/**
 * Ambil IP klien dari header request (reverse proxy aware).
 */
export function getClientIp(headerList: HeaderList): string | null {
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return normalizeIp(first);
  }

  const realIp = headerList.get("x-real-ip");
  if (realIp) return normalizeIp(realIp.trim());

  return null;
}

function normalizeIp(ip: string): string | null {
  if (!ip || ip === "unknown") return null;
  // IPv4-mapped IPv6, e.g. ::ffff:127.0.0.1
  if (ip.startsWith("::ffff:")) return ip.slice(7);
  return ip;
}
