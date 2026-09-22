# Style archetypes and colour palette

Status: built on `chian/colour-palette`, 22 September 2026. Before deploying, run `app/supabase/migrations/20260922_style_archetypes.sql` in the Supabase SQL editor. Until it runs, the page still works, but every visit without a cache row calls the model (rate-limited to six a minute per user).

## Where the build differs from this plan

- **Item numbers, not IDs.** The model sees and returns item numbers (1 to N, in id order), and code maps them back to IDs. This is the approach the daily feed already uses. The model never sees a UUID, so it cannot invent one.
- **Default temperature.** The call does not set temperature 0. The cache already makes an unchanged wardrobe show the same result, and Regroup needs some variation to be useful.
- **Regroup asks for a different grouping.** It sends the current names and asks for another grouping that also fits. If the call fails, the current AI grouping stays and the user sees a message.
- **Descriptions stay visible.** The main style's description shows under its name, and each other group's description shows under its bar. The info button explains how the groups were made, with different text for the AI and rule versions.
- **Unrecognised colours count toward shares.** They form a "Not recognised" row, so the palette always adds up to 100% of items.
- **New table name.** The cache table is `style_archetypes`, created by `20260922_style_archetypes.sql`.
- **Route and navigation.** `/style` is added to the protected routes in `app/src/lib/supabase/proxy.ts`, and Regroup sends a `style_regrouped` analytics event.

This plan covers the style archetype and colour palette part of the style profile. It follows the "My Style" screenshots shared in the planning chat, with changes where our data or principles differ.

## How AI is used

- **At upload (already built).** Gemini turns each photo into tags, and the user confirms them. Everything below reads those confirmed tags, never the photos.
- **Colour palette: no AI.** A palette is a count. Code maps colour names to families and counts items.
- **Style archetypes: one free-tier call.** The model reads one line of tags per item. It groups the items into one to four archetypes and names and describes each one. Code validates every item ID, computes the percentages and caches the result until the wardrobe changes. If the call fails, rule-based groups are shown instead.

The model does the part rules are bad at, which is judging style from free text such as "cropped boxy tee, washed black, distressed hem". Code does the counting, so the numbers on screen are always correct for the groups shown.

## What the codebase has today

No branch or open PR touches this feature. Remote branches checked on 22 September: `codex/*`, `image-uploading`, `outfit-planner`, `chian/sizing-feature`. None change style, palette or insight code. `gh` is not installed locally, so open PRs were inferred from branches only.

Wardrobe items (`wardrobe_items`, typed in `app/src/lib/types.ts`) carry these tags:

| Field | Type | Constrained? |
|---|---|---|
| `category` | enum of 9 (`top`, `bottom`, `outerwear`, `dress`, `footwear`, `accessory`, `bag`, `activewear`, `sleepwear`) | Yes, zod enum in `app/src/lib/schemas/ai.ts` |
| `formality` | enum (`casual`, `smart_casual`, `business`, `formal`) | Yes |
| `layering_role`, `weather_tags` | enums | Yes |
| `subcategory` | free text ("oxford shirt", "wide-leg jeans") | No |
| `primary_colour` | free text | No |
| `secondary_colours` | free text array | No |
| `pattern` | free text | No |
| `material_cues` | free text | No |
| `attributes_confirmed` | boolean | Yes |

Consequences for this feature:

- Colours are free text written by the model and edited by the user. There is no colour vocabulary, no normalisation and no hex value anywhere. The only colour logic is word matching in `colourMatches` (`app/src/lib/outfits/daily-rules.ts`) and exact lower-case matching in the purchase evaluator.
- Pattern is free text too. `daily-rules.ts` already has a `PLAIN_PATTERNS` set that splits plain from patterned, which we can reuse.
- `user_profiles.preferred_styles` exists, but it is whatever the user typed as a comma-separated list. There is no fixed style list in the app.
- The profile page (`app/src/app/(app)/profile/page.tsx`) is only a preferences form. The wardrobe page has tabs (`WardrobeTabs`, currently items and saved) and a `StatsStrip`.

