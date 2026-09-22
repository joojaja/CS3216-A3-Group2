# Daily outfits and saved outfits plan

Written 22 September 2026 on branch `chian/daily-outfit-cards`. The build follows this plan slice by slice. The "Implementation notes" section at the end lists where the code differs from it.

The brief is a starting point, so this plan disagrees with it in several places. Every disagreement sits under a "Differs from the brief" heading, and every assumption carries an id (A1, A2 and so on) so the team can correct it by number.

## Before anything else

### Deadline

AGENTS.md sets 23 September 2026 as the completion date, which is tomorrow. The brief calls this post-MVP, so this plan does not assume both features ship by then. If the team wants either one in the graded demo, build in this order, because each slice works without the ones after it:

1. **Slice 1. Saved outfits from the planner.** A save button on the existing planner cards, the `saved_outfits` table and the saved page. It is small, touches nothing else, and adds a visible "keep this" step to the demo journey.
2. **Slice 2. Daily feed with buttons.** Rules-only generation, one batch per day, skip, wear and save as buttons, and saves flowing into slice 1.
3. **Slice 3. Polish.** Swipe gestures, LLM-written explanations, the refresh countdown and the streak.

Slices 1 and 2 together are about a day of work for one person. Slice 3 is another half day or more.

### Team coordination

- `origin/outfit-planner` (joojaja, 22 September) is 4 commits ahead of `main` and not merged. It adds `app/src/lib/outfit-feedback.ts` (`buildFeedbackContext`, which turns wore, liked and rejected feedback into per-item scores), rewrites `app/src/app/api/outfits/route.ts` to use it, and changes `app/supabase/schema.sql` by about 500 lines. This plan builds on `buildFeedbackContext` and changes `outfit_recommendations`, so it has to wait for that merge or be agreed with joojaja first. Otherwise the two schema edits will conflict.
- `gh` is not installed on this machine, so I could not list open PRs. `git branch -a` shows no other daily-feed or saved-outfits branch. Someone should check the PR list on GitHub before slice 1 starts.

### What the code does today

The brief describes the existing product slightly differently from the code, and the plan depends on the code.

- The "chat-based styling assistant" is the outfit planner at `/planner`. `POST /api/outfits` returns 1 to 3 outfits, and `app/src/components/outfit-planner.tsx` renders them with `OutfitCard`.
- The assistant has no save action. Its cards offer "Wear this" (`wore`), thumbs up (`liked`) and thumbs down with reasons (`rejected`). All three write to `recommendation_feedback` through `POST /api/feedback`. So the saved-outfits store is new for both sources. There is no existing save signal to reuse.
- On `main`, the planner writes feedback but never reads it back. The `outfit-planner` branch above is what closes that loop.
- Planner cards show a tinted `GarmentIcon` per item, not the item photo. `POST /api/outfits` does return signed image URLs, but the card does not use them.
- Outfits are stored in `outfit_recommendations` with `wardrobe_item_ids uuid[]`. That column has no foreign key, so a deleted wardrobe item leaves a dangling id.
- Only items with `attributes_confirmed = true` go into recommendations. Unconfirmed items are invisible to the planner.
- After sign-in, the home page is `/wardrobe`. The mobile tab bar already has 6 tabs in a `grid-cols-6`.
- `app/src/lib/weather.ts` fetches the NEA 24-hour forecast and caches it for 15 minutes. `app/src/lib/rate-limit.ts` is in memory, so each server instance keeps its own counts.
- Text-only AI calls use `getModel("free")`. AGENTS.md rule 6 bans agents from the paid key, and this feature needs no image input, so it stays on the free key.

## Feature 1. Daily outfit card feed

### 1.1 Outfit generation logic

**Recommendation.** Assemble and score outfits with deterministic rules. Then optionally make one free-tier LLM call per user per day that picks 3 of the top candidates and writes the explanations. If the call fails, the rules result ships with template explanations.

Why this and not a pure LLM call like the planner:

