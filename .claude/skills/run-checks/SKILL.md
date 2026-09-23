---
name: run-checks
description: Run the exact lint, test and build checks Wearabouts requires before a pull request merges. Use before opening a PR, after finishing a code change, or when asked to verify the app still passes CI.
---

# Running the pre-PR checks

`.github/workflows/checks.yml` is the definition of "passes CI" for this repository. Match it exactly rather than approximating it, so a green local run means the same thing as a green PR run.

## Commands

All from `app/`, not the repository root (there is no root `package.json`):

```bash
npm ci
npm run lint
npx tsc --noEmit
npm test
npm run build -- --webpack
```

- `npm run lint` runs ESLint (`eslint.config.mjs`); no separate `next lint` step.
- `npx tsc --noEmit` typechecks the whole app. CI runs it after lint.
- `npm test` runs `node --test tests/*.test.mjs`, the built-in Node test runner importing TypeScript directly. This needs Node 22.18 or newer; on an older Node, the run fails with an import error that looks unrelated to the actual test, so check `node --version` first if that happens.
- `npm run build` normally uses Turbopack; CI and this project's own docs use the `--webpack` flag because the default Turbopack build has been unreliable in some sandboxed environments (a local port-binding failure). Use plain `npm run build` locally if Turbopack works for you, but use `-- --webpack` if you need to match CI exactly or if the default build fails to bind a port.

## What these checks do not cover

- They do not call Gemini. No test in `app/tests/` exercises a live model call; see the `no-paid-gemini` skill before adding one that would.
- They do not verify a live Supabase project, a live deployment, or cross-account authorization on real data. Those need a human with real credentials, exercising the actual deployed app; see `docs/deployment.md` for the production setup they would be checking.
- A green build does not mean a feature is wired into the actual user journey or works on a phone-sized screen. Check those by hand too.

## Before claiming a check "passes" in a doc or PR description

Actually run the command in this session and read its output. Do not describe lint, tests, or the build as passing based on a previous session's notes, a git log message, or an assumption that nothing broke; earlier drafts of this repository's own docs did that and had to be corrected once the claim was checked against the code. If dependencies are not installed in your working copy, run `npm ci` first rather than skipping the check.
