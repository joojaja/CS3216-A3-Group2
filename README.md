<p align="center">
  <img width="611" height="175" alt="image" src="https://github.com/user-attachments/assets/c0e38944-cea1-406e-9adf-55df1073d672" />
</p>

Wearabouts is a wardrobe-first clothing assistant for Singapore. You photograph the clothes you already own, get outfits built from them for an occasion and the day's NEA forecast, and check whether a new item duplicates something in your wardrobe before you buy it.

- Deployment: https://wearabouts-zeta.vercel.app
- Repository: https://github.com/joojaja/CS3216-A3-Group2

## Test the deployed application

Open the [Wearabouts deployment](https://wearabouts-zeta.vercel.app) and sign in with the shared test account:

| | |
| --- | --- |
| Email | `test@gmail.com` |
| Password | `testtest` |

Anything saved to this account is visible and editable by other reviewers. Do not upload personal or sensitive images.

## Application preview

https://github.com/user-attachments/assets/75a62ef2-0f81-4bb8-92a6-a14e29cf6908

| Add an item | Browse your wardrobe |
| --- | --- |
| ![A clothing photo becoming an editable wardrobe item](app/public/launch/product-hunt-slide-2.png) | ![The private wardrobe and its category filters](app/public/launch/product-hunt-slide-3.png) |

| Plan an outfit | Check a potential purchase |
| --- | --- |
| ![Outfit suggestions built from the user's wardrobe](app/public/launch/product-hunt-slide-4.png) | ![A purchase check compared with the user's existing wardrobe](app/public/landing/feature-purchase.webp) |

## Demo preview

https://github.com/user-attachments/assets/fee357a3-69dc-4327-93d4-7935eea01e90


## CS3216 Assignment 3, Team 2

| Name and GitHub | Matric Number | Contributions |
| :--- | :--- | :--- |
| Maahir Garg <br>([@maahir-garg](https://github.com/maahir-garg)) | A0284729M | Landing page and onboarding integration, analytics, Open Graph card and sitemap, security hardening, submission documentation |
| Brian ([@joojaja](https://github.com/joojaja)) | A0308053M | Outfit planner, purchase evaluation, Explore feed, free and premium tiers, repository and deployment owner |
| Chi An ([@tsaichian](https://github.com/tsaichian)) | A0309019H | Sizing, daily outfit feed, saved outfits and My Style |
| Sanjeev Ravichandran ([@sanjeevr123](https://github.com/sanjeevr123)) | A0273811H | Landing page hero, header, feature tour, pricing and story motion |

## What it does

- **Wardrobe.** Upload a photo. The browser removes the background, Gemini suggests category, colour, pattern, formality and weather tags, and you confirm or correct each one before saving.
- **Outfit planner.** Describe an occasion in plain English. The app plans two or three outfits from your confirmed items only, explains each one and uses the live Singapore forecast. Your feedback (too warm, too formal, disliked colours) shapes later plans.
- **Daily outfits.** Rules build valid outfits for today's weather, and the model ranks and explains three of them.
- **Purchase check.** Upload a screenshot of something you might buy. The app lists similar items you own and gives a verdict (likely redundant, potentially useful, fills a wardrobe gap, or not enough information) backed by that evidence.
- **Sizing.** Save your measurements once, then match them against stored brand charts or a size chart screenshot. The result names its source chart.
- **My Style and Explore.** A colour palette and style groups from your wardrobe, and a small curated catalogue ranked against it.

## Tech stack

Next.js 16 (App Router) with React 19 and TypeScript, Tailwind CSS v4, Supabase (Postgres, Auth, private Storage, row-level security), Google Gemini through the Vercel AI SDK with Zod-validated structured outputs, NEA forecasts from data.gov.sg, and Vercel for hosting, Web Analytics and Speed Insights. [`docs/architecture.md`](docs/architecture.md) maps each feature to its routes, model and rules.

## Local setup

### Requirements

- Node.js 22.18 or newer
- npm
- A Supabase project if you need persistent accounts, wardrobe data and private image storage
- Google AI Studio keys for the Gemini-backed features you want to test

The application can start without Supabase or Gemini credentials. In that mode, it provides a local preview that does not save data or run AI features.

### Install and start the app

```bash
git clone https://github.com/joojaja/CS3216-A3-Group2.git
cd CS3216-A3-Group2/app
npm ci
```

Copy the environment-variable template. On macOS, Linux, Git Bash or WSL, run:

```bash
cp .env.example .env.local
```

On Windows PowerShell, run:

```powershell
Copy-Item .env.example .env.local
```

Start the development server:

```bash
npm run dev
```

Open http://localhost:3000 after the development server starts. Without Supabase credentials, use `test@gmail.com` and `testtest` for the local preview. This preview does not save changes.

### Configure Supabase

1. Create a Supabase project.
2. Open its SQL editor and run [`app/supabase/schema.sql`](app/supabase/schema.sql). The script adds or updates the required application objects without deleting existing tables or rows.
3. Copy the project URL and publishable key into `.env.local` as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
4. Set the site URL to `http://localhost:3000` under Supabase Authentication.
5. Add `http://localhost:3000/auth/callback` to the allowed redirect URLs.
6. Start the application and create an account through `/login`.

Never commit `.env.local` or place private API keys in the repository.

### Configure Gemini

Add only the keys needed for the workflows you want to test. [`.env.example`](app/.env.example) documents every variable.

- `GOOGLE_GENERATIVE_AI_API_KEY` powers photo analysis, purchase checks, image edits and the sizing screenshot reader. Calls made through a project with billing enabled may incur charges.
- `GOOGLE_GENERATIVE_AI_FREE_API_KEY` powers the outfit planner, daily outfits and My Style.
- `GOOGLE_GENERATIVE_AI_RAG_API_KEY` powers Explore.

Neither free-tier key falls back to the billed key.

### Optional sample wardrobe

After configuring Supabase and creating an account, run `npm run seed:wardrobe` from `app/` to add 23 confirmed sample items without making an AI call. The script asks for that account's email and password. Run `npm run seed:wardrobe -- --remove` to remove only the generated sample items.

Production setup is in [`docs/deployment.md`](docs/deployment.md).

## Checks and CI

From `app/`, run `npm run lint`, `npx tsc --noEmit`, `npm test` and `npm run build -- --webpack`. GitHub Actions runs all four on every pull request and push to `main`, alongside a Markdown link check, a dependency audit and CodeQL security scanning. Dependabot opens weekly update pull requests for npm packages and Actions.

The 216 tests cover deterministic and security-sensitive code: size matching, outfit rules, colour families, AI error mapping, prompt cleaning, the purchase verdict rule, style-group repair and analytics URL redaction. `app/scripts/eval-sizing.mjs` evaluates the sizing model against screenshot fixtures and only runs when a person sets `SIZING_EVAL_I_AM_HUMAN=1`, because it spends the billed key.

## Documentation

- [`docs/architecture.md`](docs/architecture.md): how each feature is built and where the model sits in it.
- [`docs/analytics.md`](docs/analytics.md): analytics tools, event dictionary and funnels.
- [`docs/deployment.md`](docs/deployment.md): environment variables, Supabase, Vercel and analytics setup.
- [`docs/design.md`](docs/design.md): brand mark, design tokens and onboarding flow.
- [`docs/launch-campaign.md`](docs/launch-campaign.md): Product Hunt listing and launch plan.
- [`docs/size-chart-sources.md`](docs/size-chart-sources.md): sources for the stored brand size charts.
- [`app/README.md`](app/README.md): route table for the web app.

## Resources and credits

- [Next.js](https://nextjs.org/docs), [Supabase](https://supabase.com/docs), [Vercel AI SDK](https://ai-sdk.dev/docs) and [Gemini API](https://ai.google.dev/gemini-api/docs) documentation.
- [data.gov.sg](https://data.gov.sg/) NEA 2-hour, 24-hour and 4-day forecast APIs.
- [IMG.LY background removal](https://github.com/imgly/background-removal-js) (AGPL-3.0), bundled under `app/public/vendor/background-removal/` with its licence.
- The W-and-hanger mark and landing imagery were designed by the Wearabouts team. See [`docs/design.md`](docs/design.md).
- [Fraunces](https://fonts.google.com/specimen/Fraunces) and [Inter](https://fonts.google.com/specimen/Inter) (SIL Open Font License), self-hosted.
- This project was developed as part of the [**CS3216 Coursework Assignment 3 Artificial Intelligence**](https://cs3216.github.io/coursework/artificial-intelligence).

## Licence

MIT. See [`LICENSE`](LICENSE).
