# CS3216-A3-Group2

Repository for CS3216 Assignment 3, Group 2. The product is called Wearabouts.

Wearabouts is a wardrobe-first clothing assistant for Singapore. Users photograph their clothes, get outfits matched to the occasion and the live NEA weather forecast, and check whether a prospective purchase is redundant before buying.

## Team

<!-- Add matriculation numbers, names and contributions before submission -->

| Matriculation no. | Name | Contributions |
| --- | --- | --- |
| | | |

- Application URL: https://wearabouts-zeta.vercel.app
- Repository: https://github.com/joojaja/CS3216-A3-Group2

## Tech stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS v4 + Motion (`motion/react`) for animation
- Supabase: Postgres, Auth, private Storage, row-level security
- Google Gemini via the Vercel AI SDK for multimodal extraction and structured outputs
- NEA weather forecasts via the data.gov.sg open API
- Hosting: Vercel

## Getting started

```bash
cd app
cp .env.example .env.local   # fill in the values
npm ci
npm run dev
```

### Supabase setup

1. Create a free project at supabase.com
2. For a new, empty project, run `app/supabase/schema.sql` in the SQL editor. It creates the tables, ownership policies, private image bucket and profile trigger. This script deletes existing application tables before recreating them. Do not run it against an existing team project to install this branch. The landing and onboarding changes require no schema migration.
3. Copy the project URL and publishable key into `.env.local`
4. Configure the site URL and allow the deployed `/auth/callback` URL under Authentication redirect URLs. For local development, allow `http://localhost:3000/auth/callback` as well. Registration supports both immediate sessions and email confirmation. Use a working mail configuration for confirmation delivery.

### Gemini setup

Configure only the AI keys needed for the workflows you intend to use. Photo analysis, purchase evaluation and image editing use `GOOGLE_GENERATIVE_AI_API_KEY`, which belongs to a billed Google project. Outfit planning uses `GOOGLE_GENERATIVE_AI_FREE_API_KEY` from a separate project without billing. The Explore feed uses `GOOGLE_GENERATIVE_AI_RAG_API_KEY` from another unbilled project. Neither free key falls back to the paid key. Keep all keys in local environment files or the Vercel environment settings, never in source control. Agents must not call the paid analysis, locate, enhance or purchase routes with a real key; verify them with mocked responses or an unconfigured preview. Only a human using the app may trigger a paid request.

When an AI call fails, the user sees a short generic message ending in a six-character reference such as `(ref 5ba5f4)`. The same reference is on the server log line, which carries the real provider error: in the terminal running `next dev`, and in production in the Vercel function logs. In development every failure is also appended to `app/logs/ai-errors.log` as one JSON line with the reference, status, the unwrapped cause, retry count, the provider response, the model and key used, timing and, for schema failures, the raw model output; and the planner shows the cause under the error, marked "Development only". Production responses never include it. Free-tier calls are routinely refused with a 503 "high demand" error when Google has no spare capacity; the app shows this as "The AI service is busy right now".

Billing belongs to the Google project, not the individual key. Linking billing can make requests from that project billable. The planner and Explore feed use separate unbilled projects and report a configuration or availability error if their keys are missing; they never fall back to the paid key. Google states that it does not use paid-tier inputs to improve its models. Check the provider's current data-use terms before production use.

### Sample wardrobe

To test the planner and the purchase check without photographing anything, run `npm run seed:wardrobe` from `app/`. It signs in with your own account (the password is prompted and never echoed) and adds 23 confirmed items: a minimalist, neutral-palette wardrobe for Singapore, from linen shirts and tailored shorts to an unlined blazer for air-conditioned rooms, sandals for rain, a canvas tote, one activewear piece and one pyjama set the planner should learn to leave alone. Attributes are written directly, so no AI call is made and nothing is spent. Each item gets a generated tile image in the same style as the app's placeholders. The samples are marked in `user_notes`; `npm run seed:wardrobe -- --remove` deletes only them, and `-- --reset` replaces them. Set `SEED_EMAIL` and `SEED_PASSWORD` to run it without prompts.

### Background removal

Photos are cut out and placed on white before analysis. This runs entirely in the browser through `@imgly/background-removal` (AGPL-3.0) on `onnxruntime-web`, so the photo never leaves the device for this step. The first use downloads a 40 MB model from the IMG.LY CDN, which the browser then caches. Users can switch back to the original photo at any point, and HEIC photos skip the step because browsers other than Safari cannot decode them.

