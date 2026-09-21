import { z } from "zod";

// Supported vocabularies. The model must only emit these values.

export const CLOTHING_CATEGORIES = [
  "top",
  "bottom",
  "outerwear",
  "dress",
  "footwear",
  "accessory",
  "bag",
  "activewear",
  "sleepwear",
] as const;

export const FORMALITY_LEVELS = [
  "casual",
  "smart_casual",
  "business",
  "formal",
] as const;

export const LAYERING_ROLES = [
  "base",
  "mid",
  "outer",
  "standalone",
] as const;

export const WEATHER_TAGS = [
  "hot_humid",
  "rain",
  "air_conditioned",
  "cool_evening",
  "all_weather",
] as const;

export const DECISION_LABELS = [
  "likely_redundant",
  "potentially_useful",
  "fills_wardrobe_gap",
  "insufficient_information",
] as const;

export const clothingAttributesSchema = z.object({
  category: z.enum(CLOTHING_CATEGORIES),
  subcategory: z.string(),
  primary_colour: z.string(),
  secondary_colours: z.array(z.string()).default([]),
  pattern: z.string(),
  material_cues: z.string(),
  formality: z.enum(FORMALITY_LEVELS),
  layering_role: z.enum(LAYERING_ROLES),
  weather_tags: z.array(z.enum(WEATHER_TAGS)).default([]),
  confidence_notes: z.string(),
  // Names of the fields above the model is not confident about, so the UI
  // can mark them for the user to check first
  uncertain_fields: z.array(z.string()).default([]),
});

export type ClothingAttributes = z.infer<typeof clothingAttributesSchema>;

// What the user can edit. The confidence fields describe the AI's draft
// rather than the garment, so they are never edited directly
export type EditableAttributes = Omit<ClothingAttributes, "confidence_notes" | "uncertain_fields">;

export const editableAttributesSchema = clothingAttributesSchema.omit({
  confidence_notes: true,
  uncertain_fields: true,
});

// Where the garment sits in a photo, on Gemini's native 0 to 1000 grid with
// the origin at the top left. Used to crop when on-device segmentation fails
export const garmentLocationSchema = z.object({
  found: z.boolean(),
  ymin: z.number().int().min(0).max(1000),
  xmin: z.number().int().min(0).max(1000),
  ymax: z.number().int().min(0).max(1000),
  xmax: z.number().int().min(0).max(1000),
});

export type GarmentLocation = z.infer<typeof garmentLocationSchema>;

export const occasionConstraintsSchema = z.object({
  occasion_type: z.string(),
  formality: z.enum(FORMALITY_LEVELS),
  indoor_outdoor: z.enum(["indoor", "outdoor", "mixed"]),
  notes: z.string(),
});

export type OccasionConstraints = z.infer<typeof occasionConstraintsSchema>;

export const outfitSelectionSchema = z.object({
  // False when the message is not about choosing or adjusting an outfit from
  // the wardrobe. The planner only ever answers with outfits, so anything else
  // is declined in one sentence instead of answered
  is_outfit_request: z.boolean(),
  decline_message: z.string().default(""),
  outfits: z
    .array(
      z.object({
        item_ids: z.array(z.uuid()).min(1),
        explanation: z.string(),
        warnings: z.array(z.string()).default([]),
      }),
    )
    .max(3),
});

export type OutfitSelection = z.infer<typeof outfitSelectionSchema>;

export const purchaseEvaluationSchema = z.object({
  decision_label: z.enum(DECISION_LABELS),
  compatibility_score: z.number().min(0).max(1),
  redundancy_score: z.number().min(0).max(1),
  similar_item_ids: z.array(z.uuid()).default([]),
  explanation: z.string(),
  uncertainty_notes: z.string(),
});

export type PurchaseEvaluation = z.infer<typeof purchaseEvaluationSchema>;

export const exploreSelectionSchema = z.object({
  recommendations: z
    .array(
      z.object({
        product_id: z.string().min(1),
        reason: z.string().min(1).max(240),
      }),
    )
    .length(10),
});

export type ExploreSelection = z.infer<typeof exploreSelectionSchema>;