## 1. Colour palette

### The gap

The screenshot rows need a colour name, a hex swatch, an item count and a share. We have the item count. We do not have stable names, because "navy", "navy blue" and "dark navy" would be three rows, and we have no hex.

### Proposal: a colour family lookup, applied when the palette is read

Add `app/src/lib/style/colour-families.ts` with about 24 families. Each has a display name, a swatch hex, a neutral flag and a list of keywords.

| Family | Swatch | Neutral | Example keywords |
|---|---|---|---|
| Black | `#1A1A1A` | yes | black, jet |
| Charcoal | `#3C3C3C` | yes | charcoal, dark grey, graphite |
| Grey | `#8A8A8A` | yes | grey, gray, heather, ash |
| Light grey | `#C8C8C8` | yes | light grey, silver, pale grey |
| White | `#F7F7F5` | yes | white, optic white |
| Cream | `#EFE6D2` | yes | cream, off-white, ivory, ecru |
| Beige | `#D8C3A0` | yes | beige, khaki, sand, stone |
| Tan | `#B98A5A` | yes | tan, camel, caramel |
| Brown | `#6B4A32` | yes | brown, chocolate, coffee |
| Navy | `#1F2A44` | yes | navy, dark blue, midnight |
| Denim | `#3B5378` | yes | denim, indigo, dark wash, mid wash |
| Blue, light blue, teal, green, olive, yellow, orange, red, burgundy, pink, purple | | no | usual names plus maroon, wine, mustard, sage, lilac |
| Metallic | | no | gold, silver metallic |
| Multicolour | striped swatch | no | multi, multicolour, floral print |

The mapper lower-cases the string, tries the longest keyword first ("light grey" before "grey", "navy" before "blue"), and treats "dark X" and "light X" as the darker or lighter neighbour where one exists. Anything unmatched goes to an "Other" row that links to the items so the user can fix them.

The hex values are display swatches for the family. They are not measured from the photo. The UI should show the family name and not print a hex code as if it were exact. That follows principle 7 (honest uncertainty): under poor lighting the model's colour is already a guess.

Counting:

- Count confirmed items only (`attributes_confirmed = true`).
- One item adds one to its primary colour's family. Share is that count divided by items with a known colour.
- Secondary colours don't count toward the share. They can show as a quieter "also appears in 3 items" line. Adding them to the share would make striped tops count twice.
- Include every category, including footwear, accessories and bags. A user's shoes and bags are part of their palette.
- The gradient bar uses the family swatches with stop widths proportional to share, in the same order as the rows.

### Tagging options

| Option | Work | Trade-off |
|---|---|---|
| A. Map at read time (recommended) | One pure module plus tests. No migration, no prompt change | Works on every existing item right away. Unusual colour names land in "Other" until a keyword is added |
| B. Add a `colour_family` enum to the extraction schema and a column | Migration, prompt change, backfill with the mapper, a new field on the confirm form | Cleaner data long term. Touches the paid extraction route, which agents cannot test with a real key, and adds a field to the confirm form |
| C. Sample colour from the cutout image on the client | Canvas code on the cutout | Gives a real hex, but lighting and shadows skew it, and it would contradict the user's confirmed colour |

Start with A. Before writing keywords, pull the distinct `primary_colour` values from the team's own test accounts (a read-only `select distinct` on the dev database) and use them as test fixtures.

If "Other" stays large after submission, there is a cheaper step before B. Send only the unmatched colour names in one batched free-tier call and have the model pick from the fixed family list, validated as an enum. Cache the answers by colour name, since the same strings recur across users.

We don't use AI to build the palette itself. It would add nothing to counting except the chance of miscounting.

## 2. Style archetypes, derived per user

### What "dynamic" should mean here

The screenshots use a fixed list (Athleisure, Minimalist, Soft Grunge, Vintage). We want the groups and their names to come from the user's own items. The result should only change when the wardrobe changes, because we show it as numbers and a user will notice if they shift on refresh.

