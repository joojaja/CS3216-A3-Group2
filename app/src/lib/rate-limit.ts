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
