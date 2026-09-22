// Turns what the vision model read from a screenshot into a PurchaseContext.
// The model output is untrusted: every string is cleaned and capped, every
// chart is rebuilt from numbers and validated, and anything that fails is
// dropped rather than partly used. Relative imports only, for the tests.

import type { SizingExtraction } from "../schemas/ai.ts";
import { validateChart } from "./chart-schema.ts";
import { normaliseBrand } from "./charts/index.ts";
import { CM_PER_INCH } from "./measurements.ts";
import { pointsToRanges } from "./normalise.ts";
import type { MeasurementKey, PurchaseContext, SizeChart, SizingCategory, Unit } from "./types.ts";

// Control characters, zero-width characters and bidirectional overrides,
// which can hide or reorder text on screen
const INVISIBLE_RANGES: [number, number][] = [
  [0x00, 0x1f], [0x7f, 0x9f], [0x200b, 0x200f], [0x2028, 0x202e], [0x2060, 0x2069], [0xfeff, 0xfeff],
];
const INVISIBLE = new RegExp(
  `[${INVISIBLE_RANGES.map(([a, b]) => `${String.fromCharCode(a)}-${String.fromCharCode(b)}`).join("")}]`,
  "g",
);

export function sanitiseText(value: string | null | undefined, max: number): string | null {
  if (!value) return null;
  const clean = value.replace(INVISIBLE, "").replace(/\s+/g, " ").trim().slice(0, max).trim();
  return clean || null;
}

const MEASUREMENT_MAP: Partial<Record<SizingExtraction["size_chart"]["rows"][number]["values"][number]["measurement"], MeasurementKey>> = {
  chest: "chest",
  bust: "chest",
  waist: "waist",
  hips: "hips",
  inseam: "inseam",
  foot_length: "foot_length",
  height: "height",
};

const round1 = (n: number) => Math.round(n * 10) / 10;
const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

// Guesses the unit from the numbers when the chart does not say. Body
// circumferences in cm sit above about 55; in inches they sit well below.
// Feet are above 15 cm and below 14 inches
export function inferUnit(series: Partial<Record<MeasurementKey, number[]>>): Unit | null {
  const around = [...(series.chest ?? []), ...(series.waist ?? []), ...(series.hips ?? [])];
  if (around.length) return median(around) >= 55 ? "cm" : "in";
  if (series.foot_length?.length) return median(series.foot_length) > 15 ? "cm" : "in";
  if (series.inseam?.length) return median(series.inseam) > 45 ? "cm" : "in";
  return null;
}

type ChartResult = { chart: SizeChart; unitGuessed: boolean; basisGuessed: boolean } | { dropped: string };

export function buildProductChart(
  raw: SizingExtraction["size_chart"],
  brand: string | null,
  category: SizingCategory,
  productName: string | null,
  sizeRange: SizeChart["sizeRange"],
  today: string,
): ChartResult {
  if (!raw.present || raw.rows.length < 2) return { dropped: "no chart" };

  const labels = raw.rows.map((r) => sanitiseText(r.label, 24));
  if (labels.some((l) => !l)) return { dropped: "missing size label" };

  // Collect each measurement across rows as [min, max] pairs, where a single
  // printed value becomes a point
  const pairs: Partial<Record<MeasurementKey, ([number, number] | null)[]>> = {};
  raw.rows.forEach((row, i) => {
    for (const v of row.values) {
      const key = MEASUREMENT_MAP[v.measurement];
      if (!key) continue;
      const lo = v.min ?? v.max;
      const hi = v.max ?? v.min;
      if (lo == null || hi == null || !Number.isFinite(lo) || !Number.isFinite(hi)) continue;
      (pairs[key] ??= raw.rows.map(() => null))[i] = [lo, hi];
    }
  });

  const series: Partial<Record<MeasurementKey, number[]>> = {};
  for (const [key, list] of Object.entries(pairs) as [MeasurementKey, ([number, number] | null)[]][]) {
    series[key] = list.filter((p): p is [number, number] => !!p).flat();
  }

  const unitGuessed = raw.unit === "unknown";
  const unit = raw.unit === "unknown" ? inferUnit(series) : raw.unit;
  if (!unit) return { dropped: "unit unclear" };
  const toCm = (n: number) => round1(unit === "in" ? n * CM_PER_INCH : n);

  const rows: SizeChart["rows"] = labels.map((label) => ({ label: label!, ranges: {} }));
  for (const [key, list] of Object.entries(pairs) as [MeasurementKey, ([number, number] | null)[]][]) {
    // A measurement published as one number per size gets ranges split at
    // the midpoints, but only when every row has it
    const allPoints = list.every((p) => p && p[0] === p[1]);
    if (allPoints) {
      const ranges = pointsToRanges(list.map((p) => toCm(p![0])));
      ranges.forEach((r, i) => (rows[i].ranges[key] = r));
    } else {
      list.forEach((p, i) => {
        if (p) rows[i].ranges[key] = [toCm(p[0]), toCm(p[1])];
      });
    }
  }

  const basisGuessed = raw.basis === "unknown";
  const chart: SizeChart = {
    key: `screenshot/${normaliseBrand(brand ?? "product") || "product"}/${category}`,
    brand: brand ?? "This product",
    brandKey: normaliseBrand(brand ?? "product") || "product",
    category,
    sizeRange,
    scope: raw.scope_hint === "brand" ? "brand" : "product",
    ...(productName ? { productName } : {}),
    basis: raw.basis === "unknown" ? "body" : raw.basis,
    unit,
    rows,
    source: { type: "product", retrievedAt: today },
  };

  const check = validateChart(chart);
  if (!check.ok) return { dropped: check.reason };
  return { chart, unitGuessed, basisGuessed };
}

