---
name: write-milestone
description: Draft or check an answer to one of the CS3216 Assignment 3 milestones (M0 to M20) for group-<number>-milestones.pdf, grounded in what the repository actually contains. Use whenever asked to fill in, update or check a milestone answer.
---

# Writing a milestone answer

The 20 compulsory milestones (plus the ungraded problem statement) are listed in `AGENTS.md` under "CS3216 Assignment 3 milestones." The graded write-up is `group-<number>-milestones.pdf`, authored and exported outside this repository so the submitted PDF and the repository do not drift against each other. This skill is for drafting or checking milestone text before it goes into that PDF, grounded in the repository's actual code rather than memory of what a feature was supposed to do.

## Method

1. Find the evidence first, write second. For a claim like "the outfit route uses stored feedback," find the actual code (`app/src/lib/outfit-feedback.ts`, `app/src/app/api/outfits/route.ts`) before writing the sentence, and cite the file. This repository's own history has examples of a claim going stale the moment a later merge shipped the feature it described as missing.
2. Never invent a number. No latency figure, cost estimate, accuracy percentage, user count or analytics result belongs in the write-up unless it came from an actual measurement made in this session or already recorded elsewhere with its method. If a metric is not measured, say so and describe the plan to measure it. A plausible-sounding made-up number is worse than an honest gap, because the evaluation milestone specifically checks whether claimed results are real.
3. Distinguish implemented in code from verified in production. Code existing on `main` is evidence for the milestone. It is not evidence that the deployed app works, that a human tested it, or that real users produced the analytics being described. Say which one you mean.
4. Run the `unslop` skill on the result. Milestone answers are graded prose.
5. Check for a competing branch or plan first. If the milestone touches a feature area, `git fetch` and check `git branch -a` before writing, per `AGENTS.md` rule 3 and the team-coordination section. Do not describe a feature as shipped, in progress or absent without checking the current branch state.

## Where the recurring facts live, so you do not have to re-derive them

- Feature-by-feature model, route and deterministic-rule mapping: `docs/architecture.md`.
- Model, keys and rate limits: `app/src/lib/ai/gemini.ts`, `app/.env.example`.
- Database shape and RLS: `app/supabase/schema.sql`.
- Route list and what each one does: `app/README.md`.
- What is merged versus still open: `git branch -a`.
- Design tokens and brand mark provenance: `docs/design.md`.
- Deployment, environment variables and analytics setup: `docs/deployment.md`.