Inputs per item: `category`, `subcategory`, `primary_colour`, `pattern`, `formality` and `material_cues`. The user's typed `preferred_styles` is a hint for names only, not for grouping. Sleepwear is excluded. Footwear, accessories and bags count toward archetypes, the same as clothes. Their subcategory often carries clear style signal ("chunky combat boots", "canvas tote", "gold hoops"). Most shoes and bags are neutral and casual, so they will push the rule fallback toward a neutral casual group. The AI grouping reads the subcategory and should place them better.

### Approaches

**A. Rule-based grouping on tags.** Give each item a signature from four fields that are already reliable:

- formality band: casual, smart casual, or business and formal
- palette: neutral or accent, from the colour family neutral flag
- pattern: plain or patterned, reusing `PLAIN_PATTERNS`
- active: category `activewear`, or a subcategory keyword such as legging, jogger, track or sports bra

Group items by signature. Merge any group smaller than two items or 10% into the nearest group (fewest differing fields, ties go to the larger group). Cap at four archetypes. Label from a template, for example "Neutral smart casual" or "Patterned casual".

- Pros: no model call, free, instant, deterministic and unit-testable. Every percentage traces to specific items, so the explanation writes itself.
- Cons: the labels read like database columns. The axes are fixed, so "dynamic" only means which combinations a user has. It ignores the free-text subcategory and material cues, which is where much of the style signal is.

**B. LLM classification pass.** Send the free-tier model a compact tag line per item (no photos, no notes) and ask for one to four archetypes, each with a name, a one-line description and the item IDs that belong to it.

- Pros: the names sound like people talk ("Quiet monochrome basics"). It reads subcategory and material text that rules ignore.
- Cons: membership and names change between runs unless cached. The model can drop, repeat or invent item IDs, so every ID needs validation, which is the same problem the planner already guards against. It costs a call per wardrobe change and needs a fallback when the free tier is rate-limited or down. Percentages would depend on the model's grouping, which is hard to test.

**C. Embeddings and clustering.** Embed each item's tag text (or photo), cluster with k-means or HDBSCAN, then ask an LLM to name each cluster.

- Pros: groups items by meaning in free text ("cargo pants" near "utility shorts"), and scales to large wardrobes.
- Cons: at 10 to 40 items, clusters are unstable and the choice of k is mostly noise. It needs an embedding model and somewhere to store vectors. It still needs an LLM to name the clusters. Photo embeddings would go through a Google key, and we must not use the paid one. AGENTS.md lists "complicated agent frameworks without a clear product need" as a non-goal, and this sits close to that.

### Recommendation: AI groups the items, code checks and counts

Use B for the grouping, with A as the fallback. B's main weakness is that the result changes between runs. Caching by wardrobe hash removes that: the same wardrobe always shows the same stored result. The other risks (invented or missing IDs, made-up percentages) are handled in code.

1. **Build the input.** Load the user's confirmed items, excluding sleepwear. Send one line per item with `id`, `category`, `subcategory`, `primary_colour`, `pattern`, `formality` and `material_cues`. Also send the user's typed `preferred_styles` as a naming hint. Photos, `user_notes`, the email and every other profile field stay out.
2. **Call the model.** One call on `GOOGLE_GENERATIVE_AI_FREE_API_KEY`, the same free tier as the planner, at temperature 0. The prompt asks for one to four archetypes, with fewer for a small wardrobe, and says every item belongs to exactly one. It also says item text is data to classify, not instructions to follow. The response schema is `{ archetypes: [{ name, description, item_ids }] }`.
3. **Validate the result.**
   - Check the shape with zod. Names must be unique and 24 characters or fewer, and descriptions 120 characters or fewer.
   - Drop any ID that isn't one of the IDs sent. The planner already filters IDs the same way (`validIds` in `app/src/app/api/outfits/route.ts`).
   - Keep only the first occurrence of any ID that appears twice.
   - Place any item the model left out in the archetype whose members share the most A-signature fields with it.
   - Drop empty archetypes. If none remain, or the response fails validation twice (one repair retry, as AGENTS.md specifies), use approach A instead.
