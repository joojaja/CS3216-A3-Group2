// Shared sizing types. Kept free of React and path aliases so the Node test
// runner can import this file directly.

export const MEASUREMENT_KEYS = [
  "height",
  "chest",
  "waist",
  "hips",
  "inseam",
  "foot_length",
] as const;
export type MeasurementKey = (typeof MEASUREMENT_KEYS)[number];

export type Unit = "cm" | "in";
export type SizeRange = "mens" | "womens";
export type FitPreference = "snug" | "regular" | "relaxed";

export type SizingCategory = "top" | "bottom" | "dress" | "footwear";

// Body measurements, always stored in cm. Null means skipped or not yet given.
export type Measurements = Record<MeasurementKey, number | null>;

export type MeasurementProfile = {
  unit: Unit;
  sizeRange: SizeRange | null;
  fitPreference: FitPreference;
  measurements: Measurements;
};

// A size chart normalised to body measurements in cm. Each row holds a
// [min, max] range per measurement it covers, and rows run smallest first.
export type SizeChart = {
  key: string; // "uniqlo/womens/bottom"
  brand: string; // display name, "Uniqlo"
  brandKey: string; // normalised, "uniqlo"
  category: SizingCategory;
  sizeRange: SizeRange | "unisex";
  scope: "brand" | "product";
  productName?: string;
  // What the published chart measured. Garment charts are converted to body
  // ranges before they reach the matcher, and cap confidence at medium.
  basis: "body" | "garment" | "garment_flat";
  unit: Unit; // unit as published, for display only
  rows: { label: string; ranges: Partial<Record<MeasurementKey, [number, number]>> }[];
  source: { type: "product" | "stored" | "web"; url?: string; retrievedAt: string };
};
