export const FUNNEL_EVENTS = [
  "preferences_saved", "first_item_saved", "item_saved", "item_updated", "item_deleted",
  "outfit_requested", "outfits_generated", "outfit_failed", "feedback_saved",
  "purchase_requested", "purchase_evaluated", "purchase_failed",
  "explore_feed_loaded", "explore_product_opened",
  "outfit_saved", "outfit_unsaved", "saved_outfit_worn",
  "daily_feed_opened", "daily_outfit_skipped", "daily_outfit_saved",
  "daily_outfit_worn", "daily_outfit_rejected", "daily_feed_finished",
  "style_regrouped",
] as const;
export type FunnelEvent = typeof FUNNEL_EVENTS[number];
export function trackFunnel(name: FunnelEvent) {
  window.dispatchEvent(new CustomEvent("drape-funnel", { detail: name }));
}
export function analyticsPage(pathname: string) {
  if (pathname === "/") return "landing";
  if (pathname === "/wardrobe/new") return "add_item";
  if (pathname === "/wardrobe/outfits") return "saved_outfits";
  if (pathname === "/wardrobe/today") return "daily_outfits";
  if (pathname.startsWith("/wardrobe/")) return "item_detail";
  const pages: Record<string, string> = {
    "/wardrobe": "wardrobe", "/style": "style", "/planner": "planner", "/evaluator": "evaluator", "/explore": "explore",
    "/profile": "profile", "/privacy": "privacy", "/login": "login", "/onboarding": "onboarding",
  };
  return pages[pathname] ?? "other";
}