- Rules guarantee a complete outfit. The planner prompt asks the model for "a complete outfit", but nothing checks it, and the route only drops invented ids. A daily feed with no occasion text has nothing for the model to reason about beyond what the rules already know.
- It costs at most 1 free-tier call per active user per day, and 0 on a fallback. At 20 to 40 daily users that fits the free-tier limits.
- It gives the production-optimization milestone a real number: LLM calls per daily card compared with the planner's one call per request.
- It covers product principle 3 ("explain recommendations") and gives the AI interaction patterns milestone a hybrid pattern: deterministic retrieval and filtering, then constrained LLM selection.

**Differs from the brief.** The brief frames this as rules or LLM. The recommendation is both, with the LLM restricted to choosing and explaining among outfits that are already valid.

#### Outfit roles

A complete outfit is `top + bottom + footwear` or `dress + footwear`, plus optional extras.

| Role | Categories | Rule |
|---|---|---|
| Upper | `top` | Required unless there is a one-piece |
| Lower | `bottom` | Required unless there is a one-piece |
| One-piece | `dress` | Replaces upper and lower |
| Footwear | `footwear` | Required when the wardrobe has any footwear (see 1.5) |
| Layer | `outerwear` | At most 1, only when the forecast has rain or the item is tagged `air_conditioned` or `cool_evening` |
| Extras | `accessory`, `bag` | Optional. At most 2 accessories and 1 bag, which fills the 3 slots of the card's right column (1.7) |
| Never used | `sleepwear` | Excluded |

- **A1.** The extractor puts jumpsuits and rompers under `dress`. No prompt or schema in `app/src` mentions them, so I could not confirm this. If it classifies them as `top`, one-pieces need a subcategory check.
- **A2.** `activewear` is excluded from the daily feed, because the category does not say whether an item is a top or a bottom. It can come back once it has a role.

#### Pipeline

1. Load the user's confirmed wardrobe items, profile colours and styles, the feedback item scores from `buildFeedbackContext`, and the outfits shown in the last 7 days.
2. **Hard filters**, applied to each item and then each combination:
   - Drop items in the user's disliked colours. AGENTS.md says explicit dislikes override inferred preferences.
   - Drop `outer` layering items on a hot, dry forecast.
   - Upper and lower formality may differ by at most one step on the `FORMALITY_LEVELS` scale.
   - At most one patterned item per outfit (`pattern` is not solid or plain).
3. **Enumerate** every valid combination. Even a large wardrobe (30 tops, 20 bottoms, 8 shoes) gives under 5,000 combinations, which is trivial in memory.
4. **Score** each combination as a weighted sum of:
   - weather fit, from `weather_tags` against the day's forecast
   - preferred-colour and preferred-style matches
   - the summed feedback item scores
   - a novelty penalty for any item shown in the last 3 days, and a bigger one for the exact combination shown in the last 7 days
5. **Pick a diverse top 8.** Take the best combination, then keep taking the next best one that shares at most one item with every combination already taken.
6. **LLM step.** Send the 8 candidates (as id lists with the same short item descriptions the planner uses), the forecast, preferences and the `UNTRUSTED_CONTENT_RULE`. The model returns 3 candidate indexes and one explanation each. Validate against a new zod schema. Reject any index outside the 8. Retry once with a repair instruction, then fall back.
7. **Fallback.** Take the top 3 from step 5. Build each explanation from the score parts, for example "Light pieces for 25 to 33°C with afternoon showers. The navy chinos match your preferred neutrals."

The rules live in one pure module (for example `app/src/lib/daily/assemble.ts`), with no Supabase or model imports, so `node --test` can cover them the way `tests/outfit-feedback.test.mjs` covers the feedback weights.

#### Not enough items for a complete outfit

The feed needs at least one upper and one lower, or one dress. Below that there is no batch, and the feed says exactly what is missing (see 1.5). It never fills a gap with a catalogue or sample item. The brief rules that out, and it would break the wardrobe-first principle.

### 1.2 Refresh and scheduling

**Recommendation.** One batch per Singapore calendar day, generated on the user's first open that day and stored. No cron job and no refresh every few hours.

**Differs from the brief.** The brief suggests refreshing every few hours. People dress once a day, and the NEA 24-hour forecast the rules depend on only changes a few times a day. A new batch every few hours would throw away outfits the user has not looked at, and multiply the LLM calls. The reference screenshot, which says "Refreshes in 5 hrs" at 7:28 pm, looks like a midnight reset as well.

