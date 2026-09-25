# Wearabouts agent skills

Project-specific skills for coding agents working in this repository, referenced from `AGENTS.md` rule 1. Each one packages a rule from `AGENTS.md` as concrete, checkable steps grounded in the current code, rather than restating the policy.

| Skill | Use it when |
| --- | --- |
| [`unslop`](unslop/SKILL.md) | Writing or editing any user-facing text: docs, `README.md`, landing copy, the milestone report. Holds the full writing rules. |
| [`no-paid-gemini`](no-paid-gemini/SKILL.md) | Testing, running, or debugging anything that touches `/api/items/analyze`, `/api/items/locate`, `/api/items/enhance`, `/api/purchases/evaluate`, `/api/sizing/extract`, or a `GOOGLE_GENERATIVE_AI_*` key. |
| [`add-supabase-migration`](add-supabase-migration/SKILL.md) | Adding a table, column, or policy to the database. |
| [`run-checks`](run-checks/SKILL.md) | Verifying a change before opening a pull request. |
| [`supabase`](supabase/SKILL.md) | Any Supabase work: auth, storage, RLS, client libraries. Vendored. |
| [`supabase-postgres-best-practices`](supabase-postgres-best-practices/SKILL.md) | Writing or reviewing SQL, indexes and policies. Vendored. |
| [`write-milestone`](write-milestone/SKILL.md) | Drafting or checking a milestone answer for `group-<number>-milestones.pdf`. |

`supabase` and `supabase-postgres-best-practices` are vendored from [supabase/agent-skills](https://github.com/supabase/agent-skills), with their upstream source recorded in `skills-lock.json` at the repository root. They cover general Supabase and Postgres practice; the skills above cover what is specific to Wearabouts.