type Confidence = NonNullable<PurchaseContext["extraction"]>["confidence"];

function confidenceFor(
  uncertain: string[],
  chart: SizeChart | null,
  isProductPage: boolean,
  chartDropped: boolean,
  hasIdentity: boolean,
): Confidence {
  if (uncertain.length > 1 || !isProductPage || !hasIdentity) return "low";
  if (uncertain.length === 1 || chartDropped || (chart && chart.basis !== "body")) return "medium";
  return "high";
}

export function toPurchaseContext(x: SizingExtraction, today = new Date().toISOString().slice(0, 10)): PurchaseContext {
  const brand = sanitiseText(x.brand, 80);
  const productName = sanitiseText(x.product_name, 120);
  const category = x.category === "other" ? null : x.category;
  const sizeRange = x.size_range === "unknown" ? null : x.size_range;
  const uncertain = [...new Set(x.uncertain_fields)];

  // The chart needs a category for garment ease. If the model could not
  // tell, build it as a top for now; the confirm step lets the user fix the
  // category and the chart is re-labelled before matching
  const result = x.size_chart.present
    ? buildProductChart(x.size_chart, brand, category ?? "top", productName, sizeRange ?? "unisex", today)
    : null;

  let chart: SizeChart | null = null;
  let chartDropped: string | undefined;
  if (result && "chart" in result) {
    chart = result.chart;
    if ((result.unitGuessed || result.basisGuessed) && !uncertain.includes("size_chart")) {
      uncertain.push("size_chart");
    }
  } else if (result) {
    chartDropped = result.dropped;
  }

  const confidence = confidenceFor(uncertain, chart, x.is_product_page, !!chartDropped, !!brand || !!category);

  return {
    source: "screenshot",
    brand,
    productName,
    category,
    sizeRange,
    chart,
    extraction: {
      confidence,
      uncertainFields: uncertain,
      isProductPage: x.is_product_page,
      ...(chartDropped && chartDropped !== "no chart" ? { chartDropped } : {}),
    },
  };
}

// Combines a second screenshot with the first. A chart from the new
// screenshot wins; fields the user already has keep their values
export function mergeContexts(current: PurchaseContext, next: PurchaseContext): PurchaseContext {
  const merged: PurchaseContext = {
    source: current.source,
    brand: current.brand ?? next.brand,
    productName: current.productName ?? next.productName,
    category: current.category ?? next.category,
    sizeRange: current.sizeRange ?? next.sizeRange,
    chart: next.chart ?? current.chart,
    extraction: null,
  };

  // A doubt belongs to the screenshot the value came from, so a kept brand
  // does not pick up the second screenshot's doubt about its own brand
  const tookFromNext: Record<string, boolean> = {
    brand: current.brand == null,
    product_name: current.productName == null,
    category: current.category == null,
    size_range: current.sizeRange == null,
    size_chart: !!next.chart,
  };
  const uncertain = [
    ...(current.extraction?.uncertainFields ?? []).filter((f) => !tookFromNext[f]),
    ...(next.extraction?.uncertainFields ?? []).filter((f) => tookFromNext[f]),
  ];
  const chartDropped = next.chart ? undefined : (next.extraction?.chartDropped ?? current.extraction?.chartDropped);
  const isProductPage = (current.extraction?.isProductPage ?? true) || (next.extraction?.isProductPage ?? false);

  merged.extraction = {
    confidence: confidenceFor(uncertain, merged.chart, isProductPage, !!chartDropped, !!merged.brand || !!merged.category),
    uncertainFields: uncertain,
    isProductPage,
    ...(chartDropped ? { chartDropped } : {}),
  };
  return merged;
}

// The chart re-labelled with what the user confirmed, so garment ease and
// the result heading follow their corrections
export function chartForContext(ctx: PurchaseContext): SizeChart | null {
  if (!ctx.chart || !ctx.category) return null;
  return {
    ...ctx.chart,
    brand: ctx.brand ?? ctx.chart.brand,
    category: ctx.category,
    sizeRange: ctx.sizeRange ?? ctx.chart.sizeRange,
  };
}
