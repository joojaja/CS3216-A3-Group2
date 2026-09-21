import test from "node:test";
import assert from "node:assert/strict";
import { recommendSize, placeValue } from "../src/lib/sizing/match.ts";
import { explainRecommendation } from "../src/lib/sizing/explain.ts";
import { pointsToRanges, toBodyRows } from "../src/lib/sizing/normalise.ts";
import { validateChart } from "../src/lib/sizing/chart-schema.ts";

const empty = { height: null, chest: null, waist: null, hips: null, inseam: null, foot_length: null };
const profile = (measurements, fitPreference = "regular") => ({
  unit: "cm",
  sizeRange: "womens",
  fitPreference,
  measurements: { ...empty, ...measurements },
});

// Touching ranges, as most brand charts publish them
const topChart = {
  key: "test/womens/top",
  brand: "Test",
  brandKey: "test",
  category: "top",
  sizeRange: "womens",
  scope: "brand",
  basis: "body",
  unit: "cm",
  rows: [
    { label: "S", ranges: { chest: [82, 88], waist: [64, 70] } },
    { label: "M", ranges: { chest: [88, 94], waist: [70, 76] } },
    { label: "L", ranges: { chest: [94, 100], waist: [76, 82] } },
    { label: "XL", ranges: { chest: [100, 106], waist: [82, 88] } },
  ],
  source: { type: "stored", retrievedAt: "2026-09-21" },
};

const bottomChart = {
  ...topChart,
  key: "test/womens/bottom",
  category: "bottom",
  rows: [
    { label: "S", ranges: { waist: [64, 70], hips: [88, 94], inseam: [76, 78] } },
    { label: "M", ranges: { waist: [70, 76], hips: [94, 100], inseam: [77, 79] } },
    { label: "L", ranges: { waist: [76, 82], hips: [100, 106], inseam: [78, 80] } },
  ],
};

// Ranges with gaps between sizes
const gappedChart = {
  ...topChart,
  rows: [
    { label: "S", ranges: { chest: [82, 86] } },
    { label: "M", ranges: { chest: [88, 92] } },
    { label: "L", ranges: { chest: [94, 98] } },
  ],
};

test("a value inside one range picks that size with high confidence", () => {
  const rec = recommendSize(profile({ chest: 91 }), topChart);
  assert.equal(rec.status, "ok");
  assert.equal(rec.size, "M");
  assert.equal(rec.alternative, undefined);
  assert.equal(rec.confidence, "high");
  assert.equal(rec.decidedBy, "chest");
});

test("a value on a shared edge is between sizes and picks the larger by default", () => {
  const rec = recommendSize(profile({ chest: 94 }), topChart);
  assert.equal(rec.size, "L");
  assert.equal(rec.alternative, "M");
  assert.match(rec.fitNote, /Size down to M/);
  assert.equal(rec.confidence, "medium");
});

test("snug fit picks the smaller size when between", () => {
  const rec = recommendSize(profile({ chest: 94 }, "snug"), topChart);
  assert.equal(rec.size, "M");
  assert.equal(rec.alternative, "L");
  assert.match(rec.fitNote, /Size up to L/);
});

test("relaxed fit offers the next size up even inside a range", () => {
  const rec = recommendSize(profile({ chest: 91 }, "relaxed"), topChart);
  assert.equal(rec.size, "M");
  assert.equal(rec.alternative, "L");
});

test("a value in a gap between rows counts as between sizes", () => {
  const placement = placeValue("chest", 87, gappedChart.rows);
  assert.equal(placement.position, "gap");
  const rec = recommendSize(profile({ chest: 87 }), gappedChart);
  assert.equal(rec.size, "M");
  assert.equal(rec.alternative, "S");
});

test("below the smallest and above the largest size are flagged and lower confidence", () => {
  const small = recommendSize(profile({ chest: 70 }), topChart);
  assert.equal(small.size, "S");
  assert.equal(small.outOfRange, "below");
  assert.equal(small.confidence, "medium");

  const big = recommendSize(profile({ chest: 130 }), topChart);
  assert.equal(big.size, "XL");
  assert.equal(big.outOfRange, "above");
});

test("measurements pointing to different sizes pick the larger and say why", () => {
  const rec = recommendSize(profile({ waist: 72, hips: 102 }), bottomChart);
  assert.equal(rec.size, "L");
  assert.equal(rec.decidedBy, "hips");
  assert.deepEqual(rec.spread.map((s) => s.size), ["L", "M"]);
  const { notes } = explainRecommendation(rec, bottomChart, "cm");
  assert.ok(notes.some((n) => n.includes("fits at the hips")));
});

test("a spread of more than one size drops confidence and offers no smaller size", () => {
  const rec = recommendSize(profile({ chest: 84, waist: 86 }), topChart);
  assert.equal(rec.size, "XL");
  assert.equal(rec.confidence, "medium");
  // S would be far too tight at the waist, so it is not suggested
  assert.equal(rec.alternative, undefined);
  assert.equal(rec.fitNote, undefined);
});

