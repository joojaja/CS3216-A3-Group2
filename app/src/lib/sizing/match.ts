// Deterministic size matching. Plain code, no model: the size a user sees is
// always this function run over numbers, so nothing inside a screenshot or
// web page can choose it.

import { CATEGORY_FIELDS } from "./categories.ts";
import { toBodyRows } from "./normalise.ts";
import type { MeasurementKey, MeasurementProfile, SizeChart, SizingCategory } from "./types.ts";

export type Confidence = "high" | "medium" | "low";

// Where one measurement lands on the chart. lower and upper are row indexes
// and differ only when the value sits between two sizes
export type Placement = {
  key: MeasurementKey;
  valueCm: number;
  lower: number;
  upper: number;
  position: "inside" | "edge" | "gap" | "below" | "above";
};

export type Recommendation =
  | {
      status: "ok";
      size: string;
      sizeIndex: number;
      alternative?: string;
      fitNote?: string;
      decidedBy: MeasurementKey;
      placements: Placement[];
      // Measurements pointing to different sizes, for the "why" line
      spread?: { key: MeasurementKey; size: string }[];
      outOfRange?: "below" | "above";
      // Inseam or height outside the chosen size's range. Informational only:
      // lengths never change the size
      lengthNote?: { key: MeasurementKey; direction: "shorter" | "longer" };
      confidence: Confidence;
    }
  | { status: "needs_measurements"; fields: MeasurementKey[] }
  | { status: "chart_unusable"; reason: string };

// Measurements that decide the size. Lengths only produce a note
const FIT_KEYS: MeasurementKey[] = ["chest", "waist", "hips", "foot_length"];

const LEVELS: Confidence[] = ["high", "medium", "low"];
const drop = (c: Confidence, steps = 1): Confidence =>
  LEVELS[Math.min(LEVELS.length - 1, LEVELS.indexOf(c) + steps)];

export function placeValue(
  key: MeasurementKey,
  valueCm: number,
  rows: SizeChart["rows"],
): Placement | null {
  const indexed = rows
    .map((row, index) => ({ index, range: row.ranges[key] }))
    .filter((r): r is { index: number; range: [number, number] } => !!r.range);
  if (indexed.length === 0) return null;

  const containing = indexed.filter(({ range }) => valueCm >= range[0] && valueCm <= range[1]);
  if (containing.length >= 2) {
    // Touching ranges share an edge, so the value is on the line
    return { key, valueCm, lower: containing[0].index, upper: containing[containing.length - 1].index, position: "edge" };
  }
  if (containing.length === 1) {
    const i = containing[0].index;
    return { key, valueCm, lower: i, upper: i, position: "inside" };
  }

  const first = indexed[0];
  const last = indexed[indexed.length - 1];
  if (valueCm < first.range[0]) return { key, valueCm, lower: first.index, upper: first.index, position: "below" };
  if (valueCm > last.range[1]) return { key, valueCm, lower: last.index, upper: last.index, position: "above" };

  // In a gap between two sizes
  const below = [...indexed].reverse().find(({ range }) => range[1] < valueCm)!;
  const above = indexed.find(({ range }) => range[0] > valueCm)!;
  return { key, valueCm, lower: below.index, upper: above.index, position: "gap" };
}

export function recommendSize(
  profile: MeasurementProfile | null,
  chart: SizeChart,
  category: SizingCategory = chart.category,
): Recommendation {
  const { required, optional } = CATEGORY_FIELDS[category];
  const m = profile?.measurements;
  const missing = required.filter((k) => m?.[k] == null);
  if (!m || missing.length > 0) return { status: "needs_measurements", fields: missing.length ? missing : required };

  const rows = toBodyRows(chart);
  const wanted = [...required, ...optional];
  const placements = wanted
    .filter((k) => m[k] != null)
    .map((k) => placeValue(k, m[k]!, rows))
    .filter((p): p is Placement => p !== null);

  const fit = placements.filter((p) => FIT_KEYS.includes(p.key));
  if (fit.length === 0) return { status: "chart_unusable", reason: "no matching measurement" };

  const fitPref = profile!.fitPreference;
  const between = (p: Placement) => p.lower !== p.upper;
  // Snug takes the smaller of two sizes; regular and relaxed take the larger
  const choose = (p: Placement) => (between(p) && fitPref === "snug" ? p.lower : p.upper);

  // The largest size any fit measurement needs wins: a garment that is too
  // big can be taken in, one that is too small cannot be let out. Ties go to
  // the category's first required measurement
  let decider = fit[0];
  for (const p of fit) {
    if (choose(p) > choose(decider)) decider = p;
  }
  const sizeIndex = choose(decider);
  const label = (i: number) => chart.rows[i].label;

  let alternative: number | undefined;
  let fitNote: string | undefined;
  if (between(decider)) {
    alternative = sizeIndex === decider.upper ? decider.lower : decider.upper;
    fitNote =
      alternative < sizeIndex
        ? `Size down to ${label(alternative)} for a closer fit.`
        : `Size up to ${label(alternative)} for more room.`;
  } else if (fitPref === "relaxed" && sizeIndex < chart.rows.length - 1) {
    alternative = sizeIndex + 1;
    fitNote = `Size up to ${label(alternative)} for a looser fit.`;
  }

  const others = fit.filter((p) => choose(p) !== sizeIndex);
  const spread = others.length
    ? [decider, ...others].map((p) => ({ key: p.key, size: label(choose(p)) }))
    : undefined;
  // Only the neighbouring size is worth offering. Anything smaller would be
  // too tight where the deciding measurement sits
  const closest = others.length ? Math.max(...others.map(choose)) : -1;
  if (alternative === undefined && others.length && closest === sizeIndex - 1) {
    alternative = closest;
    const where = others.find((p) => choose(p) === closest)!.key.replace("_", " ");
    fitNote = `${label(alternative)} may fit if you prefer it closer at the ${where}.`;
  }

  const outOfRange = fit.find((p) => p.position === "below" || p.position === "above")?.position as
    | "below"
    | "above"
    | undefined;

  let lengthNote: Extract<Recommendation, { status: "ok" }>["lengthNote"];
  for (const p of placements.filter((p) => !FIT_KEYS.includes(p.key))) {
    const r = rows[sizeIndex].ranges[p.key];
    if (!r) continue;
    if (p.valueCm < r[0]) lengthNote = { key: p.key, direction: "shorter" };
    else if (p.valueCm > r[1]) lengthNote = { key: p.key, direction: "longer" };
  }

  let confidence: Confidence = chart.source.type === "web" ? "medium" : "high";
  if (chart.basis !== "body" && confidence === "high") confidence = "medium";
  if (between(decider)) confidence = drop(confidence);
  if (fit.some((p) => Math.abs(choose(p) - sizeIndex) > 1)) confidence = drop(confidence);
  if (outOfRange) confidence = drop(confidence);
  if (required.some((k) => !placements.some((p) => p.key === k))) confidence = drop(confidence);

  return {
    status: "ok",
    size: label(sizeIndex),
    sizeIndex,
    alternative: alternative === undefined ? undefined : label(alternative),
    fitNote,
    decidedBy: decider.key,
    placements,
    spread,
    outOfRange,
    lengthNote,
    confidence,
  };
}
