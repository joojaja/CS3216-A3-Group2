import type { SupabaseClient } from "@supabase/supabase-js";
import type { CollageItem, SavedOutfitView } from "@/lib/outfits/types";

// Signed image links last an hour, matching the wardrobe page
const SIGNED_URL_SECONDS = 3600;

type ItemRow = {
  id: string;
  image_path: string;
  category: string;
  subcategory: string | null;
  primary_colour: string | null;
  ai_confidence: { image_source?: string } | null;
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

  const { data } = await supabase
    .from("wardrobe_items")
    .select("id, image_path, category, subcategory, primary_colour, ai_confidence")
    .eq("user_id", userId)
    .in("id", unique);
  const rows = (data ?? []) as ItemRow[];

  const paths = rows.map((row) => row.image_path).filter(Boolean);
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
    request: { occasion_text: string; weather_snapshot: { short?: string } | null } | null;
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
      "created_at, recommendation:outfit_recommendations(id, wardrobe_item_ids, explanation, warnings, request:outfit_requests(occasion_text, weather_snapshot))",
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
      source: "planner",
      occasion: rec.request?.occasion_text ?? null,
      feedDate: null,
      weather: rec.request?.weather_snapshot?.short ?? null,
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