test("an adjacent spread offers the neighbouring size", () => {
  const rec = recommendSize(profile({ waist: 72, hips: 102 }), bottomChart);
  assert.equal(rec.alternative, "M");
  assert.match(rec.fitNote, /closer at the waist/);
});

test("the explanation says hips are, not hips is", () => {
  const rec = recommendSize(profile({ waist: 72, hips: 102 }), bottomChart);
  const { reason } = explainRecommendation(rec, bottomChart, "cm");
  assert.match(reason, /^Your hips are 102 cm/);
});

test("a missing required measurement asks for exactly that one", () => {
  const rec = recommendSize(profile({ hips: 98 }), bottomChart);
  assert.deepEqual(rec, { status: "needs_measurements", fields: ["waist"] });
});

test("no saved profile asks for the category's required measurements", () => {
  assert.deepEqual(recommendSize(null, topChart), { status: "needs_measurements", fields: ["chest"] });
});

test("a missing optional measurement still gives a size", () => {
  const rec = recommendSize(profile({ waist: 72 }), bottomChart);
  assert.equal(rec.size, "M");
  assert.equal(rec.spread, undefined);
});

test("inseam never changes the size, only adds a length note", () => {
  const rec = recommendSize(profile({ waist: 72, inseam: 70 }), bottomChart);
  assert.equal(rec.size, "M");
  assert.deepEqual(rec.lengthNote, { key: "inseam", direction: "shorter" });
});

test("a chart without the required measurement lowers confidence", () => {
  const hipsOnly = { ...bottomChart, rows: bottomChart.rows.map((r) => ({ label: r.label, ranges: { hips: r.ranges.hips } })) };
  const rec = recommendSize(profile({ waist: 72, hips: 96 }), hipsOnly);
  assert.equal(rec.size, "M");
  assert.equal(rec.confidence, "medium");
});

test("a chart with none of the user's fit measurements is unusable", () => {
  const lengthOnly = { ...bottomChart, rows: bottomChart.rows.map((r) => ({ label: r.label, ranges: { inseam: r.ranges.inseam } })) };
  assert.equal(recommendSize(profile({ waist: 72 }), lengthOnly).status, "chart_unusable");
});

test("an inch profile matches a cm chart because values are stored in cm", () => {
  // 36 inches is 91.44 cm, inside M
  const rec = recommendSize({ ...profile({ chest: 36 * 2.54 }), unit: "in" }, topChart);
  assert.equal(rec.size, "M");
  const { reason } = explainRecommendation(rec, topChart, "in");
  assert.match(reason, /is 36 in,/);
});

test("a laid-flat garment chart is doubled and eased before matching", () => {
  const flat = {
    ...topChart,
    basis: "garment_flat",
    rows: [
      { label: "S", ranges: { chest: [46, 49] } },
      { label: "M", ranges: { chest: [49, 52] } },
    ],
  };
  // Flat 49 to 52 is garment 98 to 104, body 90 to 96 after 8 cm ease
  assert.deepEqual(toBodyRows(flat)[1].ranges.chest, [90, 96]);
  const rec = recommendSize(profile({ chest: 92 }), flat);
  assert.equal(rec.size, "M");
  assert.equal(rec.confidence, "medium");
});

test("single published values become touching ranges at the midpoints", () => {
  assert.deepEqual(pointsToRanges([80, 84, 88]), [[78, 82], [82, 86], [86, 90]]);
  assert.deepEqual(pointsToRanges([25]), [[25, 25]]);
});

test("the explanation quotes the matched range", () => {
  const rec = recommendSize(profile({ chest: 91 }), topChart);
  const { reason } = explainRecommendation(rec, topChart, "cm");
  assert.equal(reason, "Your chest or bust is 91 cm, which falls in Test's M range (88 to 94 cm).");
});

test("chart validation rejects bad charts and accepts the test charts", () => {
  assert.deepEqual(validateChart(topChart), { ok: true });
  assert.deepEqual(validateChart(bottomChart), { ok: true });
  const reversed = { ...topChart, rows: [...topChart.rows].reverse() };
  assert.equal(validateChart(reversed).ok, false);
  const one = { ...topChart, rows: [topChart.rows[0]] };
  assert.equal(validateChart(one).ok, false);
  const dup = { ...topChart, rows: [topChart.rows[0], { ...topChart.rows[1], label: "S" }] };
  assert.equal(validateChart(dup).ok, false);
  const silly = { ...topChart, rows: [{ label: "S", ranges: { chest: [5, 6] } }, { label: "M", ranges: { chest: [6, 7] } }] };
  assert.equal(validateChart(silly).ok, false);
  const inverted = { ...topChart, rows: [{ label: "S", ranges: { chest: [90, 80] } }, topChart.rows[1]] };
  assert.equal(validateChart(inverted).ok, false);
});
