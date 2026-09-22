// Shapes shared by the saved outfits page, the daily feed and the collage.

// One wardrobe item as the outfit card draws it
export type CollageItem = {
  id: string;
  category: string;
  subcategory: string | null;
  primary_colour: string | null;
  signed_image_url: string | null;
  // ai_confidence.image_source: original, cleaned, cropped, isolated or ironed
  image_source?: string | null;
};

export type OutfitSource = "planner" | "daily";

export type SavedOutfitView = {
  recommendationId: string;
  savedAt: string;
  source: OutfitSource;
  // The planner request text, or null for a daily outfit
  occasion: string | null;
  // Singapore date of the daily batch (YYYY-MM-DD), or null for the planner
  feedDate: string | null;
  // Short forecast from when the outfit was made, for example "25 to 33°C. Showers"
  weather: string | null;
  explanation: string | null;
  warnings: string[];
  items: CollageItem[];
  // Items the outfit referenced that are no longer in the wardrobe
  deletedCount: number;
  lastWornAt: string | null;
};
