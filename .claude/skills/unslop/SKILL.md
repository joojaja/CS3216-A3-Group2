---
name: unslop
description: Apply the Wearabouts UNSLOP.md writing rules to any user-facing text, documentation, commit message body, or write-up before it ships. Use when drafting or editing README files, docs/, the milestone report, landing or onboarding copy, or any prose a person (not just code) will read.
---

# Unslop

`AGENTS.md` rule 1 requires every agent to read and apply `UNSLOP.md` (repository root) to everything user-facing it writes. This skill is the operational checklist for doing that in this repository specifically.

## When to run this

Before finishing any task that produces prose: a doc in `docs/`, `README.md`, `app/README.md`, landing or onboarding copy in `app/src/`, a milestone or pitch write-up, or a PR description. Not needed for code comments or commit subject lines, though the same instincts help there too.

## Checklist

1. Read `UNSLOP.md` in full if you have not already this session; its rule numbers are cited below and are stable.
2. Scan the text for:
   - Em dashes (rule 13). This repository has none outside vendored files; keep it that way. Use a period or comma instead.
   - Curly quotes (rule 19). Straight quotes only.
   - Title Case Headings (rule 17). Every heading in this repo is sentence case: `## How the team worked`, not `## How The Team Worked`.
   - Inline bold-label lists (rule 16): `**Label:** restates the line`. Convert to prose, or to a bold lead-in that ends in a period and is followed by new detail (`**Cover graphic.** Use ...`).
   - AI vocabulary (rule 7): delve, crucial, enduring, fostering, garner, interplay, intricate, pivotal, showcase, tapestry, testament, underscore, vibrant, leverage, utilize.
   - Filler and hedging (rules 23, 24): "in order to", "it is important to note that", stacked hedges.
   - Passive voice where an actor is known (rule 29).
3. Self-audit: read it back and ask what specifically makes a sentence say nothing about this project. Cut or rewrite it (rule 27). A sentence about Wearabouts should name a file, a route, a number, or a concrete behavior, not a mood.
4. For anything making a claim about the shipped product (a feature exists, a metric holds, a check passed), verify it against the actual code or a command you ran in this session before writing it down. `AGENTS.md`'s honesty principle and this repository's own history of stale claims (see `docs/release-readiness.md`) both depend on this, not just style.

## Known repository quirks

- "Drape" is the retired working name. It is correct only in a clearly historical sentence (a past commit, an old file, a naming-history note); everywhere else, use Wearabouts.
- The milestone report and evidence map (`docs/milestones-report.md`, `docs/assignment-evidence.md`) use `[bracketed text]` for a submission field or evidence gap still to fill in, matching that document's own stated convention. Keep using that pattern there rather than inventing a new one.
- Do not add a Co-Authored-By trailer or credit an AI assistant as a commit or PR author; naming a coding tool in a resources or acknowledgments section of a document is fine and expected.
