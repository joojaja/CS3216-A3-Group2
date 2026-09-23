# Wearabouts agent skills

Project-specific skills for coding agents working in this repository, referenced from `AGENTS.md` rule 1. Each one packages a rule from `AGENTS.md` or `UNSLOP.md` as concrete, checkable steps grounded in the current code, rather than restating the policy.

| Skill | Use it when |
| --- | --- |
| [`unslop`](unslop/SKILL.md) | Writing or editing any user-facing text: docs, `README.md`, landing copy, the milestone report. |
| [`no-paid-gemini`](no-paid-gemini/SKILL.md) | Testing, running, or debugging anything that touches `/api/items/analyze`, `/api/items/locate`, `/api/items/enhance`, `/api/purchases/evaluate`, `/api/sizing/extract`, or a `GOOGLE_GENERATIVE_AI_*` key. |
| [`add-supabase-migration`](add-supabase-migration/SKILL.md) | Adding a table, column, or policy to the database. |
| [`run-checks`](run-checks/SKILL.md) | Verifying a change before opening a pull request. |
| [`write-milestone`](write-milestone/SKILL.md) | Writing or updating an answer in `docs/milestones-report.md` or `docs/assignment-evidence.md`. |

`.agents/skills/supabase/` and `.agents/skills/supabase-postgres-best-practices/` are separate, vendored third-party skills (see `skills-lock.json` for their upstream source); they cover general Supabase and Postgres practice, not anything specific to Wearabouts, and this folder does not duplicate them.
