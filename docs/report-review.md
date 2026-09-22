# Report review notes

Reviewed 22 September 2026 against the supplied milestone template, current checked-out code and `AGENTS.md`. The substantive Phase 1 to 5 draft is `docs/milestones-report.md`; milestone evidence status is tracked in `docs/assignment-evidence.md`.

## Material corrections from the pasted draft

- Standardized the product name to Wearabouts. "Drape" remains only as a legacy name in internal identifiers and older materials.
- Corrected authentication to email and password through Supabase Auth. There is no Google sign-in in the current interface.
- Replaced claims about the old planned style-ranked inspiration feed with the implemented Explore feature: a small curated product catalogue, retrieved and ranked for a user with at least five confirmed items.
- Kept the occasion planner and purchase evaluator as implemented routes, with their real constraints and uncertainty described.
- Removed brand sizing recommendations from shipped scope. Profile data can include sizes, but no brand chart recommendation flow is on `main`. The sizing work is in the unmerged `chian/sizing-feature` branch / PR #10.
- Corrected the moat discussion: outfit feedback is stored, but the current outfit route does not retrieve it to alter later ranking. This is a plausible future advantage, not a demonstrated feedback loop.
- Replaced the old ad-free/affiliate/closet-size monetization claims with the actual landing page offer: a free beta and planned S$8.90/month Plus tier unavailable for purchase. No subscription or payment flow was found.
- Removed unsupported sample unit economics from the report. The earlier revenue, margin, conversion, CAC and payback figures were assumptions without usage or cost evidence.
- Quoted prompt behavior from the current API routes. Noted that prompts are inline and calls do not set explicit temperature, top-p or max-token parameters.
- Described the currently configured Gemini model adapter and key separation. Model comparisons are based on vendor documentation only; there has been no same-prompt head-to-head trial.
- Distinguished actual safeguards from untested claims. Called out that rate limits are in-memory per process, request MIME checks do not inspect file contents, and no adversarial or cross-account test results are supplied.
- Corrected the analytics section to include Vercel Web Analytics and Speed Insights plus optional, consent-gated GA4. No real analytics dashboard or observations were provided.
- Kept M11 evaluation results and M12 measured optimization results explicitly "not measured." Proposed metrics are not presented as outcomes.
- Added an explicit caveat that the logo and public-page imagery come from supplied reference material. The team must confirm provenance and rights before claiming authorship or redistributing.
- Avoided unverified claims about competitor market share, user counts beyond a current official Whering homepage statement, Singapore ranking, or unsupported competitor absences.

## Human data required before export

1. Confirm the Group 2 number and supplied production URL in the report. Add team names, matriculation numbers and actual contribution summaries.
2. Production rehearsal on the real URL with a demo account. Record the commit, date, browser/device, and any workflow defects. Do not use agent verification to call the paid Gemini routes with a real key.
3. Actual user research notes, if the team wants to keep any participant count or user-need claim. Include the method and avoid turning informal conversations into representative market evidence.
4. Evaluation set and actual results for M11. Record labels, sample count, prompt/model version, invalid output and invalid-ID counts, reviewer rubric and failure cases.
5. Measured latency and cost data for M12, plus the period and measurement method. Verify cache and rate-limit behavior in the deployed environment.
6. Analytics dashboard screenshot, actual date range and sample size for M19. Do not report event counts as unique users or conversion unless the exploration measures those quantities.
7. After the Vercel project owner sets the production site URL and redeploys, capture an external OG/social preview and verify production metadata for M18.
8. Three production workflow screenshots or a short demo capture for M16 to M17.
9. Source/creator and usage rights for the supplied logo, images and fonts. Confirm the list of name alternatives actually considered.
10. Review the draft Product Hunt copy and cover/gallery plan in `docs/launch-campaign.md`; replace the planned gallery captures with real production screenshots and decide whether a public launch is actually planned.
11. Confirm current deployment host and environment setup, public repository access and the final state of PR #10. Do not describe sizing as merged until it is.
12. Export the final milestones and two-page pitch PDFs, commit them as required, and visually inspect the PDF pages and links.

## Repository state reviewed

The working tree was clean at review start. Local `main` was at `63bc994` ("Add Vercel Analytics and Speed Insights, brand the Open Graph card"), one commit ahead of `origin/main` at `12f408d`. The visible remote feature branch `chian/sizing-feature` is not merged. The report and evidence map do not change code, `README.md` or `AGENTS.md`.
