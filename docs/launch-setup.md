# Wearabouts launch setup

## Site and authentication

Set `NEXT_PUBLIC_SITE_URL` to the final HTTPS origin before the production build. Configure the same site origin in Supabase and allow its `/auth/callback` URL. The confirmation handler accepts only known internal application destinations. Do not run the resetting schema file on an existing project for this branch.

## Search and social sharing

The landing page has one primary heading, descriptive section headings, a title and description, a canonical URL, Open Graph metadata with a 1200 by 630 image, and a Twitter summary card. `/sitemap.xml` lists only the landing and privacy pages. Private application routes and onboarding have `noindex` metadata and robots exclusions. Authentication and row ownership enforce privacy; robots settings alone do not.

After deployment, inspect the generated tags and test the real public URL in a social-preview debugger. Save a screenshot for milestone 18. Localhost previews do not establish that an external crawler can reach the deployed app.

## Analytics

Set `NEXT_PUBLIC_GA_MEASUREMENT_ID` to a GA4 web-stream ID. Disable Enhanced Measurement for that stream so automatic route/form collection does not bypass the application's curated events. Analytics loads only after the visitor chooses Allow analytics. The choice can be changed on `/privacy`.

The implemented funnel uses `landing_view`, `start_wardrobe_clicked`, `onboarding_view`, `preferences_saved` and `first_item_saved`. Manual `page_view` events cover public and application pages with coarse titles and page groups. Item detail pages never send their IDs. Product events include `item_saved`, `item_updated`, `item_deleted`, `outfit_requested`, `outfits_generated`, `outfit_failed`, `feedback_saved`, `purchase_requested`, `purchase_evaluated` and `purchase_failed`. Events carry a coarse page group. They do not include form answers, email, photo data or clothing IDs. Automatic page views are disabled and the configured location omits query strings and private paths.

Vercel Web Analytics and Speed Insights run for every visitor. They are cookieless, collect no personal identifiers, and the app reports item pages only as `/wardrobe/item`, so they are not consent-gated. Enable Web Analytics and Speed Insights on the Vercel project dashboard. Data appears after the first production deploy. Screenshot the Vercel Analytics report for milestone 19 alongside the GA4 report.

Verify events in GA4 Realtime or DebugView on the deployed app. Capture a report after actual use, record the observation period and explain where users leave the funnel. Do not fill the assignment with invented traffic, conversion rates or retention claims. No analytics property or report was supplied during implementation.

References: [Google event setup](https://developers.google.com/analytics/devguides/collection/ga4/events) and [consent setup](https://developers.google.com/tag-platform/security/guides/consent).

## Submission handoff

Complete team names, matriculation numbers, contributions and the deployed URL in README. Use `docs/assignment-evidence.md` to assemble the milestones PDF and separate pitch PDF after the teammate-owned features have evidence. Verify the official submission deadline against Coursemology because the supplied outline and older repository wording differ. The internal completion date remains 23 September 2026.


## Report setup

Register `page_group` as an event-scoped custom dimension. Compare page groups and completion events in an exploration. Use the onboarding funnel to find setup drop-off, outfit requests versus generated outfits to inspect completion, and purchase requests versus evaluations to find comparison failures. Requests can include retries, so these counts are not unique-user conversion rates. Record actual findings after deployment.

Manual page views follow [Google's page-view guidance](https://developers.google.com/analytics/devguides/collection/ga4/views). Keep Enhanced Measurement disabled, including history-based page views, to prevent automatic collection of private route paths. Consent withdrawal stops application listeners, removes GA cookies where accessible and reloads the page without the tag.
