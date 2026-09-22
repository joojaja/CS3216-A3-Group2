# Wearabouts release readiness

Reviewed on 22 September 2026. Production URL supplied by the team: https://wearabouts-zeta.vercel.app.

## Repository and ownership

Fetched origin before implementation. Remote main was `12f408d`; local main already included `63bc994`, the analytics and branded social-card commit. GitHub listed one open pull request, [#10, chian/sizing-feature](https://github.com/joojaja/CS3216-A3-Group2/pull/10). This release does not merge or duplicate that work.

AGENTS.md already names Wearabouts. Its protected contents were not changed. The historical naming proposal now records that status. The repository tracks the Supabase and Postgres skills and their upstream hashes in `skills-lock.json`. No new skill dependency is needed.

## Live deployment finding

The supplied production homepage responds, but the production metadata previously inspected used `https://drape-zeta.vercel.app` for its canonical and social URLs. The project owner must set `NEXT_PUBLIC_SITE_URL=https://wearabouts-zeta.vercel.app` for Production and redeploy. The code now falls back to Vercel's production domain when this variable is absent, but an explicitly configured old origin still takes precedence. After deployment, verify the live HTML and external preview as described in `docs/launch-setup.md`.

The checkout has no `.vercel` project link and no Vercel CLI session established. The project belongs to a teammate. GitHub reports a successful Vercel status for remote main at `12f408d`, linked to the `drape` project in `joojajas-projects`. This establishes an existing Git integration. Check the deployment status after pushing the release commit.

## Deployment configuration

Use the Next.js framework preset and `app` as the root directory. Install with `npm ci`. The production build is `npm run build`; `npm run build -- --webpack` is also supported. Use Node 22.18 or newer for the repository tests.

Configure the Supabase URL and publishable key, the paid Gemini key for human-triggered photo workflows, the separate free planner key and the separate unbilled Explore key. Keep secrets in Vercel environment settings. Do not paste them into reports or commit them. Keep the existing database; the schema reset script is not a deployment migration.

Confirm the production site URL and `/auth/callback` in Supabase redirect configuration. Enable Web Analytics in Vercel. Check the Speed Insights plan and allowance before enabling any paid upgrade. GA4 is optional and requires its measurement ID and the application's consent flow.

## Local verification

The integrated change passes ESLint, all 20 Node tests and the Webpack production build, including TypeScript and all 23 static pages. The build initially caught a server-to-client callback serialization error in Speed Insights. Moving its callback into the client analytics wrapper fixed it. The generated Open Graph and Twitter outputs are identical 1200 by 630 PNGs. The Open Graph PNG was visually inspected for readable text and clipping. These checks made no paid AI requests.

A GitHub Actions workflow now runs dependency installation, lint, tests and the Webpack build on pull requests and main pushes, without supplying production secrets. It has not yet run on GitHub.

## Submission evidence still required

- Real analytics report and observation period, with findings based on actual visitors.
- Human verification of the paid photo analysis and purchase flows.
- Cross-user access checks against the configured Supabase project.
- Team names, matriculation numbers and contribution summaries.
- Actual model comparisons, model-quality evaluations and measured latency or costs.
- Final report and pitch PDF exports once missing evidence is supplied.

The supplied assignment text says 25 September 2026 at 11:59 PM. AGENTS.md retains 26 September at 7:59 AM. Check Coursemology for the authoritative deadline; do not rely on the later time. Internal completion remains 23 September.
