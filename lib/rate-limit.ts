// In-memory per server instance; good enough for one Amplify server. Resets on deploy.
const buckets = new Map<string, number[]>();

/** True if `key` has already used `limit` tries in the last `windowMs`. Records the try if not. */
export function rateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) return true;
  recent.push(now);
  buckets.set(key, recent);
  return false;
}

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
}