- **When a batch is created.** `GET /api/daily-outfits` finds the batch for `(user_id, today in Asia/Singapore)`. If there is none, it generates one and stores it. The date has to come from `Asia/Singapore`, not the server clock, because Vercel runs in UTC and would roll the day over at 8 am local time.
- **Why generate on open instead of precomputing.** Generating on open costs nothing for users who do not open the app. Vercel Hobby crons run at most once a day and would still need an "is this user active?" check. The drawback is 1 to 3 seconds of first-open latency for the LLM step, which the loading card covers. Rules-only generation takes well under 100 ms.
- **Double generation.** A unique constraint on `(user_id, feed_date)` stops two tabs from creating two batches. The request that loses the insert reads the winner's row. An in-memory lock like `generationLocks` in `app/src/app/api/explore/route.ts` saves the wasted LLM call on a single instance.
- **"Refreshes in N hrs".** The server returns `next_refresh_at` (the next midnight in Singapore), and the client counts down to it. Nothing about the timer is stored per user. When the countdown reaches zero with the feed open, a "New outfits ready" button appears. The cards never swap under the user mid-swipe.
- **A4.** The day resets at 00:00 in Singapore. The alternative is 04:00, so that someone opening the app at 1 am after a night out still sees the day they are in. This is open question 3.
- **A5.** There is no manual "shuffle" in slice 2. The end card links to the planner for anything specific. A rules-only "show 3 more", capped at twice a day, would cost no LLM calls and could come later.

### 1.3 Interaction model

**Differs from the brief.** The brief lists dismiss, like and save. The plan uses skip, wear today and save, and drops like as a separate action.

- A like and a save on a daily outfit mean nearly the same thing, and users will not know which one to press. The reference UI has no like either. Saving counts as the positive signal.
- "Wear this today" is the strongest and most honest signal the feed can collect. It already exists as `wore` in the planner. It also feeds the streak (1.2 and open question 4) and later wear-count insights (a P1 item).
- A skip has to be a weak signal, not a rejection. People swipe past perfectly good outfits because they want to see the next one. If a skip counted as `rejected` (weight -3 in `buildFeedbackContext`), a few swipes would bury good items. A separate "Not for me" path with reasons produces the real `rejected` signal. That path is also the demo moment AGENTS.md needs ("the user rejects one result as too warm").

| Gesture or button | Meaning | Backend write | Weight in scoring |
|---|---|---|---|
| Swipe left, or the X button | Skip | `recommendation_feedback` with action `dismissed` | -1 on the combination only |
| "Not for me" link under the card | Reject with reasons | Action `rejected` plus reasons from the existing `FEEDBACK_REASONS` | -3 per item (existing) |
| Swipe right, or the bookmark button | Save | `saved_outfits` row | +2 per item, same as `liked` |
| "Wearing this today" (primary button) | Wear | Action `wore` (existing) | +3 per item (existing) |
| Tap an item tile | Open the item | Nothing | None |

- The pencil button in the reference ("edit") matches the P1 item "regenerate an outfit while keeping one selected item". It is left out of slices 1 to 3. When it arrives it should swap one piece for the next-best item in the same role, using the rules alone.
- **Undo.** Every action shows the existing toast with Undo for about 5 seconds. A save writes at once, and Undo deletes the row through the same endpoint the saved page uses to remove a save. A skip is held on the client until the toast closes, then written. A lost skip does no harm.
- **Accessibility.** Every swipe has a button that does the same thing. Left and right arrow keys move between cards. With `prefers-reduced-motion`, cards fade instead of flying. Swipes use `motion`'s `drag`, which is already a dependency, so no new library is needed.
- **Reopening.** The feed opens on the first card with no action yet. After the last card comes an end card: "That's today's three." It lists what the user saved and links to the planner.
- **Analytics.** Add funnel events to `FUNNEL_EVENTS` for daily feed open, skip, save, wear and reject. The analytics milestone needs insights, and the save rate and skip rate per card position are cheap ones to report.

Reuse of the planner signal:

