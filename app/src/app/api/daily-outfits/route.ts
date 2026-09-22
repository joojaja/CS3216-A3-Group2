import { randomUUID } from "node:crypto";
import { generateObject } from "ai";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getModel, MODEL_ID, reportAiError } from "@/lib/ai/gemini";
import { dailyPicksSchema } from "@/lib/schemas/ai";
import {
  applyDailyPicks,
  buildDailyPrompt,
  DAILY_CANDIDATE_COUNT,
  DAILY_PICK_COUNT,
  DAILY_PROMPT_VERSION,
} from "@/lib/outfits/daily-prompt";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { getSingaporeForecast, type SingaporeForecast } from "@/lib/weather";
import { demoItems } from "@/lib/demo-items";
import { arrangeOutfit } from "@/lib/outfits/arrange";
import {
  buildDailyOutfits,
  coreSignature,
  readForecast,
  type DailyOutfit,
  type RuleItem,
} from "@/lib/outfits/daily-rules";
import { loadCollageItems, loadFeedbackContext } from "@/lib/outfits/server";
import { nextSingaporeMidnight, singaporeDate } from "@/lib/outfits/sg-day";
import { wearStreak, type WearStreak } from "@/lib/outfits/streak";
import type { CollageItem, DailyAction, DailyCard, DailyFeed } from "@/lib/outfits/types";

// A slow model should not hold up the first open of the day for long
const MODEL_TIMEOUT_MS = 8000;

const RULE_ITEM_COLUMNS =
  "id, category, subcategory, primary_colour, pattern, formality, layering_role, weather_tags, created_at";

// One generation per user and day at a time on this instance. The unique
// (user_id, feed_date) constraint is the real guard across instances
const generating = new Map<string, Promise<GenerateResult>>();

type GenerateResult =
  | { kind: "batch" }
  | { kind: "insufficient"; missing: ("top" | "bottom")[]; confirmed: number; unconfirmed: number };

