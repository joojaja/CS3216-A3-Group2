# Wearabouts landing and onboarding goals

Internal completion date: 23 September 2026. Branch: `codex/landing-onboarding`.

## Agreed scope

Complete the reference-based landing page and onboarding through the first confirmed clothing item. Reuse existing private storage and AI analysis. Other features remain with the teammate working on them. The user confirmed Wearabouts as the product name on 20 September 2026.

## Milestones

1. Repository and reference review. Complete. Read repository guidance, inspected remote branches and open pull requests, reviewed all 24 competitor screenshots with Luna agents, and reviewed both supplied assignment references. No open pull requests were found. Both existing feature branches were already merged into main.
2. Public landing. Implemented. Includes reference imagery, cinematic desktop narrative, static mobile/reduced-motion fallback, features, illustrative purchase check, free beta pricing and clearly planned Plus pricing.
3. First-use journey. Implemented. Registration, optional preferences, persisted resume marker, existing upload and editable AI review, explicit confirmation and saved-item completion. Real-service verification remains pending configuration.
4. Launch requirements. Implemented in code. Metadata, canonical URLs, social card, robots, sitemap, privacy page and consent-based analytics. Deployed URL, analytics property and report evidence remain pending.
5. Regression and visual verification. Local checks complete, live checks pending configuration. See `docs/verification.md` for measured results and service limits.
6. Documentation and handoff. Documentation complete apart from the proposed AGENTS.md edit. Design, setup, competitor review and assignment evidence are maintained in this branch. Exact AGENTS.md naming edits await the approval requested under its existing rule.

## Completion criteria

A new account can save preferences, resume after reload, upload one garment, correct an AI suggestion, confirm it and view the saved item. Mobile navigation and keyboard controls work. Existing wardrobe, planner, evaluator and profile routes remain accessible. Live claims require live evidence; a local preview or mocked response does not satisfy persistence or authorization verification.

## Explicit boundaries

No redesign or implementation of teammate-owned recommendation, purchase-evaluation or feedback logic. No destructive schema reset. No deployment or production data changes. Existing API contracts stay compatible.
