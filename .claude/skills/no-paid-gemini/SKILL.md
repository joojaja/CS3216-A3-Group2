---
name: no-paid-gemini
description: Verify or test any Wearabouts route that calls Gemini without spending on the paid Google project. Use before running, curling, writing a test against, or debugging /api/items/analyze, /api/items/locate, /api/items/enhance, /api/purchases/evaluate, /api/sizing/extract, or anything that reads GOOGLE_GENERATIVE_AI_API_KEY.
---

# No paid Gemini calls

`AGENTS.md` rule 6 bans agents from making any call billed to the paid Google project, for any reason, including verification. This skill is how to actually get useful verification done inside that constraint.

## The three keys, and what each one may touch

| Env var | Billing | Routes | Agents may call it? |
| --- | --- | --- | --- |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Paid | `/api/items/analyze`, `/api/items/locate`, `/api/items/enhance`, `/api/purchases/evaluate`, `/api/sizing/extract` | No, never. Only a human using the app. |
| `GOOGLE_GENERATIVE_AI_FREE_API_KEY` | Unbilled | `/api/outfits`, `/api/daily-outfits`, `/api/style/archetypes` | Yes, sparingly, within the free-tier rate limit. |
| `GOOGLE_GENERATIVE_AI_RAG_API_KEY` | Unbilled | `/api/explore` | Yes, sparingly, within the free-tier rate limit. |

Neither free key falls back to the paid key; a route with a missing free key returns a configuration error instead of silently spending. Check `app/src/lib/ai/gemini.ts` (`getModel(tier)`) if a new route's key tier is unclear before assuming either way.

## How to verify a paid-key route without paying

1. **Prefer unit tests over the network.** Most of the interesting logic in these routes (schema validation, similarity scoring, size-chart matching, ID filtering) is pure and already covered by fast tests in `app/tests/*.test.mjs` that never touch the model. Add a test there instead of exercising the live route when you are checking deterministic behavior.
2. **Use the route's own mock switch where one exists.** `/api/sizing/extract` reads `SIZING_EXTRACT_MOCK` (development only, ignored in production) and answers canned results keyed off the uploaded file name (`nochart`, `flat`, `shaky`, `notclothing`); see `app/.env.example` and `app/tests/fixtures/sizing/README.md`.
3. **Run the app unconfigured.** Leaving `GOOGLE_GENERATIVE_AI_API_KEY` unset makes the paid routes report a clear configuration error instead of calling out, which is enough to check the surrounding UI states (loading, error, retry) without spending anything.
4. **Never construct a request to a paid route with a real key**, whether through a browser test, a curl command, a script, or a "just this once to confirm" probe. If a check genuinely requires a real model response on the paid key, say so and hand it to a human instead of finding a workaround.
5. **The free-tier routes are fair game, sparingly.** Exercising `/api/outfits`, `/api/daily-outfits`, `/api/style/archetypes` or `/api/explore` with a real free-tier key during verification is allowed. Expect occasional 503 "high demand" responses; that is Google's free tier being out of capacity, not a bug.
6. **The one real evaluation harness is human-gated.** `app/scripts/eval-sizing.mjs` calls the paid key on purpose to score sizing extraction. It refuses to run without `SIZING_EVAL_I_AM_HUMAN=1`. Do not set that variable or run that script as an agent; if the sizing eval needs to be run, ask a person to run it and report the results.

## If you are not sure

If a route's key tier isn't obvious from this table, read `app/src/lib/ai/gemini.ts` and the route file before assuming it is safe. When genuinely unsure whether a planned action would spend the paid key, don't run it; ask instead.
