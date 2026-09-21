// Turns a size chart into body measurement ranges in cm, which is the only
// shape the matcher understands. Relative imports only, for the test runner.

import type { MeasurementKey, SizeChart, SizingCategory } from "./types.ts";

type Row = SizeChart["rows"][number];

// Measurements that go around the body. A garment laid flat shows half of
// these, so they are doubled. Lengths such as inseam are never doubled
const CIRCUMFERENCES: MeasurementKey[] = ["chest", "waist", "hips"];

// Room a garment has over the body at each point, subtracted from garment
// charts to estimate the body range they fit. Rough, which is why garment
// charts cap confidence at medium
export const EASE_CM: Record<SizingCategory, Partial<Record<MeasurementKey, number>>> = {
  top: { chest: 8 },
  bottom: { waist: 2, hips: 4 },
  dress: { chest: 6, waist: 4, hips: 4 },
  footwear: {},
};

const round1 = (n: number) => Math.round(n * 10) / 10;

// Converts one published value per size into touching ranges split at the
// midpoints between neighbours. The first and last sizes extend by half the
// gap to their only neighbour. Values must already be in ascending order
export function pointsToRanges(values: number[]): [number, number][] {
  if (values.length === 1) return [[values[0], values[0]]];
  const mids = values.slice(1).map((v, i) => round1((values[i] + v) / 2));
  return values.map((v, i) => {
    const low = i === 0 ? round1(v - (mids[0] - v)) : mids[i - 1];
    const high = i === values.length - 1 ? round1(v + (v - mids[i - 1])) : mids[i];
    return [low, high];
  });
}

// Body ranges in cm for matching. Stored charts are already cm; product and
// web charts arrive converted to cm by extraction
export function toBodyRows(chart: SizeChart): Row[] {
  if (chart.basis === "body") return chart.rows;
  const ease = EASE_CM[chart.category];
  return chart.rows.map((row) => {
    const ranges: Row["ranges"] = {};
    for (const [key, range] of Object.entries(row.ranges) as [MeasurementKey, [number, number]][]) {
      const factor = chart.basis === "garment_flat" && CIRCUMFERENCES.includes(key) ? 2 : 1;
      const minus = ease[key] ?? 0;
      ranges[key] = [round1(range[0] * factor - minus), round1(range[1] * factor - minus)];
    }
    return { label: row.label, ranges };
  });
}
