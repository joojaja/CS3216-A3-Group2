# Wearabouts launch setup

## Production site and authentication

The team supplied `https://wearabouts-zeta.vercel.app` as the production URL. Set `NEXT_PUBLIC_SITE_URL=https://wearabouts-zeta.vercel.app` in the Vercel project's **Production** environment variables, then create a new deployment or redeploy after the change. An explicitly configured older URL overrides the code's Vercel-domain fallback, so confirm that no `drape-zeta.vercel.app` value remains. The repository is not linked to the project through the Vercel CLI, so the project owner must make this dashboard change.

In Supabase, confirm that the site URL is `https://wearabouts-zeta.vercel.app` and that the allowed redirect URLs include `https://wearabouts-zeta.vercel.app/auth/callback`. The local callback URL may also be allowed for development. The confirmation handler accepts only known internal application destinations. Do not run the resetting schema file on an existing project for this branch.

## Search and social sharing

The landing page has one primary heading, descriptive section headings, a title and description, a homepage canonical URL, Open Graph metadata with a generated 1200 by 630 image, and a Twitter summary card. The site URL helper prefers `NEXT_PUBLIC_SITE_URL`, then Vercel's production domain, then localhost for local development. `/sitemap.xml` lists only the landing and privacy pages. Private application routes and onboarding have `noindex` metadata and robots exclusions. Authentication and row ownership enforce privacy; robots settings alone do not.

After redeployment, inspect the production HTML and confirm that canonical and `og:url` use `https://wearabouts-zeta.vercel.app`, that the social image URL uses the same origin, and that the image responds with HTTP 200 and `image/png`. Test the URL in an external social-preview debugger and save its preview screenshot for milestone 18. A public homepage response alone does not establish that a crawler can fetch the image.

## Analytics

Set `NEXT_PUBLIC_GA_MEASUREMENT_ID` to a GA4 web-stream ID. Disable Enhanced Measurement for that stream so automatic route/form collection does not bypass the application's curated events. Analytics loads only after the visitor chooses Allow analytics. The choice can be changed on `/privacy`.

The implemented funnel uses `start_wardrobe_clicked`, `preferences_saved` and `first_item_saved`. Manual `page_view` events cover public and application pages with coarse titles and page groups such as `landing`, `onboarding`, `wardrobe`, `planner`, `evaluator`, `style`, `daily_outfits`, `saved_outfits`, `explore` and `profile`. Item detail pages never send their IDs. Product events include `item_saved`, `item_updated`, `item_deleted`, `outfit_requested`, `outfits_generated`, `outfit_failed`, `feedback_saved`, `outfit_saved`, `outfit_unsaved`, `purchase_requested`, `purchase_evaluated`, `purchase_failed`, and the newer `daily_outfit_*`, `saved_outfit_worn`, `style_regrouped` and `explore_*` events added alongside those features. They do not include form answers, email, photo data or clothing IDs. Automatic page views are disabled and the configured location omits query strings and private paths.

Vercel Web Analytics and Speed Insights run for every visitor. They are cookieless, collect no personal identifiers, and the app reports item pages only as `/wardrobe/item`, so they are not consent-gated. Enable Web Analytics and Speed Insights on the Vercel project dashboard. Data appears after the first production deploy. Screenshot the Vercel Analytics report for milestone 19 alongside the GA4 report.

Verify events in GA4 Realtime or DebugView on the deployed app. Capture a report after actual use, record the observation period and explain where users leave the funnel. Do not fill the assignment with invented traffic, conversion rates or retention claims. No analytics property or report was supplied during implementation.

References: [Google event setup](https://developers.google.com/analytics/devguides/collection/ga4/events) and [consent setup](https://developers.google.com/tag-platform/security/guides/consent).

## Submission handoff

The report draft identifies the group as Group 2 and lists the supplied production URL and public repository. Fill in team names, matriculation numbers and contribution summaries. Use `docs/assignment-evidence.md` to assemble the milestones PDF and separate pitch PDF after the remaining evidence is available. Verify the official submission deadline against Coursemology; see `docs/agents-md-proposal.md` for the specific mismatch between the two dates recorded in this repository. The internal completion date is 23 September 2026, which is today.


## Report setup

Register `page_group` as an event-scoped custom dimension. Compare page groups and completion events in an exploration. Use the onboarding funnel to find setup drop-off, outfit requests versus generated outfits to inspect completion, and purchase requests versus evaluations to find comparison failures. Requests can include retries, so these counts are not unique-user conversion rates. Record actual findings after deployment.

Manual page views follow [Google's page-view guidance](https://developers.google.com/analytics/devguides/collection/ga4/views). Keep Enhanced Measurement disabled, including history-based page views, to prevent automatic collection of private route paths. Consent withdrawal stops application listeners, removes GA cookies where accessible and reloads the page without the tag.
