export function requireSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return;

  const allowed = new Set<string>();
  allowed.add(new URL(request.url).origin);
  for (const candidate of [process.env.NEXT_PUBLIC_SITE_URL, process.env.URL]) {
    if (!candidate) continue;
    try { allowed.add(new URL(candidate).origin); } catch { /* Ignore malformed deployment metadata. */ }
  }

  if (!allowed.has(origin)) throw new Error("ORIGIN_NOT_ALLOWED");
}
