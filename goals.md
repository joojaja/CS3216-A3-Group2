# Wearabouts release goals

Internal completion date: 23 September 2026. Current branch: `main`. Release review: 22 September 2026.

## Current release scope

Finish Vercel analytics, social previews, launch materials and the Phase 1 to 5 report. Verify the integrated application for https://wearabouts-zeta.vercel.app. Remote main was fetched before work. The only open pull request was #10, `chian/sizing-feature`. Sizing remains with its author and must not be described as shipped until merged and verified.

AGENTS.md already uses Wearabouts. No naming edit is pending. The tracked `.agents/skills` directory contains Supabase and Postgres guidance, with provenance in `skills-lock.json`. Current verification and deployment blockers are recorded in `docs/release-readiness.md`.

The following sections record the earlier landing and onboarding work. Their branch ownership, open-PR observations and deployment boundaries describe that earlier task only.

## Agreed scope

Complete the reference-based landing page and onboarding through the first confirmed clothing item. Reuse existing private storage and AI analysis. Other features remain with the teammate working on them. The user confirmed Wearabouts as the product name on 20 September 2026.

## Milestones

1. Repository and reference review. Complete. Read repository guidance, inspected remote branches and open pull requests, reviewed all 24 competitor screenshots with Luna agents, and reviewed both supplied assignment references. No open pull requests were found. Both existing feature branches were already merged into main.
2. Public landing. Implemented. Includes reference imagery, cinematic desktop narrative, static mobile/reduced-motion fallback, features, illustrative purchase check, free beta pricing and clearly planned Plus pricing.
3. First-use journey. Implemented. Registration, optional preferences, persisted resume marker, existing upload and editable AI review, explicit confirmation and saved-item completion. Real-service verification remains pending configuration.
4. Launch requirements. Implemented in code. Metadata, canonical URLs, social card, robots, sitemap, privacy page and consent-based analytics. Deployed URL, analytics property and report evidence remain pending.
5. Regression and visual verification. Local checks complete, live checks pending configuration. See `docs/verification.md` for measured results and service limits.
6. Documentation and handoff. Design, setup, competitor review and assignment evidence were added for the landing work. The AGENTS.md naming update is now present.

## Completion criteria

A new account can save preferences, resume after reload, upload one garment, correct an AI suggestion, confirm it and view the saved item. Mobile navigation and keyboard controls work. Existing wardrobe, planner, evaluator and profile routes remain accessible. Live claims require live evidence; a local preview or mocked response does not satisfy persistence or authorization verification.

## Explicit boundaries

No redesign or implementation of teammate-owned recommendation, purchase-evaluation or feedback logic. No destructive schema reset. No deployment or production data changes. Existing API contracts stay compatible.
