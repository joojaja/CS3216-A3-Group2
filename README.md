# Wearabouts

Repository for CS3216 Assignment 3, Group 2.

Wearabouts is a wardrobe-first clothing assistant for Singapore. Users photograph the clothes they already own, get outfit ideas matched to the occasion and the live NEA weather forecast, and check whether a prospective purchase duplicates something they own before buying it.

- Live application: https://wearabouts-zeta.vercel.app
- Public repository: https://github.com/joojaja/CS3216-A3-Group2

## Team

| Matriculation no. | Name | Contribution |
| --- | --- | --- |
| TODO | Maahir Garg | Landing page and onboarding integration, launch readiness (analytics, Open Graph card, sitemap), submission documentation |
| TODO | TODO (GitHub: joojaja) | Outfit planner, purchase evaluation and Explore feed; repository and deployment owner; free/premium account tiers |
| TODO | TODO (GitHub: chian, git name "tsaichian") | Sizing feature (measurement profiles, stored brand size charts, screenshot checker), daily outfit feed, saved outfits, My Style colour and archetype page |
| TODO | Sanjeev Ravichandran | Landing page redesign (hero, header, feature tour, pricing, story motion) |

Matriculation numbers and full names for two contributors are not recorded anywhere in this repository; only a GitHub handle or a git commit name is available. Whoever owns those accounts should fill in the `TODO` cells above before submission.

## Tech stack

- Next.js 16 (App Router), React 19 and TypeScript
- Tailwind CSS v4 and the `motion` package for animation
- Supabase: Postgres, Auth, private Storage, row-level security
- Google Gemini through the Vercel AI SDK for multimodal extraction and structured outputs
- NEA weather forecasts through the data.gov.sg open API
- Hosting on Vercel, with Vercel Web Analytics and Speed Insights

See `docs/milestones-report.md` (technology stack section) for the alternatives considered and the reasoning behind each choice.

## Local setup

```bash
cd app
cp .env.example .env.local   # fill in the values described below
npm ci
npm run dev
```

Requires Node 22.18 or newer (the Node test runner needs it to import TypeScript directly; this is also the version CI uses).

### Supabase

1. Create a free project at supabase.com.
2. Run `app/supabase/schema.sql` in the SQL editor. It only creates objects that do not already exist and never drops a table or deletes a row, so it is safe to run on a new project and to re-run later on an existing one to pick up new tables. `app/supabase/migrations/` keeps the dated history of the additive changes that are now folded into `schema.sql`.
3. Copy the project URL and publishable key into `.env.local` as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
4. Under Authentication, set the site URL and add `/auth/callback` to the allowed redirect URLs, for both the deployed origin and `http://localhost:3000` during local development. Registration supports both immediate sessions and email confirmation; a working mail configuration is needed for confirmation delivery.

### Gemini

Configure only the keys for the workflows you intend to use; each one belongs to a separate Google project so that billing stays isolated:

- `GOOGLE_GENERATIVE_AI_API_KEY`, a billed project, powers photo analysis, purchase evaluation, the two AI image edits and the sizing screenshot checker.
- `GOOGLE_GENERATIVE_AI_FREE_API_KEY`, an unbilled project, powers the outfit planner, the daily outfit feed and the My Style archetype grouping.
- `GOOGLE_GENERATIVE_AI_RAG_API_KEY`, a third unbilled project, powers the Explore feed.

Neither free key falls back to the paid key; a route reports a configuration error instead. `AGENTS.md` rule 6 forbids agents from calling the paid-key routes (`/api/items/analyze`, `/api/items/locate`, `/api/items/enhance`, `/api/purchases/evaluate`, `/api/sizing/extract`) with a real key, even for verification; only a human using the app may trigger a paid call. Set `SIZING_EXTRACT_MOCK` (see `app/.env.example`) to exercise the sizing route without any key. `GEMINI_MODEL` overrides the default `gemini-3.6-flash`, and `GEMINI_IMAGE_MODEL` overrides the default image-edit model.

When an AI call fails, the user sees a short generic message ending in a six-character reference such as `(ref 5ba5f4)`. The same reference is on the server log line with the real provider error, and in development every failure is also appended to `app/logs/ai-errors.log`. Free-tier calls are sometimes refused with a 503 "high demand" error when Google has no spare capacity; the app shows this as "The AI service is busy right now."

### Sample wardrobe

To test the planner and the purchase check without photographing anything, run `npm run seed:wardrobe` from `app/`. It signs in with your own account and adds 23 confirmed items forming a neutral, Singapore-appropriate wardrobe. Attributes are written directly, so no AI call is made. `npm run seed:wardrobe -- --remove` deletes only the seeded items, and `-- --reset` replaces them. Set `SEED_EMAIL` and `SEED_PASSWORD` to run it without prompts.

### Background removal

Photos are cut out and placed on white before analysis, entirely in the browser through `@imgly/background-removal` (AGPL-3.0) on `onnxruntime-web`, so the photo never leaves the device for this step. If the cutout fails, the app falls back to a Gemini image edit, then to a Gemini-drawn bounding box crop. The user always chooses which version to keep. See `app/public/vendor/background-removal/LICENSE.md` for the licence.

## Checks

From `app/`, run `npm run lint`, `npm test` and `npm run build`. `npm run build -- --webpack` is a supported alternative when the local Turbopack process cannot run. `.github/workflows/checks.yml` runs the same three commands, on Node 22.18, for every pull request and push to `main`.