The model works by contrast, so a pale garment on a pale surface defeats it. When the cutout fails, the app falls back to the Gemini image model (`/api/items/enhance`), which understands what a garment is and isolates it onto white. If that also fails, it asks Gemini only for the garment's bounding box (`/api/items/locate`) and crops the photo to it. The user always chooses which version to keep, and the original is never more than a tap away.

Two AI edits are also available on request: **Isolate with AI** cuts the garment onto white, and **Iron with AI** renders it flat like a catalogue photo. Both run on `gemini-3.1-flash-lite-image` and cost about 3 US cents per image, so the Google project needs a billing account and the calls are rate-limited to 10 a minute per user. Generated images can change small details such as printed text, which the interface says plainly, and every saved item records which version was stored in `ai_confidence.image_source`. Paid-tier requests are not used by Google to improve its models.

## Repo layout

- `app/` — the Next.js application
- `app/supabase/schema.sql` — the whole database schema in one file
- `AGENTS.md` — product spec, constraints and agent rules
- `UNSLOP.md` — writing style rules applied to all user-facing copy

## Resources used

- The supplied Wearabouts cinematic landing reference and W/hanger artwork, documented in [design.md](design.md).
- [Next.js documentation](https://nextjs.org/docs) and version-matched guides in `app/node_modules/next/dist/docs`.
- [Vercel Web Analytics](https://vercel.com/docs/analytics) and [Speed Insights](https://vercel.com/docs/speed-insights).
- [Supabase documentation](https://supabase.com/docs) and [Supabase agent skills](https://github.com/supabase/agent-skills).
- [Vercel AI SDK](https://ai-sdk.dev/docs) and [Google Gemini API](https://ai.google.dev/gemini-api/docs).
- [data.gov.sg weather APIs](https://data.gov.sg/).
- IMG.LY background removal and its licence in `app/public/vendor/background-removal/LICENSE.md`.

Confirm image and font attribution with the reference author before submission.

## Landing and onboarding

The public page follows the supplied Wearabouts cinematic HTML and design document. Registration leads to optional style, colour and occasion preferences, then the existing upload, AI review and confirmation flow. A saved confirmed item completes onboarding. Returning accounts with confirmed items continue to the wardrobe. Preferences remain editable from Profile.

Without service variables, local development offers a clearly labelled preview login using `test@gmail.com` and `testtest`. This does not save preferences or clothing. The preview login is disabled in production. Live verification needs a test account on the configured Supabase project and a working Gemini key.

Set `NEXT_PUBLIC_SITE_URL=https://wearabouts-zeta.vercel.app` for the Vercel Production environment, then redeploy. This value controls the canonical homepage, sitemap and absolute social URLs. When unset, the app uses Vercel's production domain; local development falls back to `http://localhost:3000`. The site includes a generated Open Graph image, Twitter card, robots file and sitemap. Account and wardrobe pages are marked `noindex`. See [launch setup](docs/launch-setup.md) for the production owner checklist.

Optional Google Analytics uses `NEXT_PUBLIC_GA_MEASUREMENT_ID`. It loads after consent. Disable Enhanced Measurement in the GA4 web stream so automatically collected URL/form events do not bypass the curated funnel. Vercel Web Analytics and Speed Insights are always on; they are cookieless and redact item IDs to `/wardrobe/item`. See [launch setup](docs/launch-setup.md) for event verification and the report evidence still required.

## Verification and project documentation

Run `npm run lint`, `npm test` and `npm run build` from `app/`. The Node test runner requires Node 22.18 or newer to import TypeScript directly. If the local Turbopack process is blocked, `npm run build -- --webpack` is a supported alternative.

- [Design](design.md) records the reference, visual tokens and responsive behaviour.
- [Goals](goals.md) records this branch's scope and milestones.
- [Competitor review](docs/competitor-onboarding-review.md) documents the 24 supplied screenshots.
- [Assignment evidence](docs/assignment-evidence.md) maps all compulsory milestones without claiming missing evidence.
- [Milestones report](docs/milestones-report.md) contains the revised Phase 1 to 5 draft.
- [Launch campaign](docs/launch-campaign.md) contains Product Hunt copy and gallery materials.
- [Release readiness](docs/release-readiness.md) records deployment checks and blockers.
- [Verification](docs/verification.md) distinguishes automated checks, browser checks and live-service checks.

Reference images and fonts were extracted from the user-supplied `Wearabouts_Cinematic_Landing (3).html`. Confirm their provenance and distribution rights before public launch. Competitor screenshots are research references and are not served by the website.
