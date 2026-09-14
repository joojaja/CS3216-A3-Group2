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
  attributes_confirmed: boolean;
  created_at: string;
  signed_image_url?: string;
};