## How the team worked

`AGENTS.md` is the standing product and engineering spec: problem statement, MVP scope, data model, AI workflows, security requirements and the rules every coding agent working on this repository has to follow, including a hard ban on agents spending the paid Gemini key. `UNSLOP.md` sets the writing style for anything user-facing or submitted. `.claude/skills/` (see its own `README.md`) packages both, plus the paid-key boundary, the Supabase migration convention and the pre-PR checks, as skills a coding agent loads before doing the matching kind of work.

Larger features were planned in writing before being built: `docs/plans/` holds the sizing, daily-outfit and My Style plans, each written against the actual code first, then updated with an "implementation notes" or "differs from the plan" section once the feature shipped. `docs/milestones-report.md` and `docs/assignment-evidence.md` are checked against the current code rather than describing what was originally intended, and call out where a claim from an earlier draft turned out to be wrong once a later feature (most notably the outfit-feedback loop) shipped.

Every pull request runs ESLint, the Node test suite and a production build in CI before it can merge (`.github/workflows/checks.yml`). Tests cover deterministic and authorization-sensitive logic, such as redirect-safety checks, analytics URL redaction, and AI key separation, rather than model output quality; `app/scripts/eval-sizing.mjs` is the one evaluation harness that does call a model, and it is gated so only a person, never an agent, runs it.

## Resources used

- The supplied Wearabouts cinematic landing reference and W-and-hanger mark, documented in `docs/design.md`.
- [Next.js documentation](https://nextjs.org/docs), [Supabase documentation](https://supabase.com/docs), [Vercel AI SDK docs](https://ai-sdk.dev/docs) and [Google Gemini API docs](https://ai.google.dev/gemini-api/docs).
- [data.gov.sg](https://data.gov.sg/) for the NEA weather forecast APIs.
- [Vercel Web Analytics](https://vercel.com/docs/analytics) and [Speed Insights](https://vercel.com/docs/speed-insights).
- [Supabase agent skills](https://github.com/supabase/agent-skills), vendored under `.agents/skills/` with provenance tracked in `skills-lock.json`.
- IMG.LY background removal; its licence is in `app/public/vendor/background-removal/LICENSE.md`.
- OpenAI Codex and Claude Code as AI coding assistants, used throughout the build under the constraints in `AGENTS.md` (branch names under `codex/` and the `.claude/` and `.agents/` directories in this repository record which tool did which work).

Confirm image and font attribution with the reference author before public launch.

## Repo layout

- `app/`: the Next.js application (see `app/README.md` for its route table and local checks).
- `app/supabase/schema.sql`: the whole database schema in one additive file.
- `AGENTS.md`: product spec, constraints and agent rules.
- `UNSLOP.md`: writing style rules applied to all user-facing copy.
- `.claude/skills/`: project-specific skills for coding agents working in this repository.
- `docs/`: milestone report, launch materials and feature plans; see the list below.

## Landing and onboarding

The public page follows the supplied Wearabouts cinematic HTML and design document. Registration leads to optional style, colour and occasion preferences, then the existing upload, AI review and confirmation flow. A saved confirmed item completes onboarding; returning accounts with confirmed items go straight to the wardrobe.

Without service variables configured, local development offers a clearly labelled preview login using `test@gmail.com` and `testtest`. It does not save preferences or clothing and is disabled in production.

Set `NEXT_PUBLIC_SITE_URL=https://wearabouts-zeta.vercel.app` for the Vercel Production environment, then redeploy; this controls the canonical homepage, sitemap and absolute social URLs. Without it, the app falls back to Vercel's production domain, then to `http://localhost:3000` locally. The site includes a generated Open Graph image, Twitter card, robots file and sitemap; account and wardrobe pages are marked `noindex`. Optional Google Analytics uses `NEXT_PUBLIC_GA_MEASUREMENT_ID` and loads only after consent. See `docs/launch-setup.md` for the full production checklist.

## Project documentation

- [`docs/milestones-report.md`](docs/milestones-report.md): the Phase 1 to 5 milestone write-up draft, checked against the current code.
- [`docs/assignment-evidence.md`](docs/assignment-evidence.md): a milestone-by-milestone map of what the repository proves and what still needs human verification.
- [`docs/release-readiness.md`](docs/release-readiness.md): current repository and deployment state, and what a human still has to do before submission.
- [`docs/design.md`](docs/design.md): the visual reference, design tokens and onboarding flow.
- [`docs/competitor-onboarding-review.md`](docs/competitor-onboarding-review.md): analysis of the supplied competitor onboarding screenshots.
- [`docs/launch-campaign.md`](docs/launch-campaign.md): draft Product Hunt listing and launch-day plan.
- [`docs/launch-setup.md`](docs/launch-setup.md): production site URL, analytics and social-preview setup checklist.
- [`docs/agents-md-proposal.md`](docs/agents-md-proposal.md): edits proposed for `AGENTS.md`, pending human approval.
- [`docs/plans/`](docs/plans/): the pre-build plans for sizing, daily outfits and saved outfits, and the My Style colour and archetype page, each updated with how the shipped code differs from it.

Reference images and fonts were extracted from the user-supplied `Wearabouts_Cinematic_Landing (3).html`. Confirm their provenance and distribution rights before public launch. Competitor screenshots under `competitor images/` are research references and are not served by the website.
