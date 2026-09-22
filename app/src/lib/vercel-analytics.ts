// Redact private paths before Vercel Web Analytics sends an event.
// Returns the absolute URL with query and hash removed, or null to drop the event.
export function redactAnalyticsUrl(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const path = parsed.pathname;
  if (path === "/auth" || path.startsWith("/auth/")) return null;
  const safePath =
    path.startsWith("/wardrobe/") && path !== "/wardrobe/new"
      ? "/wardrobe/item"
      : path;
  return `${parsed.origin}${safePath}`;
}
