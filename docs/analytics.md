# Analytics

This document covers the analytics setup for Wearabouts: the tools in use, the event dictionary, the funnels to build from them, how to verify events land, and a template for writing up insights once real usage data exists.

## Tools and why

Wearabouts uses two analytics tools, both loaded client-side and both able to run with no configuration in local development.

**Vercel Web Analytics and Speed Insights** (`@vercel/analytics/next`, `@vercel/speed-insights/next`, wired in `app/src/components/vercel-analytics.tsx`) track page views and Core Web Vitals automatically, including client-side route changes in the Next.js App Router. They need no consent banner because Vercel's page-view analytics does not use cookies or store cross-site identifiers. Every event and vital passes through `beforeSend` in `app/src/lib/vercel-analytics.ts`, which strips query strings and hashes and collapses any `/wardrobe/<id>` path to `/wardrobe/item` so a specific wardrobe item id never reaches Vercel. Auth callback URLs, which can carry a one-time code, are dropped entirely. This tool answers "which pages get traffic" and "how fast is the app," not the product funnel.

**Google Analytics 4**, loaded through `app/src/components/analytics-consent.tsx`, is the funnel and event tool. It only loads after a visitor clicks "Allow analytics" on the consent banner, and only if `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set to a valid `G-` measurement id. With no measurement id (the default in local development and in the example env file), the component renders nothing and no script loads. Consent is stored in `localStorage` under `drape-analytics-consent` and can be withdrawn from the privacy page, which also clears `_ga*` cookies and reloads the page. GA4 was chosen over a full product-analytics platform (Mixpanel, Amplitude, PostHog) because the milestone only asks for event tracking with a realtime/debug view and a free report screenshot, GA4's DebugView and Realtime report satisfy that directly, and it needs no new backend or SDK beyond the `gtag.js` snippet already in place.

Page views in GA4 are sent manually (`send_page_view: false` at config time, then an explicit `page_view` on load and again on every route change) because the App Router does not do a full page load between routes. The page name comes from `analyticsPage()` in `app/src/lib/analytics.ts`, which maps a pathname to a short label (`wardrobe`, `add_item`, `planner`, and so on) and folds every `/wardrobe/<id>` path into `item_detail` so a wardrobe item id is never sent as a GA parameter. `analyticsPage` is a pure function driven by `usePathname()`, so it re-runs and fires a fresh `page_view` on every client-side navigation, which covers the "account for client-side route changes" requirement.

Two routes, `/sizing` and `/profile/measurements`, were missing from that page map before this change and fell back to the generic `other` label, which is excluded from `page_view` entirely. Both are now named, so route changes into the sizing flow and the measurements page are counted like any other page.

## Event dictionary

All product events go through one helper, `trackFunnel(name, props?)` in `app/src/lib/analytics.ts`. It dispatches a `drape-funnel` window event; `analytics-consent.tsx` is the only listener, and it forwards the event to GA4 only when consent is granted and GA4 is configured. Calling `trackFunnel` is always safe: with no measurement id or before consent, the dispatch is a harmless no-op. `FUNNEL_EVENTS` is the allow-list; a name is only sent if it appears there, so the GA4 fan-out cannot be pointed at an unlisted or accidental event name.

Event properties are restricted by convention to strings, numbers and booleans, specifically counts (`item_count`, `field_count`), enums (`decision_label`, `action`, `reason`, `source`, `result`), and booleans. No image, free-text note, email or other personal field is ever passed as a property.

| Event | Fires when | Properties |
| --- | --- | --- |
| `page_view` | Every page load and client-side route change | `page_group` |
| `landing_view` | Landing page view | none |
| `onboarding_view` | Onboarding page view | none |
| `start_wardrobe_clicked` | A signup link is clicked anywhere on the landing page (header, story CTA, pricing CTA) | none |
| `pricing_viewed` | The pricing section scrolls into view on the landing page (fires once) | none |
| `sign_up_started` | The signup form is submitted with a configured Supabase project | none |
| `sign_up_completed` | `supabase.auth.signUp` succeeds, whether or not email confirmation is pending | none |
| `preferences_saved` | Onboarding preferences step is submitted, or the profile page saves preferences | none |
| `onboarding_completed` | The onboarding flow's first item is saved and the success screen is reached | none |
| `first_item_saved` | The onboarding flow's first item is saved | none |
| `item_saved` | Any wardrobe item is saved from the add-item flow | `item_count` (total items owned after this save, when available) |
| `wardrobe_activated` | `item_saved` and the new total is exactly 5 | `item_count` (always 5) |
| `item_attributes_corrected` | An item is saved and the user changed at least one AI-populated field before saving | `field_count` |
| `item_analysis_failed` | The clothing-extraction call returns an error or throws | none |
| `item_analysis_retried` | Analysis is re-run after a previous attempt on the same item failed | none |
| `item_updated` | An existing wardrobe item is edited | none |
| `item_deleted` | A wardrobe item is deleted | none |
| `outfit_requested` | The user submits an occasion to the planner | none |
| `outfits_generated` | The planner returns a valid set of outfits | none |
| `outfit_failed` | The planner call returns an error or throws | none |
| `outfit_retried` | The user retries a failed planner turn | none |
| `feedback_saved` | Outfit feedback is recorded, from the planner or the daily feed | `action` (`wore`, `liked`, `rejected`), `reason` (one of `FEEDBACK_REASONS`, only when picked) |
| `outfit_saved` / `outfit_unsaved` | An outfit is added to or removed from saved outfits | none |
| `saved_outfit_worn` | A saved outfit is marked worn | none |
| `daily_feed_opened` / `daily_feed_finished` | The daily outfit feed opens or the user reaches the end | none |
| `daily_outfit_skipped` / `daily_outfit_saved` / `daily_outfit_worn` | A daily feed card is skipped, saved or marked worn | none |
| `daily_outfit_rejected` | A daily feed card is rejected | `reason` (only when picked) |
| `purchase_requested` | A prospective purchase photo is submitted for evaluation | none |
| `purchase_evaluated` | The purchase evaluation returns a result | `decision_label` (`likely_redundant`, `potentially_useful`, `fills_wardrobe_gap`, `insufficient_information`) |
| `purchase_failed` | The purchase evaluation call returns an error or throws | none |
| `sizing_requested` | A "find my size" lookup is started, by screenshot or by manual brand entry | `source` (`screenshot`, `manual`) |
| `sizing_result` | A sizing lookup resolves to a match or a known gap | `result` (`match`, `unknown_brand`, `no_category`, `no_range`, `need_range`, `unusable`) |
| `explore_feed_loaded` | The explore feed finishes loading | none |
| `explore_product_opened` | A curated look in the explore feed is opened | none |
| `style_regrouped` | The style-archetype view is regrouped | none |

Two known gaps are worth naming rather than papering over. First, `preferences_saved` fires from both the onboarding preferences step and the general profile-edit form, so the two cannot be told apart in GA4 today; splitting them into distinct event names is a small follow-up. Second, there is no "upgrade click" event yet, because Wearabouts Plus is listed on the pricing section as planned and is not purchasable, so there is no button to click. Add the event when a real upgrade path ships.

## Funnels to build in GA4

These are not built automatically. GA4 needs manual funnel exploration setup (Explore tab, Funnel exploration template) using the events above. Three funnels matter most for this product:

1. **Acquisition to activation.** `landing_view` -> `start_wardrobe_clicked` -> `sign_up_completed` -> `onboarding_completed` -> `wardrobe_activated`. This tracks the number of visitors who go from the landing page to a fifth confirmed wardrobe item, which is the point the product's wardrobe-first value actually kicks in.
2. **Outfit feedback loop.** `outfit_requested` -> `outfits_generated` -> `feedback_saved`. Segment `feedback_saved` by its `action` and `reason` parameters (register them as custom dimensions first, see below) to see which rejection reasons are most common, which is the direct evidence for whether the feedback loop is doing anything.
3. **Purchase-check usage.** `purchase_requested` -> `purchase_evaluated`, segmented by `decision_label`. This is the clearest differentiator versus the three competitors named in the milestone write-up, so it is worth watching on its own rather than folding into a generic conversion funnel.

`item_attributes_corrected` is not a funnel step so much as a standing rate: divide its count by `item_saved` count over the same period to see how often users actually change what the AI suggested, which is the concrete evidence for the AI-specific UI milestone.

Event parameters (`action`, `reason`, `decision_label`, `source`, `result`, `item_count`, `field_count`) are not visible in standard GA4 reports until they are registered as custom dimensions under Admin -> Custom definitions -> Custom dimensions, scoped to Event. Do this once per parameter before trying to segment a funnel by it.

## Verifying events

Do this after any change to an event name, property or call site, and before relying on a report:

1. Set a real `NEXT_PUBLIC_GA_MEASUREMENT_ID` in `.env.local` for a GA4 property (use a test property, not the production one, while developing).
2. Run the app, open it in a browser, and click "Allow analytics" on the consent banner.
3. In the GA4 property, open Admin -> DebugView, or Reports -> Realtime for a simpler view without needing the debug query parameter.
4. Walk through the flow you changed: navigate between pages and confirm a `page_view` appears for each client-side route change, not just the first load; then trigger the specific event (save an item, submit feedback, run a purchase check) and confirm it appears within a few seconds with the expected parameters.
5. Confirm nothing appears if you decline consent, and confirm the app does not throw or block when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is unset.

## Insight template

Fill this in once the property has accumulated real usage, not before. Do not estimate or invent numbers ahead of that.

```
## Analytics insights, <date range>

