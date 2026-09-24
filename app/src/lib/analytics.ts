export const FUNNEL_EVENTS = [
  "sign_up_started", "sign_up_completed",
  "preferences_saved", "onboarding_completed",
  "first_item_saved", "item_saved", "wardrobe_activated", "item_attributes_corrected",
  "item_analysis_failed", "item_analysis_retried",
  "item_updated", "item_deleted",
  "outfit_requested", "outfits_generated", "outfit_failed", "outfit_retried", "feedback_saved",
  "purchase_requested", "purchase_evaluated", "purchase_failed",
  "sizing_requested", "sizing_result",
  "explore_feed_loaded", "explore_product_opened",
  "outfit_saved", "outfit_unsaved", "saved_outfit_worn",
  "daily_feed_opened", "daily_outfit_skipped", "daily_outfit_saved",
  "daily_outfit_worn", "daily_outfit_rejected", "daily_feed_finished",
  "style_regrouped", "pricing_viewed",
] as const;
export type FunnelEvent = typeof FUNNEL_EVENTS[number];

// Event parameters must stay limited to counts, enums and booleans. Never
// pass images, free-text notes, emails or other private data through here.
export type FunnelEventProps = Record<string, string | number | boolean>;

export function trackFunnel(name: FunnelEvent, props?: FunnelEventProps) {
  window.dispatchEvent(new CustomEvent("drape-funnel", { detail: { name, props } }));
}

// The saved-item count that marks the activation milestone for analytics.
// Centralised so the client and any future report agree on the same number.
export const ACTIVATION_ITEM_COUNT = 5;
export function isActivationMilestone(itemCount: number): boolean {
  return itemCount === ACTIVATION_ITEM_COUNT;
}
export function analyticsPage(pathname: string) {
  if (pathname === "/") return "landing";
  if (pathname === "/wardrobe/new") return "add_item";
  if (pathname === "/wardrobe/outfits") return "saved_outfits";
  if (pathname === "/wardrobe/today") return "daily_outfits";
  if (pathname.startsWith("/wardrobe/")) return "item_detail";
  const pages: Record<string, string> = {
    "/wardrobe": "wardrobe", "/style": "style", "/planner": "planner", "/evaluator": "evaluator", "/explore": "explore",
    "/profile": "profile", "/profile/measurements": "measurements", "/sizing": "sizing",
    "/privacy": "privacy", "/login": "login", "/onboarding": "onboarding",
  };
  return pages[pathname] ?? "other";
}
