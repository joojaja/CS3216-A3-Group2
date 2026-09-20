# CS3216-A3-Group2

Repository for CS3216 Assignment 3, Group 2. The product is called Wearabouts.

Wearabouts is a wardrobe-first clothing assistant for Singapore. Users photograph their clothes, get outfits matched to the occasion and the live NEA weather forecast, and check whether a prospective purchase is redundant before buying.

## Team

<!-- Add matriculation numbers, names and contributions before submission -->

| Matriculation no. | Name | Contributions |
| --- | --- | --- |
| | | |

- Application URL: TBD
- Repository: https://github.com/joojaja/CS3216-A3-Group2

## Tech stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS v4 + Motion (`motion/react`) for animation
- Supabase: Postgres, Auth, private Storage, row-level security
- Google Gemini via the Vercel AI SDK for multimodal extraction and structured outputs
- NEA weather forecasts via the data.gov.sg open API
- Hosting: Vercel (planned)

## Getting started

```bash
cd app
cp .env.example .env.local   # fill in the values
npm install
npm run dev
```

### Supabase setup

1. Create a free project at supabase.com
2. For a new, empty project, run `app/supabase/schema.sql` in the SQL editor. It creates the tables, ownership policies, private image bucket and profile trigger. This script deletes existing application tables before recreating them. Do not run it against an existing team project to install this branch. The landing and onboarding changes require no schema migration.
3. Copy the project URL and publishable key into `.env.local`
4. Configure the site URL and allow the deployed `/auth/callback` URL under Authentication redirect URLs. For local development, allow `http://localhost:3000/auth/callback` as well. Registration supports both immediate sessions and email confirmation. Use a working mail configuration for confirmation delivery.

### Gemini setup

Get a free API key from Google AI Studio and put it in `GOOGLE_GENERATIVE_AI_API_KEY`.

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

<!-- List significant tutorials, templates and references here before submission -->

## Landing and onboarding

The public page follows the supplied Wearabouts cinematic HTML and design document. Registration leads to optional style, colour and occasion preferences, then the existing upload, AI review and confirmation flow. A saved confirmed item completes onboarding. Returning accounts with confirmed items continue to the wardrobe. Preferences remain editable from Profile.

Without service variables, local development offers a clearly labelled preview login using `test@gmail.com` and `testtest`. This does not save preferences or clothing. The preview login is disabled in production. Live verification needs a test account on the configured Supabase project and a working Gemini key.

Set `NEXT_PUBLIC_SITE_URL` to the deployed HTTPS origin before building. It controls canonical URLs, the sitemap and social links. The site includes an Open Graph image, Twitter card, robots file and sitemap. Account and wardrobe pages are marked `noindex`.

Optional Google Analytics uses `NEXT_PUBLIC_GA_MEASUREMENT_ID`. It loads after consent. Disable Enhanced Measurement in the GA4 web stream so automatically collected URL/form events do not bypass the curated funnel. See [launch setup](docs/launch-setup.md) for event verification and the report evidence still required.

## Verification and project documentation

Run `npm run lint`, `npm test` and `npm run build` from `app/`. The Node test runner requires Node 22.18 or newer to import TypeScript directly. If the local Turbopack process is blocked, `npm run build -- --webpack` is a supported alternative.

- [Design](design.md) records the reference, visual tokens and responsive behaviour.
- [Goals](goals.md) records this branch's scope and milestones.
- [Competitor review](docs/competitor-onboarding-review.md) documents the 24 supplied screenshots.
- [Assignment evidence](docs/assignment-evidence.md) maps all compulsory milestones without claiming missing evidence.
- [Verification](docs/verification.md) distinguishes automated checks, browser checks and live-service checks.

Reference images and fonts were extracted from the user-supplied `Wearabouts_Cinematic_Landing (3).html`. Confirm their provenance and distribution rights before public launch. Competitor screenshots are research references and are not served by the website.