Report screenshot: <link or embedded image of the GA4 report used>

### Acquisition to activation
- Landing views: <count>
- Signup starts / completions: <count> / <count>
- Reached wardrobe_activated (5 items): <count> (<percent> of signups)
- Where the funnel drops most: <step>

### Outfit feedback loop
- Outfits requested / generated: <count> / <count>
- Feedback rate (feedback_saved / outfits_generated): <percent>
- Most common rejection reason: <reason>, <count> occurrences
- What this changed: <specific decision, e.g. a deterministic rule adjustment,
  a prompt change, a UI change to surface the reason sooner>

### Purchase-check usage
- Purchases evaluated: <count>
- Decision label split: likely_redundant <percent>, potentially_useful <percent>,
  fills_wardrobe_gap <percent>, insufficient_information <percent>
- What this suggests about the redundancy rules: <finding>

### AI trust signal
- item_attributes_corrected / item_saved: <percent>
- What this says about extraction accuracy: <finding>
```

## Manual setup still needed

The following cannot be done from the codebase and need a human with dashboard access:

- Create a GA4 property (or confirm the existing one) and set `NEXT_PUBLIC_GA_MEASUREMENT_ID` in the deployed environment.
- Disable GA4 Enhanced Measurement on the data stream, so automatic scroll/outbound-click events do not mix into the curated event list above.
- Register the event parameters listed above as custom dimensions.
- Build the three funnel explorations described above in GA4's Explore tab.
- Confirm the Vercel project has Web Analytics and Speed Insights enabled on its plan; custom Vercel events are not used here, so no plan upgrade is required for the events in this document.
- Take the report screenshot for the milestone write-up once there is enough real traffic to show a funnel with more than a handful of events, and fill in the insight template above with real figures.
