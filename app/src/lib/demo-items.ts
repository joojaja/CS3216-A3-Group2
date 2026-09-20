import type { WardrobeItem } from "@/lib/types";

// Placeholder items shown only when Supabase is not configured, so the
// frontend can be browsed without a backend. Shared by the wardrobe grid
// and the item detail page.

const now = new Date().toISOString();

function demo(
  id: string,
  category: string,
  subcategory: string,
  primary_colour: string,
  formality: string,
  layering_role: string,
  weather_tags: string[],
  extra: Partial<WardrobeItem> = {},
): WardrobeItem {
  return {
    id,
    user_id: "dev",
    image_path: "",
    category,
    subcategory,
    primary_colour,
    secondary_colours: [],
    pattern: "solid",
    material_cues: null,
    formality,
    layering_role,
    weather_tags,
    user_notes: null,
    ai_confidence: null,
    attributes_confirmed: true,
    created_at: now,
    ...extra,
  };
}

export const demoItems: WardrobeItem[] = [
  demo("demo-1", "top", "linen shirt", "off-white", "smart_casual", "standalone", ["hot_humid", "air_conditioned"], {
    material_cues: "lightweight weave",
    ai_confidence: { notes: "Weave looks like linen but could be a cotton blend.", uncertain_fields: ["material_cues"] },
  }),
  demo("demo-2", "top", "cotton tee", "apricot", "casual", "base", ["hot_humid"]),
  demo("demo-3", "bottom", "chinos", "navy", "smart_casual", "standalone", ["all_weather"]),
  demo("demo-4", "footwear", "canvas shoes", "sage", "casual", "standalone", ["rain", "all_weather"]),
  demo("demo-5", "outerwear", "denim jacket", "indigo", "casual", "outer", ["air_conditioned", "cool_evening"], {
    material_cues: "heavy",
  }),
  demo("demo-6", "top", "poplin shirt", "butter", "business", "standalone", ["air_conditioned"]),
  demo("demo-7", "top", "knit top", "rose", "casual", "standalone", ["hot_humid"]),
  demo("demo-8", "bottom", "wide trousers", "grey", "smart_casual", "standalone", ["hot_humid", "all_weather"]),
];
