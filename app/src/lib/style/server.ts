import type { SupabaseClient } from "@supabase/supabase-js";
import type { StyleItem } from "./archetypes";

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
