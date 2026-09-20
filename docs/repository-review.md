# Wearabouts repository review

Review date: 20 September 2026. Work branch: `codex/landing-onboarding`.

## Team and repository state

The starting branch was main at `715ef9b`. The only pre-existing untracked content was the user's `competitor images/` directory. After fetching origin, `develop/chian` and `image-uploading` contained no commits ahead of main. GitHub reported no open pull requests. The user confirmed another teammate owns the other application features, so this branch integrates with their components and APIs.

## Architecture and integration contracts

The app uses Next.js App Router, React, Tailwind and Motion. Supabase owns authentication, user profiles, wardrobe records and private image storage. Gemini supplies structured clothing and recommendation output through existing server routes. NEA weather retrieval is centralized in `app/src/lib/weather.ts`.

`saveProfile` validates profile fields, derives user identity from the session and upserts the caller's profile. Onboarding delegates to it rather than adding a second profile table or schema migration. The `drape_preferences_saved` user-metadata flag is a presentation-only resume marker. Completion requires a confirmed item owned by the authenticated user, so changing metadata never grants data access.

`AnalysisProvider` owns the upload, photo preparation and editable analysis state. `ItemUploader` submits the confirmed attributes and chosen image to `/api/items`. The existing endpoint creates private storage and the confirmed row, returning an item ID. This branch adds an optional `onSaved` callback; existing consumers retain wardrobe navigation. The onboarding providers remain mounted when users go back to edit preferences, preserving an in-progress item.

## Baseline problems addressed

- There was no dedicated onboarding route or initial preference journey.
- The previous landing page did not use the supplied design and included placeholder pricing.
- Registration bypassed onboarding and provided little guidance when email confirmation was required.
- Login accepted an unchecked return URL. Known internal destinations are now allowlisted and tested.
- A network error during item saving left the interface stuck. The review form now recovers with edits retained and a retryable error.
- The development login cookie could work outside development when services were absent. Both the client login and route guard now restrict it to development.
- Redirect responses could lose refreshed auth cookies. The guard now copies refreshed cookies and cache headers to redirects.
- Root metadata lacked a social image, and there was no sitemap, crawler configuration or analytics integration.
- Google font downloads prevented offline builds. The supplied local fonts now serve the landing and interface.
- The committed lockfile was missing two optional runtime entries. It has been repaired without changing direct dependency versions.

## Remaining teammate work and evidence

The upload APIs still validate browser-declared MIME types and size rather than inspecting image bytes. Multipart parsing errors are not handled uniformly. A successful item insert followed by a lost response can still lead to a duplicate if a user retries; server idempotency is a follow-up for the upload owner. The UI now tells users to check their wardrobe before retrying an uncertain save.

Rate limits use process memory, so multi-instance deployments require shared enforcement if limits must hold across instances. Full account deletion is not implemented. The resetting schema script must not be rerun against an existing team project to install this branch.

Recommendation quality, purchase-scoring quality, cross-user authorization, real email delivery and AI failure handling require configured service tests. The local route smoke test is not evidence that those live workflows are complete. The assignment also needs the evaluation dataset, model comparison, measured optimization results, analytics report, acquisition plan and launch material. See `assignment-evidence.md` for the full evidence map.

## Verification

Lint, redirect-safety tests, repaired-lockfile validation and the Webpack production build pass. Browser tests cover desktop/mobile landing and onboarding, no-JavaScript/reduced-motion story fallback, SEO endpoints, existing route rendering and simulated uploader recovery. The default Turbopack build is limited by local process permissions. Detailed results and live-test requirements are in `verification.md`.