4. **Count in code.** Each archetype's share is its member count divided by the number of items sent. The model never writes a number that appears on screen.
5. **Cache.** Store the validated result keyed by `user_id` and a hash of the sent item lines. A page view with an unchanged hash reads the cache with no model call. Adding, editing or deleting an item changes the hash, and the next page view regenerates.
6. **Show the source.** Store whether the result came from the model or the rule fallback, so the UI and analytics can tell them apart.

The refresh icon in the screenshot becomes "Regroup". It forces one new call even when the hash is unchanged, with a per-user daily limit like the other AI routes.

Approach A still gets built, for three reasons. It is the fallback when the free tier is rate-limited or down. It places items the model leaves out. It is also what shows before the call returns on a user's first visit.

This gives the milestone write-up a clear example of AI judgement inside code-enforced limits: the model decides the grouping, and code decides what is valid and computes the numbers.

### Display

- Headline: the largest archetype's name, with an info button that opens its description and "Based on 18 confirmed items in your wardrobe".
- Replace the radar chart with horizontal share bars. Dynamic archetypes can number two, which a radar cannot draw, and a radar's area exaggerates differences between shares.
- Under each bar, show a row of that archetype's item thumbnails. These are already signed on the wardrobe page. This replaces the carousel in the screenshot and lets the user see why each item is in the group.
- Mark the grouping as AI-made, next to the item count: "Grouped by AI from your confirmed tags". When the rule fallback is showing, the labels are the template ones and the line says "Grouped by colour, pattern and formality".
- While the first call runs, show the rule-based groups with a small "Refining your styles" indicator, then swap in the AI result. The page never waits on the model.
- There is no minimum item count. With one confirmed item or more, the page shows the palette and archetypes. A small wardrobe can have a single archetype at 100%, and the item count line ("Based on 3 confirmed items in your wardrobe") tells the user how much the result rests on. With no confirmed items, the page shows an empty state that links to adding an item.
- If `preferred_styles` is set, add one line comparing it to the result: "You described your style as minimalist. Most of your wardrobe is neutral smart casual." It costs nothing and helps the user trust the grouping.

## 3. The "last 30 days of outfits" framing

The brief was cut off at this point. This section assumes it went on to say the framing has to change.

The screenshot's "Based on your outfits from the last 30 days" describes wear history. The claim that we have no wear tracking is partly out of date:

- On `main`, planner feedback already records `action = 'wore'` in `recommendation_feedback`, linked to `outfit_recommendations.wardrobe_item_ids`. The wardrobe page counts these as "outfits worn".
- The daily feed (commit `8910ee6`, merged into `main`) adds "Wear today". `app/src/lib/outfits/streak.ts`, which is still uncommitted on `chian/daily-outfit-cards`, computes a wear streak from the same rows.

So wear data exists, but it only captures outfits the app suggested and the user marked. Anything worn without opening the app is missing. For most test users that is a handful of rows, which is too few to describe a style.

Recommendation:

- Base both archetypes and palette on what the user owns, and say so: "Based on 18 confirmed items in your wardrobe".
- Don't use "last 30 days" wording anywhere at launch.
- Later, after submission: once a user has five or more worn outfits in 30 days, add a toggle between "What you own" and "What you wear", weighting items by wear count. The data model supports this today with no migration.

## Where it lives

A separate "My Style" page at `/style`, with its own entry in the main navigation. The profile page stays a settings form, and the page does not copy the screenshots' Profile, Style and Stats tabs.

Page order, top to bottom:

1. Title "My Style" and the line "Based on N confirmed items in your wardrobe"
2. Headline archetype with its info button, then the share bars with thumbnails
3. The preferred-styles comparison line, if the user has typed styles
4. Colour palette: gradient bar, then one row per family

Navigation lives in `app/src/components/rail.tsx`. Add `{ href: "/style", label: "My Style", short: "Style" }` with a new icon, placed after Wardrobe. The mobile bar is `grid-cols-6` with six links today, so it becomes `grid-cols-7`. Check it at 360px wide: if the short labels wrap or the tap targets fall below 44px, move Profile out of the mobile bar and link it from the My Style header instead.