- The `dismissed` action is added to the zod enum in `POST /api/feedback` and to `ACTION_WEIGHT` in `buildFeedbackContext`. The `action` column is plain text, so the database needs no change.
- `buildFeedbackContext` gains one input, the user's saved recommendation ids, weighted like `liked`. Save stays out of `recommendation_feedback`, because it can be undone and is a collection, not an opinion about one moment.
- Daily outfits and planner outfits live in the same `outfit_recommendations` table (see 1.4). A "too warm" in the daily feed therefore changes the next planner answer, and the reverse. This is the main reason to share the table.

### 1.4 Data model changes

All new tables follow the existing pattern: `user_id` referencing `auth.users` with `on delete cascade`, RLS enabled, and a `for all to authenticated` policy using `(select auth.uid()) = user_id`. They go into `app/supabase/schema.sql` and into a new file under `app/supabase/migrations/`, the way `20260921_measurements.sql` was done.

#### New table `daily_outfit_batches`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk | |
| `user_id` | uuid | |
| `feed_date` | date | Singapore date. Unique with `user_id` |
| `status` | text | `ready` or `insufficient` |
| `missing_roles` | text[] | For example `{footwear}`. Drives the empty states |
| `weather_snapshot` | jsonb | The `SingaporeForecast` used, shown on the cards as "Forecast used" |
| `generator` | text | `rules` or `rules_llm`. Used for the evaluation and optimization write-up |
| `created_at` | timestamptz | |

#### Changes to `outfit_recommendations`

| Change | Why |
|---|---|
| Add `source text not null default 'planner'`, checked to `planner` or `daily` | The saved page and analytics can tell the two sources apart |
| Make `request_id` nullable | Daily outfits have no occasion request |
| Add `daily_batch_id uuid null` referencing `daily_outfit_batches` with `on delete cascade` | Links a card to its day |
| Add `position smallint null` | Card order within the batch |
| Check that exactly one of `request_id` and `daily_batch_id` is set | Keeps each row tied to one source |
| Index `(user_id, created_at)` | The "shown in the last 7 days" query |

**Differs from a separate daily table.** A separate `daily_outfits` table would be simpler to add, but `POST /api/feedback`, the ownership check in that route and `buildFeedbackContext` all key on `outfit_recommendations.id`. One table means those three work unchanged, and the saved page needs one join instead of two.

**Item references.** The plan keeps `wardrobe_item_ids uuid[]` because the planner, the feedback route and `buildFeedbackContext` all read it. Reads filter the ids against the user's current wardrobe. A join table `outfit_recommendation_items(recommendation_id, wardrobe_item_id, role)` with real foreign keys would be cleaner, but it means rewriting all three readers under deadline. Revisit it after submission.

#### Changes to `recommendation_feedback`

None in the database. The app adds `dismissed` as an allowed action. Feedback history per user already exists here, so no new history table is needed.

#### New table `saved_outfits`

Specified in 2.2.

#### Streak

No column in slices 1 and 2. When the streak ships, compute it on read from the dates of `wore` feedback (open question 4). A user has at most a few rows a day, so the query is cheap and cannot drift out of sync the way a stored counter can.

#### Retention

**A6.** Unsaved daily recommendations older than 30 days get deleted by a small cleanup query, run by hand or on the next deploy. Recommendations that are saved or have feedback are kept, because both are needed for the 7-day novelty check and for personalization.

### 1.5 Edge cases

