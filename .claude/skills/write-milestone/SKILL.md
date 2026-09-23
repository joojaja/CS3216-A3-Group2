---
name: write-milestone
description: Write or update an answer to one of the CS3216 Assignment 3 milestones (M0 to M20) in docs/milestones-report.md, grounded in what the repository actually contains. Use whenever asked to fill in, update or check a milestone section, not just when writing the whole report.
---

# Writing a milestone answer

The 20 compulsory milestones (plus the ungraded problem statement) are listed in `AGENTS.md` under "CS3216 Assignment 3 milestones," and the working draft answering them is `docs/milestones-report.md`. `docs/assignment-evidence.md` is the shorter evidence map for the same milestones. Both exist because a milestone write-up for this course is graded partly on honesty about what is and is not built, not just on what is claimed.

## Method

1. **Find the evidence first, write second.** For a claim like "the outfit route uses stored feedback," find the actual code (`app/src/lib/outfit-feedback.ts`, `app/src/app/api/outfits/route.ts`) before writing the sentence, and cite the file. Do not write from memory of what the feature was supposed to do, or from an older doc, without checking the current code; this repository's own history has multiple examples of a milestone section going stale the moment a merge shipped a feature it described as missing.
2. **Never invent a number.** No latency figure, cost estimate, accuracy percentage, user count, or analytics result belongs in the report unless it came from an actual measurement made in this session or already recorded elsewhere with its method. If a metric is not measured, say "not measured" and describe the plan to measure it, the way the existing M11 and M12 sections do. A plausible-sounding made-up number is worse than an honest gap, because a marker checking milestone 11 (evaluation) is specifically checking whether claimed results are real.
3. **Distinguish "implemented in code" from "verified in production."** Code existing on `main` is evidence for the milestone; it is not evidence that the deployed app works, that a human tested it, or that real users produced the analytics being described. Say which one you mean, the way `docs/assignment-evidence.md`'s header does.
4. **Use the bracket convention for open items.** `docs/milestones-report.md` marks a field or evidence gap still to fill in with `[bracketed text]`, e.g. `[Add interview or survey method and results if the team has them.]`. Keep using that convention there rather than inventing a different placeholder style, so a final pass before PDF export can find every open item by searching for `[`.
5. **Run `unslop` on the result.** Milestone answers are graded prose; see the `unslop` skill before finishing.
6. **Check for a competing branch or plan first.** If the milestone touches a feature area, `git fetch` and check `git branch -a` and any relevant file in `docs/plans/` before writing, per `AGENTS.md` rule 3 and the team-coordination section. Do not describe a feature as shipped, in progress, or absent without checking the current branch state.

## Where the recurring facts live, so you do not have to re-derive them

- Model, keys and rate limits: `app/src/lib/ai/gemini.ts`, `app/.env.example`.
- Database shape and RLS: `app/supabase/schema.sql`.
- Route list and what each one does: `app/README.md`.
- What is merged versus still open: `git branch -a`, `docs/release-readiness.md`.
- Design tokens and brand mark provenance: `docs/design.md`.
