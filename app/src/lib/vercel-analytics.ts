// Redact URLs before Vercel Web Analytics or Speed Insights sends an event.
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

export function redactSpeedInsightsEvent<T extends { url: string; route?: string }>(
  event: T,
): T | null {
  const url = redactAnalyticsUrl(event.url);
  if (url === null) return null;

  const route = event.route
    ? redactAnalyticsUrl(new URL(event.route, url).toString())
    : undefined;
  if (route === null) return null;

  return {
    ...event,
    url,
    ...(route ? { route: new URL(route).pathname } : {}),
  };
}
