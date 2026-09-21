// Shape and sanity checks for size charts. Every chart passes through
// validateChart before the matcher sees it, whether it came from the stored
// set, a screenshot or the web. A chart that fails is dropped, never partly
// used.

import { z } from "zod";
import { MEASUREMENT_KEYS } from "./types.ts";
import type { MeasurementKey, SizeChart } from "./types.ts";
import { MEASUREMENT_BY_KEY } from "./measurements.ts";
import { toBodyRows } from "./normalise.ts";

const range = z.tuple([z.number().finite(), z.number().finite()]);

export const sizeChartSchema = z.object({
  key: z.string().min(1).max(120),
  brand: z.string().min(1).max(80),
  brandKey: z.string().min(1).max(80),
  category: z.enum(["top", "bottom", "dress", "footwear"]),
  sizeRange: z.enum(["mens", "womens", "unisex"]),
  scope: z.enum(["brand", "product"]),
  productName: z.string().max(120).optional(),
  basis: z.enum(["body", "garment", "garment_flat"]),
  unit: z.enum(["cm", "in"]),
  rows: z
    .array(
      z.object({
        label: z.string().min(1).max(24),
        ranges: z.partialRecord(z.enum(MEASUREMENT_KEYS), range),
      }),
    )
    .min(2)
    .max(40),
  source: z.object({
    type: z.enum(["product", "stored", "web"]),
    url: z.string().max(500).optional(),
    retrievedAt: z.string().max(40),
  }),
});

// Wider than the friendly limits in measurements.ts, because a chart's
// smallest and largest sizes legitimately sit past the average person
const SLACK_CM: Record<MeasurementKey, number> = {
  height: 30,
  chest: 20,
  waist: 20,
  hips: 20,
  inseam: 15,
  foot_length: 6,
};

export type ChartCheck = { ok: true } | { ok: false; reason: string };

export function validateChart(chart: SizeChart): ChartCheck {
  if (!sizeChartSchema.safeParse(chart).success) return { ok: false, reason: "shape" };

  const labels = chart.rows.map((r) => r.label.trim().toLowerCase());
  if (new Set(labels).size !== labels.length) return { ok: false, reason: "duplicate labels" };

  const rows = toBodyRows(chart);
  let covered = 0;
  for (const key of MEASUREMENT_KEYS) {
    const [min, max] = MEASUREMENT_BY_KEY[key].plausible;
    let prevMin = -Infinity;
    let prevMax = -Infinity;
    let seen = 0;
    for (const row of rows) {
      const r = row.ranges[key];
      if (!r) continue;
      seen += 1;
      if (r[0] > r[1]) return { ok: false, reason: `${key} range reversed` };
      // Sizes run smallest first, so neither end may go backwards
      if (r[0] < prevMin || r[1] < prevMax) return { ok: false, reason: `${key} not ascending` };
      if (r[0] < min - SLACK_CM[key] || r[1] > max + SLACK_CM[key]) {
        return { ok: false, reason: `${key} implausible` };
      }
      prevMin = r[0];
      prevMax = r[1];
    }
    if (seen >= 2) covered += 1;
  }
  if (covered === 0) return { ok: false, reason: "no usable measurement" };
  return { ok: true };
}
