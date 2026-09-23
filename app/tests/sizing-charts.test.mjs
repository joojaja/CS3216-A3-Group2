import test from "node:test";
import assert from "node:assert/strict";
import { STORED_CHARTS, STORED_BRANDS, brandCoverage, brandSuggestions, findChart, fitToCoverage, normaliseBrand } from "../src/lib/sizing/charts/index.ts";
import { validateChart } from "../src/lib/sizing/chart-schema.ts";

test("every stored chart passes validation", () => {
  assert.ok(STORED_CHARTS.length > 0);
  for (const chart of STORED_CHARTS) {
    assert.deepEqual(validateChart(chart), { ok: true }, chart.key);
    assert.equal(chart.source.type, "stored", chart.key);
    assert.ok(chart.source.url?.startsWith("https://"), `${chart.key} needs a source URL`);
    assert.equal(chart.key, `${chart.brandKey}/${chart.sizeRange}/${chart.category}`);
  }
});

test("chart keys are unique", () => {
  const keys = STORED_CHARTS.map((c) => c.key);
  assert.equal(new Set(keys).size, keys.length);
});

test("brand names normalise across common spellings", () => {
  for (const name of ["H&M", "h and m", "HnM", "H & M"]) assert.equal(normaliseBrand(name), "hm", name);
  assert.equal(normaliseBrand("Cotton On"), "cottonon");
  assert.equal(normaliseBrand("Love, Bonito"), "lovebonito");
  assert.equal(normaliseBrand("NIKE"), "nike");
});

test("findChart matches brand, category and size range", () => {
  assert.equal(findChart("H&M", "top", "mens")?.key, "hm/mens/top");
  assert.equal(findChart("Love Bonito", "dress", null)?.key, "lovebonito/womens/dress");
  // H&M has both ranges, so an unknown range asks instead of guessing
  assert.equal(findChart("H&M", "top", null), null);
  // Unisex charts serve either range
  assert.equal(findChart("nike", "footwear", "womens")?.key, "nike/unisex/footwear");
  assert.equal(findChart("Unknown Brand", "top", "womens"), null);
});

test("Cotton On covers men's and women's tops and bottoms", () => {
  // Men's was missing, so a men's lookup returned no size
  assert.equal(findChart("Cotton On", "top", "mens")?.key, "cottonon/mens/top");
  assert.equal(findChart("Cotton On", "bottom", "mens")?.key, "cottonon/mens/bottom");
  assert.equal(findChart("Cotton On", "top", "womens")?.key, "cottonon/womens/top");
  // With both ranges stored, an unknown range asks instead of assuming women's
  assert.equal(findChart("Cotton On", "top", null), null);
});

test("brand suggestions list every brand once one is picked", () => {
  // A native datalist filtered to the picked brand and showed nothing, so
  // the picker looked dead after a selection
  assert.deepEqual(brandSuggestions(""), STORED_BRANDS);
  assert.deepEqual(brandSuggestions("H&M"), STORED_BRANDS);
  assert.deepEqual(brandSuggestions("cotton on"), STORED_BRANDS);
});

test("brand suggestions filter on the normalised name", () => {
  assert.deepEqual(brandSuggestions("hnm"), STORED_BRANDS);
  assert.deepEqual(brandSuggestions("cott"), ["Cotton On"]);
  assert.deepEqual(brandSuggestions("bonito"), ["Love, Bonito"]);
  assert.deepEqual(brandSuggestions("Shein"), []);
});

test("brand coverage lists the categories and ranges a brand has charts for", () => {
  assert.deepEqual(brandCoverage("Nike")?.categories, ["footwear"]);
  // A unisex chart serves both ranges
  assert.deepEqual(brandCoverage("Nike")?.ranges.footwear, ["womens", "mens"]);
  assert.deepEqual(brandCoverage("Love Bonito")?.ranges.top, ["womens"]);
  assert.ok(!brandCoverage("H&M")?.categories.includes("dress"));
  assert.equal(brandCoverage("Unknown Brand"), null);
  assert.equal(brandCoverage(""), null);
});

test("manual picks are kept inside what the brand covers", () => {
  const nike = brandCoverage("Nike");
  const lb = brandCoverage("Love Bonito");
  const hm = brandCoverage("H&M");
  // One category: preselected
  assert.deepEqual(fitToCoverage(nike, "top", "mens"), { category: "footwear", range: "mens" });
  // A category the brand lacks is cleared, and the range left alone
  assert.deepEqual(fitToCoverage(hm, "dress", "mens"), { category: null, range: "mens" });
  // A range the category lacks moves to the only one there is
  assert.deepEqual(fitToCoverage(lb, "top", "mens"), { category: "top", range: "womens" });
  // Not sure stays not sure
  assert.deepEqual(fitToCoverage(lb, "top", null), { category: "top", range: null });
  // Unknown brands change nothing
  assert.deepEqual(fitToCoverage(null, "dress", "mens"), { category: "dress", range: "mens" });
});

test("the autocomplete list has one entry per brand", () => {
  assert.equal(new Set(STORED_BRANDS).size, STORED_BRANDS.length);
});
