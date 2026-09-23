import test from "node:test";
import assert from "node:assert/strict";
import { STORED_CHARTS, STORED_BRANDS, brandSuggestions, findChart, normaliseBrand } from "../src/lib/sizing/charts/index.ts";
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

test("the autocomplete list has one entry per brand", () => {
  assert.equal(new Set(STORED_BRANDS).size, STORED_BRANDS.length);
});
