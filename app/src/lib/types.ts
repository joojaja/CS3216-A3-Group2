export type WardrobeItem = {
  id: string;
  user_id: string;
  image_path: string;
  category: string;
  subcategory: string | null;
  primary_colour: string | null;
  secondary_colours: string[];
  pattern: string | null;
  material_cues: string | null;
  formality: string | null;
  layering_role: string | null;
  weather_tags: string[];
  user_notes: string | null;
  // What the model said about its own draft when the item was added
  ai_confidence?: {
    notes?: string;
    uncertain_fields?: string[];
    // original, cleaned, cropped or beautified
    image_source?: string;
    // Background removal found no garment, so no cut-out will be made
    cutout_failed?: boolean;
  } | null;
  // Transparent PNG of the garment alone, drawn on outfit cards
  cutout_path?: string | null;
  attributes_confirmed: boolean;
  created_at: string;
  updated_at?: string;
  signed_image_url?: string;
};
