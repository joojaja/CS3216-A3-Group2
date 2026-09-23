# Architecture

Wearabouts is a Next.js 16 App Router application in `app/`, backed by Supabase (Postgres, Auth, private Storage, row-level security) and Google Gemini through the Vercel AI SDK. API routes are Next.js route handlers under `app/src/app/api/`. Deterministic logic, the parts that do not need a model, lives in `app/src/lib/`.

Every database read and write goes through a request-scoped Supabase client (`app/src/lib/supabase/server.ts`) that carries the signed-in user's session. Every table has a row-level security policy that checks `user_id` against `auth.uid()`, so authorization holds even if a route forgot to filter by user.

All Gemini access goes through one factory, `app/src/lib/ai/gemini.ts`. `getModel(tier)` picks between two Google projects: `GOOGLE_GENERATIVE_AI_API_KEY` (paid, used whenever a route sends a user's photo) and `GOOGLE_GENERATIVE_AI_FREE_API_KEY` (unbilled, used for text-only calls). A third unbilled project, `GOOGLE_GENERATIVE_AI_RAG_API_KEY`, powers Explore alone through `getRagModel()`. No free-tier call falls back to the paid key, even when the free key is missing.

The default text model is `gemini-3.6-flash` (`GEMINI_MODEL`); image edits use `gemini-3.1-flash-lite-image` (`GEMINI_IMAGE_MODEL`). Every call uses `generateObject` against a Zod schema in `app/src/lib/schemas/ai.ts`, so a malformed response never reaches storage. `aiFailure` and `reportAiError` turn a provider error into a short user-facing message plus a six-character reference code, and log the real cause server-side, to `app/logs/ai-errors.log` in development only. `checkRateLimit` (`app/src/lib/rate-limit.ts`) is an in-memory per-user limiter applied to every AI route.

## Wardrobe upload and tagging

Routes: `POST /api/items/analyze` for attribute extraction, `POST /api/items/locate` for a bounding-box crop fallback, `POST /api/items/enhance` for the Isolate and Iron image edits, `/api/items` for create, update and delete. Pages: `/wardrobe`, `/wardrobe/new`, `/wardrobe/[id]`.

A photo is cut out client-side with `@imgly/background-removal` before upload (`app/public/vendor/background-removal/`), so the image never leaves the device for that step. If that fails, `enhance` asks the paid image model to isolate the garment on white. If that also fails, `locate` asks the paid text model for a bounding box (`garmentLocationSchema`) and the client crops it. The user always picks which version to keep.

`analyze` sends the chosen photo to the paid model with `clothingAttributesSchema`: category, subcategory, colours, pattern, material cues, formality, layering role, weather tags, confidence notes and uncertain fields. The client shows every field in an editable form. Nothing is written to `wardrobe_items` until the user confirms it, and a stored `attributes_confirmed` flag keeps an unconfirmed item out of outfit and purchase logic.

## Outfit planner

Route: `POST /api/outfits`. Page: `/planner`.

`app/src/lib/outfits/server.ts` loads the user's confirmed wardrobe items, profile preferences and `loadFeedbackContext`, which turns the last 40 feedback rows and saved outfits into a per-item score (`app/src/lib/outfit-feedback.ts`: wore +3, liked +2, rejected -3, dismissed 0, a save counts as a like, only the newest response per recommendation counts). `app/src/lib/weather.ts` fetches the NEA 24-hour and four-day forecasts from data.gov.sg and caches the response for 900 seconds in the Next.js data cache.

The free-tier model receives the occasion text, forecast summary, preferences, per-item feedback scores and the full item list with IDs, and returns 1 to 3 outfits through `outfitSelectionSchema`. The route filters every returned item ID against the user's actual wardrobe before saving or displaying anything, so an invented ID is dropped rather than shown.

## Daily outfits

Route: `GET /api/daily-outfits`. Page: `/wardrobe/today`.

This feed is rules-first. `app/src/lib/outfits/daily-rules.ts` builds every valid combination from the day's hard filters (weather suitability, required roles, a 7-day repeat penalty, a 3-day recent-item penalty) and scores them. Outerwear is added only on rainy days, and only from items tagged for rain.

A free-tier model call (`app/src/lib/outfits/daily-prompt.ts`) then picks and explains three of the top candidates by candidate number, not item ID, so it cannot add or invent a garment. A failed or invalid response falls back to the rules' own top three, and a stored `generator` column records which path shipped. The call has an 8-second timeout and no repair retry, since the rules already give a complete, explained fallback. `app/src/lib/outfits/streak.ts` counts consecutive Singapore days with a "wore" response, computed from the last 60 days of feedback rather than stored in a column.

## Purchase evaluator

Route: `POST /api/purchases/evaluate`. Page: `/evaluator`.

Evaluation is two paid-model calls around one deterministic step. The first call extracts `clothingAttributesSchema` from the uploaded photo or screenshot. Code then scores every confirmed wardrobe item against those attributes: `similarity()` in the route adds 0.6 for a matching category, 0.3 for a matching primary colour, 0.15 for a secondary-colour match, and separately counts same-category items.

The second call receives this computed evidence, not just the raw image, and returns a `purchaseEvaluationSchema` verdict: a decision label (`likely_redundant`, `potentially_useful`, `fills_a_gap`, `insufficient_information`), a redundancy and compatibility score, an explanation, and similar item IDs. Returned IDs are filtered against the user's wardrobe before the response is built, and images are served through hour-long signed Supabase Storage URLs.

## Sizing

Routes: `POST /api/sizing/extract`, `POST /api/sizing/flag`. Page: `/sizing`.

The only model call is `extract`, which reads a shopping screenshot with the paid model into a `sizingExtractionSchema` (brand, product, category, any visible size chart, measurement basis, units), using the versioned prompt in `app/src/lib/sizing/prompts.ts`. `SIZING_EXTRACT_MOCK=1` swaps this for canned fixtures in development; `app/src/lib/sizing/mock-extraction.ts` never calls Gemini. Screenshot reads are capped per user at 2 a minute and 5 a day (`EXTRACTIONS_PER_MINUTE`, `FREE_DAILY_EXTRACTIONS`).

Everything after extraction is deterministic. `app/src/lib/sizing/match.ts` compares the user's stored body measurements against a size chart row by row and returns a size, an alternative, a confidence level (high, medium or low) and which measurement decided the fit. Charts are static data under `app/src/lib/sizing/charts/`, transcribed from brand size guides and tracked in `docs/size-chart-sources.md`. No model chooses a size.

## My Style

Route: `POST /api/style/archetypes`. Page: `/style`.

The colour palette is pure code. `app/src/lib/style/colour-families.ts` maps each item's stored colour to a family and counts shares; an unmapped colour falls into a "not recognised" share, so the total always reaches 100%.

Style archetypes need judgment a lookup table cannot give, so `app/src/lib/style/archetype-prompt.ts` sends one line of tags per item, by item number rather than ID, to the free-tier model, which groups the items into one to four named, described archetypes. `app/src/lib/style/validate-archetypes.ts` checks the response covers every item exactly once before it is accepted. On failure the route retries once with a repair instruction, then falls back to `ruleArchetypes` in `app/src/lib/style/archetypes.ts`. A successful grouping is cached per wardrobe hash in the `style_archetypes` table, so the model runs again only when the wardrobe changes or the user asks to regroup, capped at 5 regroups a day.

## Explore

Route: `GET /api/explore`. Page: `/explore`, which needs at least 5 confirmed wardrobe items.

Explore is retrieval-augmented selection over a small curated catalogue (`app/src/lib/explore/catalogue.ts`), not open retail search. `retrieveExploreCandidates` narrows the catalogue by the user's wardrobe gaps and preferences before anything reaches a model. The RAG-project model then picks and explains 10 products from those candidates through `exploreSelectionSchema`. A result is cached per user and only regenerated on request, gated by the account's remaining Explore refreshes. If the model's picks fail validation, `fallbackSelection` fills the feed from the candidate list directly, so the feed never comes up empty.

## Cross-cutting rules

Every route calls `supabase.auth.getUser()` before touching data, and every query filters on that user's ID. Row-level security in `app/supabase/schema.sql` enforces the same boundary at the database layer, so a bug in a route's own filter is not the only thing standing between one user's wardrobe and another's.

Every prompt that includes an uploaded image or free text appends `UNTRUSTED_CONTENT_RULE` from `app/src/lib/ai/gemini.ts`. It tells the model that text inside an image or a saved feedback note is data, never an instruction, which is how the app handles prompt injection from a screenshot or a shopping page.

Wardrobe and purchase photos live in a private Supabase Storage bucket and are only ever served through short-lived signed URLs. Deleting a wardrobe item deletes its stored photo.

`app/src/lib/account-entitlements.ts` reads a free or premium tier and per-feature credit counts (Beautify edits, Explore refreshes, outfit AI credits) from `account_entitlements`. Nothing in the codebase currently sets an account to premium, so this is schema and gating only, not a working billing flow.
