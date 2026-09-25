import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildFeedbackContext,
  type FeedbackContext,
  type StoredOutfitFeedback,
  type StoredOutfitRecommendation,
} from "@/lib/outfit-feedback";
import type { CollageItem, SavedOutfitView } from "@/lib/outfits/types";

// Recent feedback and saved outfits for one user, turned into per-item
// scores and a prompt line. Shared by the planner and the daily feed so a
// "too warm" in one shapes the next pick in the other. Skips are left out of
// the query, so they never crowd real responses out of the limit.
export async function loadFeedbackContext(
  supabase: SupabaseClient,
  userId: string,
): Promise<FeedbackContext> {
  const [feedbackResult, savedResult] = await Promise.all([
    supabase
      .from("recommendation_feedback")
      .select("recommendation_id, action, reason, free_text, created_at")
      .eq("user_id", userId)
      .neq("action", "dismissed")
      .order("created_at", { ascending: false })
      .limit(40),
    // Errors until the saved_outfits migration has run, which just means no saves
    supabase
      .from("saved_outfits")
      .select("recommendation_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(40),
  ]);

  const feedbackRows = (feedbackResult.data ?? []) as StoredOutfitFeedback[];
  const savedIds = ((savedResult.data ?? []) as { recommendation_id: string }[]).map(
    (row) => row.recommendation_id,
  );
  const recommendationIds = [
    ...new Set([...feedbackRows.map((feedback) => feedback.recommendation_id), ...savedIds]),
  ];
  const recommendationResult = recommendationIds.length
    ? await supabase
        .from("outfit_recommendations")
        .select("id, wardrobe_item_ids")
        .eq("user_id", userId)
        .in("id", recommendationIds)
    : { data: [] };

  return buildFeedbackContext(
    feedbackRows,
    (recommendationResult.data ?? []) as StoredOutfitRecommendation[],
    savedIds,
  );
}

// Signed image links last an hour, matching the wardrobe page
const SIGNED_URL_SECONDS = 3600;

type ItemRow = {
  id: string;
  image_path: string;
  category: string;
  subcategory: string | null;
  primary_colour: string | null;
  ai_confidence: { image_source?: string } | null;
  // Absent until the item cut-outs migration has run
  cutout_path?: string | null;
};

// Reads the given wardrobe items for one user and signs their photos. Ids
// that are missing from the result have been deleted, or were never the
// user's to begin with.
export async function loadCollageItems(
  supabase: SupabaseClient,
  userId: string,
  ids: string[],
): Promise<Map<string, CollageItem>> {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return new Map();

  // All columns rather than a list, so this keeps working before the item
  // cut-outs migration adds cutout_path
  const { data } = await supabase
    .from("wardrobe_items")
    .select("*")
    .eq("user_id", userId)
    .in("id", unique);
  const rows = (data ?? []) as ItemRow[];

  const paths = rows
    .flatMap((row) => [row.image_path, row.cutout_path])
    .filter((path): path is string => Boolean(path));
  const { data: signed } = paths.length
    ? await supabase.storage.from("wardrobe-images").createSignedUrls(paths, SIGNED_URL_SECONDS)
    : { data: [] };
  const urlByPath = new Map((signed ?? []).map((entry) => [entry.path, entry.signedUrl]));

  return new Map(
    rows.map((row) => [
      row.id,
      {
        id: row.id,
        category: row.category,
        subcategory: row.subcategory,
        primary_colour: row.primary_colour,
        signed_image_url: urlByPath.get(row.image_path) ?? null,
        image_source: row.ai_confidence?.image_source ?? null,
        cutout_url: row.cutout_path ? (urlByPath.get(row.cutout_path) ?? null) : null,
      },
    ]),
  );
}

type SavedRow = {
  created_at: string;
  recommendation: {
    id: string;
    wardrobe_item_ids: string[];
    explanation: string | null;
    warnings: string[] | null;
    source: "planner" | "daily" | null;
    request: { occasion_text: string; weather_snapshot: { short?: string } | null } | null;
    daily_batch: { feed_date: string; weather_snapshot: { short?: string } | null } | null;
  } | null;
};

// Every saved outfit for one user, newest first, with its items resolved
export async function loadSavedOutfits(
  supabase: SupabaseClient,
  userId: string,
): Promise<SavedOutfitView[]> {
  const { data, error } = await supabase
    .from("saved_outfits")
    .select(
      "created_at, recommendation:outfit_recommendations(id, wardrobe_item_ids, explanation, warnings, source, request:outfit_requests(occasion_text, weather_snapshot), daily_batch:daily_outfit_batches(feed_date, weather_snapshot))",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`saved outfits: ${error.code}`);

  const rows = ((data ?? []) as unknown as SavedRow[]).filter((row) => row.recommendation);
  const recIds = rows.map((row) => row.recommendation!.id);
  const [items, worn] = await Promise.all([
    loadCollageItems(
      supabase,
      userId,
      rows.flatMap((row) => row.recommendation!.wardrobe_item_ids),
    ),
    lastWornByRecommendation(supabase, userId, recIds),
  ]);

  return rows.map((row) => {
    const rec = row.recommendation!;
    const present = rec.wardrobe_item_ids
      .map((id) => items.get(id))
      .filter((item): item is CollageItem => Boolean(item));
    return {
      recommendationId: rec.id,
      savedAt: row.created_at,
      source: rec.source === "daily" ? "daily" : "planner",
      occasion: rec.request?.occasion_text ?? null,
      feedDate: rec.daily_batch?.feed_date ?? null,
      weather:
        rec.request?.weather_snapshot?.short ?? rec.daily_batch?.weather_snapshot?.short ?? null,
      explanation: rec.explanation,
      warnings: rec.warnings ?? [],
      items: present,
      deletedCount: rec.wardrobe_item_ids.length - present.length,
      lastWornAt: worn.get(rec.id) ?? null,
    };
  });
}

async function lastWornByRecommendation(
  supabase: SupabaseClient,
  userId: string,
  recIds: string[],
): Promise<Map<string, string>> {
  if (recIds.length === 0) return new Map();
  const { data } = await supabase
    .from("recommendation_feedback")
    .select("recommendation_id, created_at")
    .eq("user_id", userId)
    .eq("action", "wore")
    .in("recommendation_id", recIds)
    .order("created_at", { ascending: false });

  const latest = new Map<string, string>();
  for (const row of (data ?? []) as { recommendation_id: string; created_at: string }[]) {
    if (!latest.has(row.recommendation_id)) latest.set(row.recommendation_id, row.created_at);
  }
  return latest;
}
