// Which measurements each clothing category needs, so the app only asks for
// what is relevant. Required fields block a recommendation until given;
// optional ones refine it when present.

import type { MeasurementKey, SizingCategory } from "./types.ts";

export const CATEGORY_FIELDS: Record<
  SizingCategory,
  { required: MeasurementKey[]; optional: MeasurementKey[] }
> = {
  top: { required: ["chest"], optional: ["waist", "height"] },
  bottom: { required: ["waist"], optional: ["hips", "inseam"] },
  dress: { required: ["chest", "waist"], optional: ["hips"] },
  footwear: { required: ["foot_length"], optional: [] },
};

export const CATEGORY_LABELS: Record<SizingCategory, string> = {
  top: "Top",
  bottom: "Bottoms",
  dress: "Dress",
  footwear: "Shoes",
};