## Files

| File | Purpose |
|---|---|
| `app/src/lib/style/colour-families.ts` | Family table and `colourFamily(text)` mapper |
| `app/src/lib/style/palette.ts` | `buildPalette(items)`: rows, shares, gradient stops, unmapped items |
| `app/src/lib/style/archetypes.ts` | Rule signatures, grouping and merging, template labels, wardrobe hash |
| `app/src/lib/style/archetype-prompt.ts` | Versioned grouping prompt and zod schema (phase 2) |
| `app/src/lib/style/validate-archetypes.ts` | Pure function: ID filtering, de-duplication, placing missed items, shares (phase 2) |
| `app/src/app/api/style/archetypes/route.ts` | Reads the cache or calls the model, validates, stores. Authenticated and rate-limited (phase 2) |
| `app/src/app/(app)/style/page.tsx` | My Style page: loads confirmed items, builds the palette, renders rule groups, then fetches the AI result |
| `app/src/components/rail.tsx` | Add the My Style link and icon, and widen the mobile bar to seven columns |
| `app/src/components/style-palette.tsx`, `style-archetypes.tsx` | UI |
| `app/supabase/migrations/2026092x_style_archetypes.sql` | `user_id` primary key, `wardrobe_hash`, `payload jsonb`, `source` (`ai` or `rules`), `generated_at`, RLS owner-only (phase 2) |
| `app/tests/colour-families.test.mjs`, `palette.test.mjs`, `archetypes.test.mjs`, `validate-archetypes.test.mjs` | Unit tests |

## Tests

- Colour mapper: every distinct colour string from the dev data maps to the intended family. Cases include "dark navy", "off-white", "heather grey", "light wash denim", "wine" and an empty string.
- Palette: shares add up to 100%, unmapped items go to "Other", and secondary colours don't change shares.
- Rule archetypes: the same items always give the same groups, small groups merge, there are never more than four archetypes, sleepwear is excluded, footwear, accessories and bags are included, and a one-item wardrobe gives one archetype at 100%.
- Palette: footwear, accessories and bags count toward the shares.
- AI validation (phase 2), on mocked model responses only:
  - a valid response gives shares that add up to 100%
  - an invented ID is dropped
  - a duplicated ID is kept once
  - an item the model left out is placed in a group
  - an archetype left empty is removed
  - a single-archetype response, a duplicate name, or malformed JSON twice falls back to the rule groups
- Cache: an unchanged wardrobe reads the cache without calling the model, and editing one item's colour changes the hash.
- One manual check on the free tier with a team test account: the groups make sense to a person who knows that wardrobe. Record the result for the evaluation section of the write-up.

## Scope against the deadline

Today is 22 September and the app must be complete on 23 September. AGENTS.md lists this as P1 ("basic wardrobe insights"), so it should not displace any unfinished P0 work.

- Phase 1, fits the deadline if P0 is done: colour families, palette, rule-based archetypes, the My Style page with its navigation link, and tests. No migration, no AI call, no paid route touched. This is a complete feature on its own, and every piece is needed later as the fallback.
- Phase 2, the recommended end state: the AI grouping route, prompt, validation, cache table and Regroup button. The planner has the same shape (free-tier call, ID validation, rate limit), so most of the patterns already exist.
- After submission: the batched AI fallback for unmatched colour names, a `colour_family` column (tagging option B), and the "What you wear" toggle.

If phase 2 isn't finished by the 23rd, ship phase 1. The My Style page works without it.

## Decisions

Agreed on 22 September 2026:

1. The feature gets its own My Style page at `/style`, not a wardrobe tab.
2. There is no minimum item count. The page works from one confirmed item.
3. Footwear, accessories and bags count toward both the palette and the style archetypes. Only sleepwear is left out of archetypes.

## Owner

Chian builds both phases. Start a new branch from the latest `main`. Rebase on `main` again before adding the migration and editing `schema.sql`, so the new table lands after any migrations teammates have merged.