| Case | What the user sees |
|---|---|
| No items at all | "Your daily outfits start once your wardrobe has a top, a bottom and a pair of shoes." An Add item button. No batch row is stored, so it rechecks on the next open |
| Items added but none confirmed | "You have 4 items waiting for review. Confirmed items are what outfits are built from." A link to the first unconfirmed item. This case is easy to miss, because the planner treats it as an empty wardrobe |
| Only one category, for example 6 tops | Names the missing roles from `missing_roles`: "Add a bottom or a dress to get your first outfit." |
| Tops and bottoms but no footwear | **Differs from the brief.** The brief requires shoes. Blocking the whole feed on footwear punishes new users, who photograph their clothes first and shoes last. The outfit shows with an empty footwear slot, "No shoes in your wardrobe yet", and an add button. Once any footwear exists, footwear becomes required |
| Too few items for 3 different outfits | Show as many valid outfits as exist, for example "1 of 1", instead of repeating one outfit. The end card suggests adding a specific role, chosen by which role would unlock the most new combinations |
| Repeats across days | The novelty penalty in 1.1 keeps the exact combination from showing again within 7 days, and pushes recently shown items down for 3 days. When the wardrobe runs out of fresh combinations, repeats are allowed and marked "You saved this before" or "Worn on 18 Sep" |
| Item deleted after the batch was made | That card drops the item on read. If a required role is now empty, the card is hidden |
| Item edited, for example its category changed | The same as a deletion if the item no longer fits its slot. Otherwise the card stays |
| Items added during the day | The day's batch stays. The end card says "You added 2 items today. They'll show up in tomorrow's outfits." |
| Forecast unavailable, or for a different date | Use the four-day outlook entry for today, or the conservative hot-and-humid default that the planner already uses. The card says "Forecast unavailable, planned for typical hot and humid weather". AGENTS.md forbids inventing conditions |
| LLM fails or free quota runs out | The rules fallback with template explanations. `generator = 'rules'` is stored so the evaluation counts it |
| Unconfigured demo mode (no Supabase) | A fixed batch built from `demoItems` with the same rules, so the demo works without keys |
| Very first day | No feedback history, so scoring uses only weather, profile preferences and diversity. The first card explains this once: "These get more personal as you save, skip and wear outfits." |

### 1.6 Reuse and divergence from the planner's `OutfitCard`

`OutfitCard` in `app/src/components/outfit-planner.tsx` mixes three things: the item tiles, the explanation and warnings, and the feedback controls with the reasons picker. The plan pulls the first and third out into shared pieces and gives each feature its own wrapper.

| Piece | Shared or not | Notes |
|---|---|---|
| `OutfitItems` (new) | Shared | Takes item records and a layout: `row` for the planner, `collage` for the daily card, the home strip and the saved list. Section 1.7 specifies the collage. Shows the item photo from `signed_image_url` and falls back to `GarmentIcon` if there is none. The planner gets photos as a side effect |
| `FeedbackReasons` (new) | Shared | The reasons picker, moved out as it is. The daily "Not for me" path and the planner's thumbs-down both use it |
| Explanation and warnings block | Shared | Small enough to share as it is |
| Planner wrapper | Planner only | Keeps "Outfit N", "Show another" and thumbs up and down, and adds a save button (slice 1) |
| `DailyOutfitCard` | Daily only | Full-screen swipe card, position counter ("2 of 3"), countdown, skip, wear and save buttons. It gets its item records from `GET /api/daily-outfits` in the same shape as the planner's `items` map |

Other differences:

- Signed image URLs last an hour (`createSignedUrls(paths, 3600)`). The daily feed may stay open longer than that, so it refetches when the tab regains focus after 50 minutes.
- The daily feed is not a thread, so it does not use `PlannerProvider`. A small client state hook is enough.

#### Where the feed lives

**Differs from the brief.** The brief calls it a home-screen feed. There is no separate home screen: `/wardrobe` is home, and the mobile tab bar has no room for a 7th tab. The reference app puts a collapsible "Today's outfit inspo" strip on its home screen, and tapping the strip opens the full-screen swipe view. The plan does the same on `/wardrobe`. A strip at the top shows the three outfit thumbnails and the countdown, and tapping it opens the swipe view as a full-screen overlay at `/wardrobe/today`. This needs no navigation change, and it puts the daily outfits in front of every returning user.

### 1.7 Outfit card design and image rendering

#### No image generation model

The card lays out photos the user already uploaded. It never generates a new image. An image model would redraw the garments and could change a collar, print or colour, so the card would stop showing what the user owns. A render of the user wearing the outfit would be virtual try-on, which AGENTS.md lists as a non-goal. An image model would also need the paid key (AGENTS.md rule 6), take seconds per card, and send private photos out every day instead of once at upload. The image model stays where it is now: an optional step at upload, through `/api/items/enhance`.

#### Layout

