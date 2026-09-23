# Deployment

This covers everything needed to run Wearabouts in Supabase and Vercel, beyond the local setup steps in the root `README.md`.

## Environment variables

All variables are listed with comments in `app/.env.example`. Copy it to `app/.env.local` for local development, and set the same names in the Vercel project's environment variables for each deployment environment.

`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` come from the Supabase project's Connect dialog or Settings, API Keys. Use the publishable key, never the secret key.

`GOOGLE_GENERATIVE_AI_API_KEY` is the paid Google project. It powers photo analysis, purchase evaluation, the two AI image edits (Isolate, Iron) and the sizing screenshot reader. `GOOGLE_GENERATIVE_AI_FREE_API_KEY` is a second, unbilled Google project that powers the outfit planner, the daily outfit feed and the My Style archetype grouping. `GOOGLE_GENERATIVE_AI_RAG_API_KEY` is a third, unbilled project that powers the Explore feed alone. None of the free keys fall back to the paid key; a route reports a configuration error instead. `GEMINI_MODEL`, `GEMINI_RAG_MODEL` and `GEMINI_IMAGE_MODEL` override the default models.

`SIZING_EXTRACT_MOCK=1` answers sizing screenshot uploads with canned fixtures instead of a paid call. It only works when `NODE_ENV=development`; production builds ignore it.

`NEXT_PUBLIC_SITE_URL` sets the canonical homepage, sitemap and absolute Open Graph URLs. Set it to `https://wearabouts-zeta.vercel.app` in the Vercel project's Production environment and redeploy. Without it, the app falls back to Vercel's own production domain, then to `http://localhost:3000` locally, but an explicitly set older value still overrides that fallback, so confirm no stale URL is left configured.

`NEXT_PUBLIC_GA_MEASUREMENT_ID` is an optional GA4 measurement ID. Analytics loads only after the visitor accepts it on the consent prompt.

## Supabase setup

Create a free project at supabase.com, then run `app/supabase/schema.sql` in the SQL editor. It only creates objects that do not already exist and never drops a table or deletes a row, so it is safe to run on a new project and to re-run later on an existing one to pick up new tables. `app/supabase/migrations/` keeps the dated history of the additive changes that are now folded into `schema.sql`.

Under Authentication, set the site URL to the deployed origin and add `/auth/callback` to the allowed redirect URLs, for both that origin and `http://localhost:3000` during local development. Registration supports both immediate sessions and email confirmation; email confirmation needs a working mail configuration in the Supabase project.

Every table uses row-level security with an owner policy shaped `(select auth.uid()) = user_id`, and every write stamps `user_id` from the session rather than trusting a client-supplied value.

## Vercel

Use the Next.js framework preset with `app` as the project root. Install with `npm ci` and build with `npm run build`, or `npm run build -- --webpack` where the default Turbopack build cannot bind a local port. `.github/workflows/checks.yml` runs `npm ci`, `npm run lint`, `npm test` and `npm run build -- --webpack` on Node 22.18.0 for every pull request and push to `main`, without production secrets.

After setting `NEXT_PUBLIC_SITE_URL` and redeploying, check the production HTML: canonical and `og:url` should use the production origin, the social image URL should use the same origin, and that image should respond with HTTP 200 and `image/png`. Test the URL in an external social-preview debugger before calling social sharing done. `/sitemap.xml` lists only the landing and privacy pages; private application routes and onboarding carry `noindex` metadata and robots exclusions, though authentication and row ownership are what actually enforce privacy, not the robots settings.

## Analytics

Vercel Web Analytics and Speed Insights run for every visitor without a consent prompt. They are cookieless, collect no personal identifiers, and the app reports item pages only as `/wardrobe/item`, so nothing route-specific or personal is recorded. Enable Web Analytics and Speed Insights on the Vercel project dashboard; data appears after the first production deploy.

GA4 is optional and loads only after the visitor chooses Allow analytics on `/privacy`. Disable Enhanced Measurement on that GA4 stream so automatic route and form collection does not bypass the app's curated events. The implemented funnel events are `start_wardrobe_clicked`, `preferences_saved` and `first_item_saved`; manual `page_view` events cover public and application pages with coarse page groups (`landing`, `onboarding`, `wardrobe`, `planner`, `evaluator`, `style`, `daily_outfits`, `saved_outfits`, `explore`, `profile`). Product events include `item_saved`, `item_updated`, `item_deleted`, `outfit_requested`, `outfits_generated`, `outfit_failed`, `feedback_saved`, `outfit_saved`, `outfit_unsaved`, `purchase_requested`, `purchase_evaluated`, `purchase_failed`, `daily_outfit_*`, `saved_outfit_worn`, `style_regrouped` and `explore_*`. None of these carry form answers, email addresses, photo data or clothing IDs, and item detail pages never send their IDs.

Register `page_group` as an event-scoped custom dimension in GA4, then compare page groups against completion events in an exploration: the onboarding funnel for setup drop-off, outfit requests against generated outfits for planner completion, and purchase requests against evaluations for comparison failures. Requests can include retries, so these counts are not unique-user conversion rates. Verify events in GA4 Realtime or DebugView after a real deploy, and record the observation window alongside any report pulled from it.

See [Google's event setup guide](https://developers.google.com/analytics/devguides/collection/ga4/events) and [consent setup guide](https://developers.google.com/tag-platform/security/guides/consent) for the underlying GA4 mechanics.
