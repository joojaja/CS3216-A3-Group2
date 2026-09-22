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

// The daily feed ------------------------------------------------------------

export type DailyAction = "dismissed" | "wore" | "rejected";

export type DailyCard = {
  // The outfit_recommendations id, used for feedback and saves
  id: string;
  itemIds: string[];
  explanation: string;
  warnings: string[];
  saved: boolean;
  // The user's latest response to this card today, if any
  action: DailyAction | null;
};

type DailyCommon = {
  // True when Supabase is not configured and the feed is built from demo items
  demo: boolean;
  // Singapore date the feed is for, YYYY-MM-DD
  feedDate: string;
  // When the next batch becomes available, ISO time
  nextRefreshAt: string;
  hasFootwear: boolean;
};

export type DailyFeed =
  | (DailyCommon & {
      status: "ready";
      cards: DailyCard[];
      items: Record<string, CollageItem>;
      // Short forecast used, for example "25 to 34°C. Thundery Showers"
      weather: string | null;
      // Confirmed items added after today's batch was made
      addedSinceBatch: number;
    })
  | (DailyCommon & {
      status: "insufficient";
      // Roles missing before any outfit can be built. Empty when the
      // wardrobe has the roles but no pair passes the rules
      missing: ("top" | "bottom")[];
      confirmedCount: number;
      unconfirmedCount: number;
    });
