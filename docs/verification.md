# Wearabouts verification

Checked on 20 September 2026 on `codex/landing-onboarding`.

## Automated checks

- `npm run lint` passes.
- `npm test` passes both redirect-safety tests, covering known internal destinations and script, external, disguised and unsupported URLs.
- `npm run build -- --webpack` passes, including TypeScript and all generated routes.
- `npm ci --dry-run --ignore-scripts --offline --no-audit --no-fund` passes with the repaired lockfile.
- Default Turbopack build hits a local process/port permission error. Webpack is the verified supported fallback. No Google-font fetch is needed after self-hosting the supplied fonts.
- The original lockfile could not pass `npm ci` because two optional runtime entries were missing. `npm install` repaired those entries without changing direct dependency versions.

## Browser checks

Desktop screenshots at 1440 by 1000 and mobile screenshots at 390 by 844 are captured under the ignored `output/playwright/` directory.

- The landing signup link opens registration with `/onboarding` as the destination. The labelled local preview login reaches all four onboarding steps.
- Back retains the in-memory name and style choices. Liked and avoided colours are mutually exclusive. Step changes focus the heading. Mobile onboarding has no horizontal overflow.
- The rendered landing has one H1, a Wearabouts title and description, a canonical URL, an Open Graph image and a Twitter summary card. No broken images were found.
- Robots, sitemap and social-image endpoints return HTTP 200 with the expected content types. Sitemap URLs use the configured origin.
- The repaired mobile headline fits within the 390 px viewport. The desktop narrative remains pinned at viewport top while scrolling.
- Desktop reduced-motion mode shows the static story and hides the pinned version. With JavaScript disabled, all four story cards remain visible.
- Production-mode requests to onboarding, wardrobe, planner and profile reject the development cookie and redirect to sign-in. An invalid auth callback stays on the application login route.
- Existing wardrobe, planner, evaluator and profile routes render their expected headings in development preview, with `noindex, nofollow` metadata.
- A local simulated analysis response opened the editable review form. Changing blue to navy, aborting the save request, and retrying preserved navy and restored the save button. A simulated successful response returned to the wardrobe. This check did not write any database record or send an image to the AI provider.

## Live checks still required

No Supabase/Gemini configuration, production URL or GA measurement ID was supplied. Therefore this session does not establish actual registration, confirmation-email delivery, profile persistence, reload resume, real AI classification, private image saving, two-user authorization, or analytics delivery to a real property.

Use a dedicated test account to verify all of the following after configuration:

1. Register, confirm email if enabled, and reach onboarding.
2. Choose preferences, save, reload and resume at the upload step. Check that the profile contains the submitted values.
3. Upload one allowed image, correct an AI-generated field, confirm and save. Check that exactly one confirmed item and its private image exist.
4. Follow the saved-item link. Sign out and sign back in, then confirm that onboarding redirects to the wardrobe.
5. Sign in as another user and confirm that the first user's item and image cannot be accessed.
6. Verify existing wardrobe editing/deletion, outfit planning, purchase evaluation and profile saving with real data.
7. Enable a real GA4 stream, opt in, verify curated funnel events in Realtime, then opt out and verify no later event is sent.

The development preview is not production authentication and does not save fake records. Its cookie bypass is disabled outside development. No database schema changes or reset were applied.

## Existing issues outside this branch's scope

The existing upload API checks declared MIME type and size but does not decode or inspect file signatures. Malformed multipart requests can raise unhandled errors. These were identified for the teammate responsible for uploads; this branch preserves the API contract and only adds uploader completion and retry recovery. The recommendation and purchase logic has not been redesigned or certified by these checks.
