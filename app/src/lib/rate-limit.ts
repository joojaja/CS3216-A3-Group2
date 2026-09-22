// Per-user in-memory rate limiting for expensive AI calls.
// Suitable for a single-instance MVP deployment. Replace with a shared
// store (e.g. Upstash Redis) if the app ever runs on multiple instances.

const buckets = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

// Per-user daily cap for paid AI calls, reset at midnight Singapore time.
// Same single-instance caveat as above: a restart or a second instance
// starts the count again, so treat it as a soft limit.
const daily = new Map<string, { day: string; count: number }>();

export function checkDailyLimit(key: string, limit: number): boolean {
  const day = new Date(Date.now() + 8 * 3_600_000).toISOString().slice(0, 10);
  const entry = daily.get(key);
  if (!entry || entry.day !== day) {
    daily.set(key, { day, count: 1 });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count += 1;
  return true;
}