// Today's outfits for the signed-in user. The first request of a Singapore
// day builds candidates from the wardrobe with deterministic rules, lets one
// free-tier model call pick and explain three of them (falling back to the
// rules' own picks), and stores the result. Later requests read the batch.
export async function GET() {
  const feedDate = singaporeDate();
  const nextRefreshAt = nextSingaporeMidnight();

  const supabase = await createClient();
  if (!supabase) {
    return Response.json(await demoFeed(feedDate, nextRefreshAt));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  if (!checkRateLimit(`daily:${user.id}`, 30, 60_000)) {
    return Response.json({ error: "Too many requests. Wait a moment and try again." }, { status: 429 });
  }

  let batch = await readBatch(supabase, user.id, feedDate);
  if (batch === "error") {
    return Response.json({ error: "Daily outfits are not available right now." }, { status: 503 });
  }

  if (!batch) {
    const key = `${user.id}:${feedDate}`;
    let job = generating.get(key);
    if (!job) {
      job = generate(supabase, user.id, feedDate).finally(() => generating.delete(key));
      generating.set(key, job);
    }
    let result: GenerateResult;
    try {
      result = await job;
    } catch (error) {
      console.error("[daily:generate]", error instanceof Error ? error.message : "unknown");
      return Response.json({ error: "Could not build today's outfits." }, { status: 500 });
    }

    if (result.kind === "insufficient") {
      const feed: DailyFeed = {
        status: "insufficient",
        demo: false,
        feedDate,
        nextRefreshAt,
        hasFootwear: await hasFootwear(supabase, user.id),
        streak: await loadStreak(supabase, user.id, feedDate),
        missing: result.missing,
        confirmedCount: result.confirmed,
        unconfirmedCount: result.unconfirmed,
      };
      return Response.json(feed);
    }

    batch = await readBatch(supabase, user.id, feedDate);
    if (!batch || batch === "error") {
      return Response.json({ error: "Could not build today's outfits." }, { status: 500 });
    }
  }

  return Response.json(await readyFeed(supabase, user.id, batch, feedDate, nextRefreshAt));
}

type BatchRow = { id: string; created_at: string; weather_snapshot: SingaporeForecast | null };

async function readBatch(
  supabase: SupabaseClient,
  userId: string,
  feedDate: string,
): Promise<BatchRow | null | "error"> {
  const { data, error } = await supabase
    .from("daily_outfit_batches")
    .select("id, created_at, weather_snapshot")
    .eq("user_id", userId)
    .eq("feed_date", feedDate)
    .maybeSingle();
  if (error) {
    // Most likely the daily outfits migration has not been run
    console.error("[daily:read-batch]", error.code);
    return "error";
  }
  return data as BatchRow | null;
}

// Wears over the last 60 days are plenty to count a streak
async function loadStreak(
  supabase: SupabaseClient,
  userId: string,
  feedDate: string,
): Promise<WearStreak> {
  const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("recommendation_feedback")
    .select("created_at")
    .eq("user_id", userId)
    .eq("action", "wore")
    .gte("created_at", since);
  return wearStreak(((data ?? []) as { created_at: string }[]).map((row) => row.created_at), feedDate);
}

async function hasFootwear(supabase: SupabaseClient, userId: string) {
  const { count } = await supabase
    .from("wardrobe_items")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("attributes_confirmed", true)
    .eq("category", "footwear");
  return (count ?? 0) > 0;
}

async function generate(
  supabase: SupabaseClient,
  userId: string,
  feedDate: string,
): Promise<GenerateResult> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;

  const [itemsResult, unconfirmedResult, profileResult, feedback, recentResult, forecast] =
    await Promise.all([
      supabase
        .from("wardrobe_items")
        .select(RULE_ITEM_COLUMNS)
        .eq("user_id", userId)
        .eq("attributes_confirmed", true),
      supabase
        .from("wardrobe_items")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("attributes_confirmed", false),
      supabase
        .from("user_profiles")
        .select("preferred_colours, preferred_styles, disliked_colours")
        .eq("user_id", userId)
        .maybeSingle(),
      loadFeedbackContext(supabase, userId),
      supabase
        .from("outfit_recommendations")
        .select("wardrobe_item_ids, created_at")
        .eq("user_id", userId)
        .eq("source", "daily")
        .gte("created_at", weekAgo),
      getSingaporeForecast(),
    ]);

  if (itemsResult.error) throw new Error(`wardrobe: ${itemsResult.error.code}`);
  const items = (itemsResult.data ?? []) as RuleItem[];
  const categoryById = new Map(items.map((item) => [item.id, item.category]));

  const recent = (recentResult.data ?? []) as { wardrobe_item_ids: string[]; created_at: string }[];
  const recentItemIds = recent
    .filter((row) => Date.parse(row.created_at) >= threeDaysAgo)
    .flatMap((row) => row.wardrobe_item_ids);
  const recentSignatures = recent.map((row) =>
    coreSignature(
      row.wardrobe_item_ids
        .filter((id) => categoryById.has(id))
        .map((id) => ({ id, category: categoryById.get(id)! })),
    ),
  );

  const weather = readForecast(forecast);
  const result = buildDailyOutfits({
    items,
    weather,
    preferredColours: profileResult.data?.preferred_colours ?? [],
    dislikedColours: profileResult.data?.disliked_colours ?? [],
    itemScores: feedback.itemScores,
    recentItemIds,
    recentSignatures,
    seed: feedDate,
    count: DAILY_CANDIDATE_COUNT,
  });

  if (result.outfits.length === 0) {
    return {
      kind: "insufficient",
      missing: result.missing,
      confirmed: items.length,
      unconfirmed: unconfirmedResult.count ?? 0,
    };
  }

  // The rules' top picks, unless the model picks better ones and explains them
  const candidates = result.outfits;
  const picked =
    candidates.length > 1
      ? await pickWithModel(
          buildDailyPrompt({
            candidates,
            items: new Map(items.map((item) => [item.id, item])),
            weather,
            preferredColours: profileResult.data?.preferred_colours ?? [],
            preferredStyles: profileResult.data?.preferred_styles ?? [],
          }),
          candidates,
        )
      : null;
  const outfits = picked ?? candidates.slice(0, DAILY_PICK_COUNT);

  const batchId = randomUUID();
  const { error: batchError } = await supabase.from("daily_outfit_batches").insert({
    id: batchId,
    user_id: userId,
    feed_date: feedDate,
    weather_snapshot: forecast ?? null,
    generator: picked ? "rules_llm" : "rules",
  });
  if (batchError) {
    // Another request made today's batch first, so the caller reads that one
    if (batchError.code === "23505") return { kind: "batch" };
    throw new Error(`batch: ${batchError.code}`);
  }

  const { error: recsError } = await supabase.from("outfit_recommendations").insert(
    outfits.map((outfit, position) => ({
      id: randomUUID(),
      user_id: userId,
      source: "daily",
      daily_batch_id: batchId,
      position,
      wardrobe_item_ids: outfit.itemIds,
      explanation: outfit.explanation,
      warnings: outfit.warnings,
    })),
  );
  if (recsError) {
    await supabase.from("daily_outfit_batches").delete().eq("id", batchId);
    throw new Error(`recommendations: ${recsError.code}`);
  }

  return { kind: "batch" };
}

