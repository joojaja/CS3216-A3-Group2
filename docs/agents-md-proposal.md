# Proposed edits to AGENTS.md

`AGENTS.md` rule 2 requires explicit human approval for any change to that file. Nobody has edited it as part of this documentation pass. This file lists the proposed edits for a human to review. Each entry gives the location, the current text, the replacement text and the reason. Supersedes `docs/agents-update-proposal.md`, which recorded a name change (Drape to Wearabouts) that has already been applied and is no longer pending.

## 1. Add the sizing route and the third AI key to the paid-Gemini rule

**Location:** rule 6, "Never spend on the paid Gemini tier."

**Current text:**

> Agents must not make any call that is billed to the paid Google project, for any reason, including verification. That means never calling the Gemini API directly with `GOOGLE_GENERATIVE_AI_API_KEY`, never running probes, scripts or browser tests that reach `/api/items/analyze`, `/api/items/locate`, `/api/items/enhance` or `/api/purchases/evaluate` with a real key, and never routing new work to the paid key. Test those routes with mocked responses or in the unconfigured demo mode. Only a human using the app may trigger a paid call. The outfit planner runs on `GOOGLE_GENERATIVE_AI_FREE_API_KEY`; agents may exercise it during verification, sparingly, within its free-tier limits

**Replacement text:**

> Agents must not make any call that is billed to the paid Google project, for any reason, including verification. That means never calling the Gemini API directly with `GOOGLE_GENERATIVE_AI_API_KEY`, never running probes, scripts or browser tests that reach `/api/items/analyze`, `/api/items/locate`, `/api/items/enhance`, `/api/purchases/evaluate` or `/api/sizing/extract` with a real key, and never routing new work to the paid key. Test those routes with mocked responses (`SIZING_EXTRACT_MOCK` covers sizing) or in the unconfigured demo mode. Only a human using the app may trigger a paid call. The outfit planner, the Explore feed and the style and daily-outfit features run on unbilled free-tier keys (`GOOGLE_GENERATIVE_AI_FREE_API_KEY` and `GOOGLE_GENERATIVE_AI_RAG_API_KEY`); agents may exercise these during verification, sparingly, within their free-tier limits

**Reason:** the codebase now has a route that spends the paid key but is missing from the off-limits list. `app/src/app/api/sizing/extract/route.ts` calls `getModel("paid")`, the same billed project as photo analysis and purchase evaluation, but rule 6 does not name it. Separately, the code has grown a third, unbilled key (`GOOGLE_GENERATIVE_AI_RAG_API_KEY`, used by `/api/explore`) and two more free-tier routes (`/api/style/archetypes`, `/api/daily-outfits`) that rule 6 does not mention at all, so an agent reading the current rule has no guidance on whether exercising them is allowed. Verified against `app/src/app/api/sizing/extract/route.ts`, `app/src/app/api/explore/route.ts`, `app/src/app/api/style/archetypes/route.ts`, `app/src/app/api/daily-outfits/route.ts` and `app/.env.example`.

## 2. Confirm the submission deadline against Coursemology

**Location:** "Deadline and scope," first paragraph, and rule 5.

**Current text:**

> The web application must be fully completed by **23 September 2026**. The official CS3216 Assignment 3 submission deadline is **26 September 2026 at 7:59 am**, so the 23rd is the internal completion date and leaves a short buffer for submission material

**Proposed action:** no text change yet, pending a human check. Fetching `https://cs3216.github.io/coursework/artificial-intelligence` today returned "Saturday, 26 September 2026 at 7:59 am" as the submission deadline in that page's overview table, which matches the date already in `AGENTS.md`. Several working notes written earlier in this repository (`docs/release-readiness.md`, `docs/report-review.md`, now consolidated) instead say the deadline is "25 September 2026 at 11:59 PM," attributed to "the supplied assignment text," a source not in this repository. The two figures disagree by a day and by roughly eight hours.

**Reason:** a wrong final deadline is the single highest-cost documentation error this project could ship with. The public course page currently agrees with `AGENTS.md`, but a human should check the authoritative source the earlier notes were reading (likely Coursemology, which needs a login this session does not have) before the team treats the question as settled, since course pages and Coursemology entries can be edited independently and the earlier notes would not have invented a specific date and time.

## 3. Point agents at the project skills folder

**Location:** rule 1, "Read UNSLOP.md first."

**Current text:**

> Every agent must read and process `UNSLOP.md` in the repository root and apply it to all user-facing text, documentation, write-ups and marketing copy it produces

**Replacement text:**

> Every agent must read and process `UNSLOP.md` in the repository root and apply it to all user-facing text, documentation, write-ups and marketing copy it produces. `.claude/skills/` packages this and the other repository-specific rules (the paid-Gemini boundary, Supabase migration conventions, the checks to run before a PR, and how to write a milestone answer from evidence) as loadable skills; use them where they apply

**Reason:** the project now has a `.claude/skills/` folder built for this exact purpose. Pointing rule 1 at it, in the one place agents are already told to read carefully, makes the skills discoverable without adding a new numbered rule. This is a low-risk documentation pointer, not a policy change, but it still touches a protected file and needs sign-off under rule 2.

## Not proposed

- No change to the 20 September 2026 naming confirmation or the Wearabouts name itself; the code, `README.md` and `docs/` are consistent with it.
- No change to the milestone list or phase structure; spot-checking M7 to M13 against the current routes and schema did not surface a mismatch worth a diff.
- No change to the "roughly 8 days" framing in "Deadline and scope." It reads oddly on the completion date itself (23 September 2026), but it is a planning constant from when the section was written, not a factual claim about today, and rewording it does not change what anyone should do next.