The swipe view is a full-screen overlay on top of a dimmed `/wardrobe`. It has a top bar with Close on the left, "Today's outfits" in the centre and the "2 of 3" counter on the right. The card is white with rounded corners, and the next card peeks out behind its right edge. The card has two parts: an image panel with a light gradient, and a caption strip below it.

```
┌─────────────────────────────────┐
│ ✕     Today's outfits     2 of 3│
│                                 │
│  ┌───────────────────────────┐┐ │
│  │ ┌────────┐       ┌─────┐  ││ │
│  │ │  TOP   │       │ BAG │  ││ │ ← next card peeks
│  │ └──┬─────┘       └─────┘  ││ │
│  │   ┌┴───────┐     ┌─────┐  ││ │
│  │   │ BOTTOM │     │ ACC │  ││ │
│  │   └────────┘     └─────┘  ││ │
│  │                  ┌─────┐  ││ │
│  │                  │SHOES│  ││ │
│  │                  └─────┘  ││ │
│  ├───────────────────────────┤┘ │
│  │ Why this: light linen for │  │
│  │ 33°C, showers after 3pm.  │  │
│  │ Not for me                │  │
│  └───────────────────────────┘  │
│                                 │
│      (✕)   [Wear today]   (🔖)  │
└─────────────────────────────────┘
```

The image panel has two columns:

- **The left column is wide, about 60% of the panel.** The top sits in the upper part and the bottom below it, a little to the right, with a slight overlap. A dress fills the whole left column. Outerwear goes on the left too, partly over the top's slot.
- **The right column is a narrow strip of equal slots.** Accessories and the bag stack from the top, up to 3 of them. Shoes always sit in the bottom right corner. With no accessories, the right column holds only the shoes, and the left-column items grow a little into the free space.
- **The shoe slot can be empty.** With no footwear in the wardrobe (1.5), it shows a dashed "Add shoes" tile that links to `/wardrobe/new`.
- **Each image uses `object-contain` inside its slot.** Cleaned images are padded squares, so no garment gets cropped.

The caption strip holds the one-line "why this" explanation, the forecast used, and the "Not for me" link that opens `FeedbackReasons`. Warnings, if any, show as one line in the warning colour.

The buttons float below the card. Skip (X) is on the left and save (bookmark) on the right, as in the reference. The reference's pencil slot in the centre becomes the primary "Wear today" button. Colours come from the app's tokens (cobalt, tangerine, ink) instead of the reference's beige. The reference's dashed outlines and SAMPLE chips are dropped, because every item is real.

The `/wardrobe` strip uses the same collage at thumbnail size, three side by side. The strip header holds the countdown pill and, when it ships, the streak counter. The saved page uses the thumbnail collage too.

#### Rendering

- **The browser lays out the card.** It is a CSS grid of `<img>` tags, not an image made on the server. A flattened image would mean storing a second copy of private photos, and nothing needs one.
- **White backgrounds disappear with a blend mode.** `app/src/lib/image/clean.ts` does not save transparent cut-outs. It centres the garment on a white square and saves a JPEG. On the grey panel each item would show as a white box. With `mix-blend-mode: multiply` on a light panel, white pixels take on the panel colour, so the garments look cut out and can overlap. This only works on a light background. The app has no dark mode, so that is fine for now.
- **Raw photos get a frame.** Items whose `ai_confidence.image_source` is `original` or `cropped` still show their real background, so blending would not help. They sit in rounded, framed tiles in the same slots. Items with `cleaned`, `isolated` or `ironed` get the blend. If uneven cards turn out to be a problem, the fix is at upload, by prompting users to clean items that still use the original photo. It is not a per-card fix.
- **Loading.** Each slot shows a shimmer placeholder in its own shape while its image loads. The next card's images start loading in advance, so swiping never shows blank slots. If a signed URL fails, the slot shows the tinted `GarmentIcon`.
- **Alt text** comes from colour and subcategory, for example "navy chinos". The whole card also gets a label listing all its items.
- **A8.** Cleaned images are JPEGs up to 1600 px, so one day's feed (3 cards of up to 6 items) can download about 18 full-size images. Supabase can resize images on the fly, but I believe that needs a paid Supabase plan. For now, the feed loads full-size images lazily. After submission, the upload step could also save a small thumbnail, because the browser already processes the image there.

