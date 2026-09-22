import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { getSingaporeForecast, type SingaporeForecast } from "@/lib/weather";
import { demoItems } from "@/lib/demo-items";
import { arrangeOutfit } from "@/lib/outfits/arrange";
import {
  buildDailyOutfits,
  coreSignature,
  readForecast,
  type RuleItem,
} from "@/lib/outfits/daily-rules";
import { loadCollageItems, loadFeedbackContext } from "@/lib/outfits/server";
import { nextSingaporeMidnight, singaporeDate } from "@/lib/outfits/sg-day";
import type { CollageItem, DailyAction, DailyCard, DailyFeed } from "@/lib/outfits/types";

const RULE_ITEM_COLUMNS =
  "id, category, subcategory, primary_colour, pattern, formality, layering_role, weather_tags, created_at";

// One generation per user and day at a time on this instance. The unique
// (user_id, feed_date) constraint is the real guard across instances
const generating = new Map<string, Promise<GenerateResult>>();

type GenerateResult =
  | { kind: "batch" }
  | { kind: "insufficient"; missing: ("top" | "bottom")[]; confirmed: number; unconfirmed: number };

// Today's outfits for the signed-in user. The first request of a Singapore
// day builds them from the wardrobe with deterministic rules and stores them;
// later requests read the stored batch. No model is called.
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
        .select("preferred_colours, disliked_colours")
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

  const result = buildDailyOutfits({
    items,
    weather: readForecast(forecast),
    preferredColours: profileResult.data?.preferred_colours ?? [],
    dislikedColours: profileResult.data?.disliked_colours ?? [],
    itemScores: feedback.itemScores,
    recentItemIds,
    recentSignatures,
    seed: feedDate,
  });

  if (result.outfits.length === 0) {
    return {
      kind: "insufficient",
      missing: result.missing,
      confirmed: items.length,
      unconfirmed: unconfirmedResult.count ?? 0,
    };
  }

  const batchId = randomUUID();
  const { error: batchError } = await supabase.from("daily_outfit_batches").insert({
    id: batchId,
    user_id: userId,
    feed_date: feedDate,
    weather_snapshot: forecast ?? null,
    generator: "rules",
  });
  if (batchError) {
    // Another request made today's batch first, so the caller reads that one
    if (batchError.code === "23505") return { kind: "batch" };
    throw new Error(`batch: ${batchError.code}`);
  }

  const { error: recsError } = await supabase.from("outfit_recommendations").insert(
    result.outfits.map((outfit, position) => ({
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

  const [items, feedbackResult, savedResult, footwear, addedResult] = await Promise.all([
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
