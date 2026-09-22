// Canned model outputs for local testing without a paid Gemini call
// (AGENTS.md rule 6). Only used when NODE_ENV is development and
// SIZING_EXTRACT_MOCK=1. The file name picks the scenario, so each confirm
// state can be tried: include "nochart", "flat", "shaky" or "notclothing".
// "Sample Shop" is a made-up brand so the numbers are never mistaken for a
// real chart.

import type { SizingExtraction } from "../schemas/ai.ts";

const v = (measurement: SizingExtraction["size_chart"]["rows"][number]["values"][number]["measurement"], min: number, max = min) => ({
  measurement,
  min,
  max,
});

const withChart: SizingExtraction = {
  is_product_page: true,
  brand: "Sample Shop",
  product_name: "Relaxed linen trousers",
  category: "bottom",
  size_range: "womens",
  size_chart: {
    present: true,
    unit: "cm",
    basis: "body",
    scope_hint: "product",
    rows: [
      { label: "XS", values: [v("waist", 60, 64), v("hips", 86, 90)] },
      { label: "S", values: [v("waist", 64, 68), v("hips", 90, 94)] },
      { label: "M", values: [v("waist", 68, 72), v("hips", 94, 98)] },
      { label: "L", values: [v("waist", 72, 77), v("hips", 98, 103)] },
      { label: "XL", values: [v("waist", 77, 82), v("hips", 103, 108)] },
    ],
  },
  uncertain_fields: [],
};

const noChart: SizingExtraction = {
  ...withChart,
  brand: "H&M",
  product_name: "Wide trousers",
  size_chart: { present: false, unit: "unknown", basis: "unknown", scope_hint: "unknown", rows: [] },
};

const flat: SizingExtraction = {
  ...withChart,
  product_name: "Oversized tee",
  category: "top",
  size_range: "unisex",
  size_chart: {
    present: true,
    unit: "unknown",
    basis: "garment_flat",
    scope_hint: "product",
    rows: [
      { label: "S", values: [v("chest", 50)] },
      { label: "M", values: [v("chest", 53)] },
      { label: "L", values: [v("chest", 56)] },
      { label: "XL", values: [v("chest", 59)] },
    ],
  },
  uncertain_fields: ["size_range"],
};

const shaky: SizingExtraction = {
  ...withChart,
  brand: "Sampel Shp",
  uncertain_fields: ["brand", "size_chart"],
};

const notClothing: SizingExtraction = {
  is_product_page: false,
  brand: null,
  product_name: null,
  category: "other",
  size_range: "unknown",
  size_chart: { present: false, unit: "unknown", basis: "unknown", scope_hint: "unknown", rows: [] },
  uncertain_fields: ["brand", "category"],
};

export function mockExtraction(fileName: string): SizingExtraction {
  const name = fileName.toLowerCase();
  if (name.includes("notclothing")) return notClothing;
  if (name.includes("nochart")) return noChart;
  if (name.includes("flat")) return flat;
  if (name.includes("shaky")) return shaky;
  return withChart;
}