## Feature 2. Saved outfits page

### 2.1 Page layout and navigation entry point

- **Route.** `/wardrobe/outfits`. The rail's `activeIndex` already keeps nested wardrobe routes under the Wardrobe tab, so the navigation needs no change.
- **Entry points.**
  - An "Items / Saved outfits (N)" segmented control at the top of `/wardrobe`. The wardrobe then holds both the things you own and the outfits you have made from them.
  - The end card of the daily feed.
  - The toast after any save, with a "View" link.
  - The planner composer footer, once the user has at least one saved planner outfit.
- **Layout.** A responsive grid of outfit cards: 1 column on phones, 2 on tablets, 3 on desktop. Each card has the thumbnail collage from 1.7, a source chip ("Daily outfit · 22 Sep" or "Planner · 'Smart casual dinner in town'"), and the first line of the explanation.
- **Empty state.** "Save outfits from your daily picks or the planner and they'll collect here." Two buttons, one to today's outfits and one to the planner.
- **Detail view.** A sheet on mobile and a side panel on desktop, with the full explanation, the warnings, and the forecast from when the outfit was made ("Planned for 31°C with afternoon showers"). Showing the old forecast tells the user why an outfit was suggested, even though today's weather may differ.

### 2.2 Data model

New table `saved_outfits`:

| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk | |
| `user_id` | uuid | Owner policy as above |
| `recommendation_id` | uuid | References `outfit_recommendations` with `on delete cascade`. Unique with `user_id`, so saving twice does nothing |
| `created_at` | timestamptz | The saved date |

The saved outfit does not copy the item ids, the source or the explanation. It reads them through `recommendation_id`: `wardrobe_item_ids`, `source`, `explanation`, `warnings`, then the request's `occasion_text` for planner outfits or the batch's `feed_date` and `weather_snapshot` for daily ones. One copy of the data means no drift, and deleting the account cascades cleanly.

**A7.** The retention rule in 1.4 never deletes a saved recommendation. Without that rule, cleaning up old batches would silently empty the saved page.

**Deleted items in a saved outfit.** The card shows a hatched "Deleted item" tile in that slot instead of hiding the outfit. The user saved it and should decide whether to keep it. A card whose items were all deleted shows "All items in this outfit have been removed" and a Remove button.

**Endpoints.** `POST /api/saved-outfits` takes `{ recommendation_id }` and checks that the recommendation belongs to the user, as `POST /api/feedback` does. `DELETE /api/saved-outfits/[id]` removes a save. The page itself is a server component that reads through the Supabase server client, like `/wardrobe`.

### 2.3 Actions on this page

| Action | Behaviour |
|---|---|
| Remove from saved | Deletes the row. A toast with Undo re-inserts it |
| View outfit detail | Opens the detail view in 2.1 |
| Jump to an item | Tapping a tile opens `/wardrobe/[id]` |
| Wear this today | **An addition to the brief.** Writes `wore` feedback on the recommendation. Saved outfits are the ones people actually go back to, so this is where wear data is most likely to be recorded |

### 2.4 Grouping and filtering

**Recommendation.** A flat list, newest first, for now. Add one filter row (All, Daily, Planner) only if the list grows past about 12 outfits.

- **Differs from the brief.** Grouping by season does not fit Singapore, which has no seasons. The closest useful filter is weather, using the `weather_tags` already on the items ("good for rain", "hot days"). Even that should wait until real users have enough saves to need it.
- Grouping by occasion only works for planner outfits, because daily outfits have no occasion. Showing the occasion text on the card's chip gives most of the benefit without a filter.
- Month headers become worth adding at around 20 or more saves, which no user will reach before submission.

## Milestone links

- **AI interaction patterns.** A hybrid workflow: deterministic filtering and scoring, then constrained LLM selection from a vetted candidate list, with a schema-validated output and a rules fallback.
- **Production optimization.** One cached batch per user per day, rules-only fallback, and the `generator` column make it possible to report LLM calls per card and first-open latency.
- **Evaluation.** Add daily-feed cases to the eval set: a wardrobe with no footwear, a wardrobe with one category, a rainy day, and a disliked colour. Check completeness, weather fit and the invented-id rate (which should be 0).
- **AI-specific UI.** The skip action is a weak signal on purpose, while "Not for me" collects reasons. Each card shows "why this" and the forecast it used. The card shows the user's real photos, never a generated image (1.7).
- **Analytics.** Skip, save and wear rates per card position.

