import type { SupabaseClient } from "@supabase/supabase-js";
import type { StyleGrouping, StyleItem } from "./archetypes";
import { readCachedGrouping, toCachePayload, type CacheRow } from "./validate-archetypes";
import { wardrobeHash } from "./archetype-prompt";

// The cached grouping if it still fits these items. `ordered` is the style
// item list in prompt order, the same list the API route hashes
export function cachedGroupingFor(row: CacheRow | null, ordered: StyleItem[]): StyleGrouping | null {
  return readCachedGrouping(row, {
    hash: wardrobeHash(ordered),
    itemIds: new Set(ordered.map((item) => item.id)),
    now: Date.now(),
  });
}

// Null when there is no row, or when the table does not exist yet because the
// migration has not run. Either way the caller builds a fresh grouping
export async function readStyleCache(supabase: SupabaseClient, userId: string): Promise<CacheRow | null> {
  const { data, error } = await supabase
    .from("style_archetypes")
    .select("wardrobe_hash, source, payload, generated_at")
    .eq("user_id", userId)
    .maybeSingle();
  return error ? null : (data as CacheRow | null);
}

export async function writeStyleCache(
  supabase: SupabaseClient,
  userId: string,
  hash: string,
  grouping: StyleGrouping,
) {
  const { error } = await supabase.from("style_archetypes").upsert({
    user_id: userId,
    wardrobe_hash: hash,
    source: grouping.source,
    payload: toCachePayload(grouping.archetypes),
    generated_at: new Date().toISOString(),
  });
  // A failed write only costs a model call on the next view
  if (error) console.error("[style:cache]", error.code);
}

export type StyleRow = StyleItem & {
  image_path: string;
  secondary_colours: string[];
};

const STYLE_COLUMNS =
  "id, image_path, category, subcategory, primary_colour, secondary_colours, pattern, formality, material_cues";

// The signed-in user's confirmed items and typed style preferences. RLS
// limits both queries to the user; the explicit user_id filter keeps that
// true even if a policy changes
export async function loadStyleData(supabase: SupabaseClient, userId: string) {
  const [itemsResult, profileResult] = await Promise.all([
    supabase
      .from("wardrobe_items")
      .select(STYLE_COLUMNS)
      .eq("user_id", userId)
      .eq("attributes_confirmed", true),
    supabase.from("user_profiles").select("preferred_styles").eq("user_id", userId).maybeSingle(),
  ]);
  if (itemsResult.error) return null;
  return {
    items: (itemsResult.data ?? []) as StyleRow[],
    preferredStyles: ((profileResult.data?.preferred_styles as string[] | null) ?? []).filter(Boolean),
  };
}