// One free-tier call per user per day at most. Text only, so it never needs
// or touches the paid key; getModel("free") throws if the free key is
// missing, and any failure falls back to the rules
async function pickWithModel(prompt: string, candidates: DailyOutfit[]) {
  const started = Date.now();
  try {
    const { object, usage } = await generateObject({
      model: getModel("free"),
      schema: dailyPicksSchema,
      prompt,
      abortSignal: AbortSignal.timeout(MODEL_TIMEOUT_MS),
    });
    console.log(
      `[ai:daily] ${MODEL_ID} key=free prompt=${DAILY_PROMPT_VERSION} ${Date.now() - started}ms tokens=${usage.totalTokens ?? "?"}`,
    );
    const picked = applyDailyPicks(candidates, object.picks);
    if (!picked) console.warn("[ai:daily] picks failed validation, using the rules");
    return picked;
  } catch (error) {
    reportAiError("daily", error, {
      model: MODEL_ID,
      key: "free",
      ms: Date.now() - started,
      candidates: candidates.length,
    });
    return null;
  }
}

type RecRow = {
  id: string;
  wardrobe_item_ids: string[];
  explanation: string | null;
  warnings: string[] | null;
};

async function readyFeed(
  supabase: SupabaseClient,
  userId: string,
  batch: BatchRow,
  feedDate: string,
  nextRefreshAt: string,
): Promise<DailyFeed> {
  const { data: recData } = await supabase
    .from("outfit_recommendations")
    .select("id, wardrobe_item_ids, explanation, warnings")
    .eq("user_id", userId)
    .eq("daily_batch_id", batch.id)
    .order("position", { ascending: true });
  const recs = (recData ?? []) as RecRow[];
  const recIds = recs.map((rec) => rec.id);

  const [items, feedbackResult, savedResult, footwear, addedResult, streak] = await Promise.all([
    loadCollageItems(supabase, userId, recs.flatMap((rec) => rec.wardrobe_item_ids)),
    recIds.length
      ? supabase
          .from("recommendation_feedback")
          .select("recommendation_id, action")
          .eq("user_id", userId)
          .in("recommendation_id", recIds)
          .in("action", ["dismissed", "wore", "rejected"])
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    recIds.length
      ? supabase
          .from("saved_outfits")
          .select("recommendation_id")
          .eq("user_id", userId)
          .in("recommendation_id", recIds)
      : Promise.resolve({ data: [] }),
    hasFootwear(supabase, userId),
    supabase
      .from("wardrobe_items")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("attributes_confirmed", true)
      .gt("created_at", batch.created_at),
    loadStreak(supabase, userId, feedDate),
  ]);

  const actionByRec = new Map<string, DailyAction>();
  for (const row of (feedbackResult.data ?? []) as { recommendation_id: string; action: DailyAction }[]) {
    if (!actionByRec.has(row.recommendation_id)) actionByRec.set(row.recommendation_id, row.action);
  }
  const saved = new Set(
    ((savedResult.data ?? []) as { recommendation_id: string }[]).map((row) => row.recommendation_id),
  );

  const cards: DailyCard[] = [];
  for (const rec of recs) {
    const present = rec.wardrobe_item_ids.filter((id) => items.has(id));
    // A card that lost its top, bottom or dress since this morning is hidden
    const slots = arrangeOutfit(present.map((id) => items.get(id)!));
    if (!slots.onepiece && !(slots.top && slots.bottom)) continue;
    cards.push({
      id: rec.id,
      itemIds: present,
      explanation: rec.explanation ?? "",
      warnings: rec.warnings ?? [],
      saved: saved.has(rec.id),
      action: actionByRec.get(rec.id) ?? null,
    });
  }

  return {
    status: "ready",
    demo: false,
    feedDate,
    nextRefreshAt,
    hasFootwear: footwear,
    streak,
    cards,
    items: Object.fromEntries(items),
    weather: batch.weather_snapshot?.short ?? null,
    addedSinceBatch: addedResult.count ?? 0,
  };
}

// Supabase is not configured: build the same kind of feed from the demo
// items so the page can be tried without an account
async function demoFeed(feedDate: string, nextRefreshAt: string): Promise<DailyFeed> {
  const forecast = await getSingaporeForecast();
  const result = buildDailyOutfits({
    items: demoItems,
    weather: readForecast(forecast),
    preferredColours: [],
    dislikedColours: [],
    itemScores: {},
    recentItemIds: [],
    recentSignatures: [],
    seed: feedDate,
  });
  const items: Record<string, CollageItem> = Object.fromEntries(
    demoItems.map((item) => [
      item.id,
      {
        id: item.id,
        category: item.category,
        subcategory: item.subcategory,
        primary_colour: item.primary_colour,
        signed_image_url: null,
      },
    ]),
  );
  return {
    status: "ready",
    demo: true,
    feedDate,
    nextRefreshAt,
    hasFootwear: demoItems.some((item) => item.category === "footwear"),
    streak: { days: 0, wornToday: false },
    cards: result.outfits.map((outfit, index) => ({
      id: `demo-daily-${index + 1}`,
      itemIds: outfit.itemIds,
      explanation: outfit.explanation,
      warnings: outfit.warnings,
      saved: false,
      action: null,
    })),
    items,
    weather: forecast?.short ?? null,
    addedSinceBatch: 0,
  };
}