## Open questions for the team

1. **Scope before 23 September.** Ship slice 1 only, slices 1 and 2, or none of this until after submission? The recommendation is slice 1 at least, because it is small and strengthens the demo.
2. **Merge order with `outfit-planner`.** Can joojaja merge `origin/outfit-planner` first, so this work builds on `buildFeedbackContext` and the new `schema.sql`? If not, who owns the `outfit_recommendations` changes?
3. **Reset time.** Midnight or 4 am Singapore time (A4)?
4. **Streak, and what counts.** Keep the streak at all? If yes, the recommendation is to count days with a "wearing this" action rather than days the app was opened. An opening streak rewards habit, while a wearing streak records what people actually wore, which fits the wardrobe-first positioning better. It also needs a grace rule for missed days.
5. **Like versus save.** Is dropping a separate like action acceptable (1.3)? If the team wants to keep like, it should be a double-tap on the card, not a third swipe direction.
6. **Footwear.** Allow outfits with an empty shoe slot while the wardrobe has no footwear (1.5), or keep shoes strictly required?
7. **Where the feed lives.** A strip on `/wardrobe` that opens the full-screen view (recommended), or a new tab, which would mean removing or merging one of the existing six?
8. **LLM explanations in slice 2 or 3.** Ship slice 2 with template explanations only and add the LLM step in slice 3? That keeps slice 2 free of any model calls.
9. **Mock-up before building.** Should a static mock-up of the card, using a few real cleaned wardrobe images, come first? It would show whether the multiply blend in 1.7 looks right before anyone builds the feed.
10. **Assumptions A1 to A8.** Please confirm or correct, especially A1 (where jumpsuits are classified) and A8 (whether the Supabase plan can resize images).

## Implementation notes

Added 22 September 2026 while building. These are the places where the code differs from the plan above, and why.

- **The feedback table needed a database change.** `recommendation_feedback` has a check constraint that only allows `wore`, `liked` and `rejected`. Section 1.3 said the database needed no change. `supabase/migrations/20260922_daily_outfits.sql` replaces the constraint to add `dismissed`.
- **The outfit insert policy needed widening.** The policy on `outfit_recommendations` required every row to point at the user's own outfit request. The migration replaces it, so a row must point at the user's own request or the user's own daily batch. A check constraint makes sure it points at exactly one.
- **`daily_outfit_batches` has no `status` or `missing_roles` columns.** When no outfit can be built, nothing is stored and the route works out what is missing on every open. So the only rows are batches that have outfits.
- **Skips are left out of item scores entirely.** `buildFeedbackContext` gives `dismissed` a weight of 0, and a skip never replaces an earlier real response to the same outfit. The daily rules still push a skipped combination down through the 7-day repeat penalty.
- **Saves count like a like.** `buildFeedbackContext` takes the saved recommendation ids as a third argument. `loadFeedbackContext` in `src/lib/outfits/server.ts` now loads feedback and saves for both the planner and the daily feed. The planner route uses it instead of its own query.
- **The rules add outerwear only on rainy days, and only items tagged for rain.** The daily feed does not know whether the user will be indoors, so the `air_conditioned` and `cool_evening` cases from section 1.1 are left out.
- **The rules add at most 1 accessory and 1 bag per outfit,** rotated across the three cards. The collage still has room for 3 extras, for planner outfits that include more.
- **Deleted items in a saved outfit show as a "1 item deleted" label** on the collage, not a hatched tile in the slot. Once an item is deleted, its category is unknown, so there is no slot to put a tile in.
- **Close on the daily view always goes to `/wardrobe`,** rather than back in history, so a direct link never takes the user out of the app.
- **Migrations to run, in order:** `20260922_saved_outfits.sql`, then `20260922_daily_outfits.sql`. Until both have run, the saved page shows a load error and the daily feed shows "Daily outfits are not available right now."
