export type FunnelEvent = "preferences_saved" | "first_item_saved";
export function trackFunnel(name: FunnelEvent) {
  window.dispatchEvent(new CustomEvent("drape-funnel", { detail: name }));
}
