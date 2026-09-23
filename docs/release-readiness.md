# Wearabouts release readiness

Checked on 23 September 2026 against `main` at `716265d`. This replaces `docs/repository-review.md`, `docs/verification.md`, `docs/ui-consistency-verification.md` and `docs/report-review.md`, which recorded a sequence of earlier reviews on branches that have since merged. Their still-relevant findings are folded in below; their branch-specific narration is not, since it describes work that is now part of `main` rather than a pending change.

## Repository state

All feature branches that were open during earlier reviews are merged into `main`: `chian/sizing-feature` (PR #10), `outfit-planner` (PR #15), `chian/colour-palette` (PR #14), `chian/daily-outfit-cards` (PR #13) and `landing-page-design-refresh` (PR #16). `git branch -a` shows no other branch ahead of `main`. `AGENTS.md` already names Wearabouts throughout; see `docs/agents-md-proposal.md` for the edits still open for human approval.

## What is implemented

The application now covers, in code on `main`: account registration and sign-in, onboarding preferences, a private wardrobe with confirmed and editable AI attributes, an outfit planner that weights its suggestions by stored wore/liked/rejected feedback (`app/src/lib/outfit-feedback.ts`, wired into `app/src/app/api/outfits/route.ts` through `loadFeedbackContext`), a purchase evaluator, a curated Explore feed, a rule-first daily outfit feed with an optional model refinement step, saved outfits, a "My Style" colour and archetype page, and a sizing screenshot checker. Free and premium account tiers exist in the schema and gate Beautify image edits, Explore refreshes and outfit-planner AI credits (`app/src/lib/account-entitlements.ts`), though no payment or checkout flow sets a tier to premium; an operator would need to do that by hand today.

This is a materially larger feature set than the one described in earlier drafts of `docs/milestones-report.md`, which said the outfit route stored feedback without reading it back and treated sizing as an unmerged branch. Both statements were corrected in this pass; see that report for the current wording.

## Deployment configuration

Use the Next.js framework preset with `app` as the project root, install with `npm ci`, and build with `npm run build` (or `npm run build -- --webpack` where the default Turbopack build cannot bind a local port). CI (`.github/workflows/checks.yml`) runs `npm ci`, `npm run lint`, `npm test` and `npm run build -- --webpack` on Node 22.18.0 for every pull request and push to `main`, without production secrets.

Configure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, the paid `GOOGLE_GENERATIVE_AI_API_KEY`, the free `GOOGLE_GENERATIVE_AI_FREE_API_KEY` and the free `GOOGLE_GENERATIVE_AI_RAG_API_KEY` (see `app/.env.example` for the full list, including the optional `GEMINI_MODEL`, `GEMINI_RAG_MODEL`, `GEMINI_IMAGE_MODEL` and `NEXT_PUBLIC_GA_MEASUREMENT_ID`). Set `NEXT_PUBLIC_SITE_URL=https://wearabouts-zeta.vercel.app` in the Vercel project's Production environment and redeploy; the code falls back to Vercel's own production domain when this is unset, but an explicitly configured older value still wins, and an earlier check found the live site still serving `drape-zeta.vercel.app` metadata. Confirm the Supabase project's site URL and redirect allowlist include `https://wearabouts-zeta.vercel.app/auth/callback`.

This documentation pass did not install dependencies or run `npm run lint`, `npm test` or `npm run build` in this worktree, since it changes no application code. Run all three from `app/` before submission and record the result here or in the pull request.

## What still needs a human, not an agent

- Verify the production URL, the Supabase redirect configuration and the social metadata after the `NEXT_PUBLIC_SITE_URL` change above, including an external Open Graph preview.
- Run the full checks (`npm run lint`, `npm test`, `npm run build`) from `app/` on the commit being submitted, and fix anything that fails.
- Exercise the paid-key routes (`/api/items/analyze`, `/api/items/locate`, `/api/items/enhance`, `/api/purchases/evaluate`, `/api/sizing/extract`) with a real account. AGENTS.md rule 6 bans agents from doing this; only a person may.
- Sign in as two different accounts and confirm neither can read the other's wardrobe items, images or purchase evaluations.
- Capture a real GA4 and Vercel Analytics report after actual use, with the observation window and sample size, for milestone 19.
- Fill in team names, matriculation numbers, contributions and the confirmed live URL in `README.md` and `docs/milestones-report.md`.
- Confirm the source, creator and usage rights for the supplied landing images, fonts and W/hanger logo mark before the final write-up claims them.
- Run the sizing screenshot eval (`app/tests/fixtures/sizing/README.md`) with a real key and record the totals for milestone 11.

See `docs/assignment-evidence.md` for the full milestone-by-milestone evidence map.
