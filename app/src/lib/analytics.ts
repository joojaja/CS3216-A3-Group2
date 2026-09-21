export const FUNNEL_EVENTS = [
  "preferences_saved", "first_item_saved", "item_saved", "item_updated", "item_deleted",
  "outfit_requested", "outfits_generated", "outfit_failed", "feedback_saved",
  "purchase_requested", "purchase_evaluated", "purchase_failed",
] as const;
export type FunnelEvent = typeof FUNNEL_EVENTS[number];
export function trackFunnel(name: FunnelEvent) {
  window.dispatchEvent(new CustomEvent("drape-funnel", { detail: name }));
}
export function analyticsPage(pathname: string) {
  if (pathname === "/") return "landing";
  if (pathname === "/wardrobe/new") return "add_item";
  if (pathname.startsWith("/wardrobe/")) return "item_detail";
  const pages: Record<string, string> = {
    "/wardrobe": "wardrobe", "/planner": "planner", "/evaluator": "evaluator",
    "/profile": "profile", "/privacy": "privacy", "/login": "login", "/onboarding": "onboarding",
  };
  return pages[pathname] ?? "other";
}
