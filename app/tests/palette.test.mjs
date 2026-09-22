import test from "node:test";
import assert from "node:assert/strict";
import { buildPalette, paletteGradient } from "../src/lib/style/palette.ts";
import { roundedPercents } from "../src/lib/style/shares.ts";

const item = (id, primary_colour, secondary_colours = []) => ({ id, primary_colour, secondary_colours });

test("rows count items by family, largest first", () => {
  const palette = buildPalette([
    item("a", "grey"),
    item("b", "heather grey"),
    item("c", "navy"),
    item("d", "charcoal"),
    item("e", "medium grey"),
  ]);
  assert.deepEqual(
    palette.rows.map((row) => [row.key, row.count]),
    [["grey", 3], ["charcoal", 1], ["navy", 1]],
  );
  assert.deepEqual(palette.rows[0].itemIds, ["a", "b", "e"]);
});

test("percentages add up to 100", () => {
  const palette = buildPalette([item("a", "red"), item("b", "blue"), item("c", "green")]);
  assert.deepEqual(palette.rows.map((row) => row.percent), [34, 33, 33]);
  const larger = buildPalette(
    ["black", "black", "black", "black", "white", "white", "tan", "olive", "navy", "navy", "grey", "red", "pink"].map(
      (colour, index) => item(String(index), colour),
    ),
  );
  assert.equal(larger.rows.reduce((sum, row) => sum + row.percent, 0), 100);
});

test("unrecognised colours go to a last row and still count", () => {
  const palette = buildPalette([item("a", "iridescent"), item("b", "black"), item("c", null), item("d", "black")]);
  const last = palette.rows.at(-1);
  assert.equal(last.key, "other");
  assert.equal(last.count, 2);
  assert.deepEqual(last.itemIds, ["a", "c"]);
  assert.equal(palette.total, 4);
});

test("secondary colours never change shares", () => {
  const without = buildPalette([item("a", "white"), item("b", "navy")]);
  const withSecondary = buildPalette([item("a", "white", ["navy", "red"]), item("b", "navy", ["navy"])]);
  assert.deepEqual(
    withSecondary.rows.map((row) => [row.key, row.count, row.percent]),
    without.rows.map((row) => [row.key, row.count, row.percent]),
  );
  // White top with navy stripes: navy also appears in one item
  assert.equal(withSecondary.rows.find((row) => row.key === "navy").alsoIn, 1);
});

test("footwear, accessories and bags count like clothes", () => {
  // The palette takes every item it is given; the page passes all categories
  const palette = buildPalette([item("shoe", "tan"), item("bag", "tan"), item("top", "white")]);
  assert.equal(palette.rows[0].key, "tan");
  assert.equal(palette.rows[0].count, 2);
});

test("neutral share counts neutral families only", () => {
  const palette = buildPalette([item("a", "black"), item("b", "denim"), item("c", "red"), item("d", "pink")]);
  assert.equal(palette.neutralPercent, 50);
});

test("empty wardrobe gives an empty palette", () => {
  const palette = buildPalette([]);
  assert.deepEqual(palette.rows, []);
  assert.equal(palette.neutralPercent, 0);
});

test("gradient places each swatch at the middle of its share", () => {
  assert.equal(
    paletteGradient([{ hex: "#000000", count: 1 }, { hex: "#FFFFFF", count: 3 }]),
    "linear-gradient(90deg, #000000 12.5%, #FFFFFF 62.5%)",
  );
  assert.equal(paletteGradient([{ hex: "#123456", count: 4 }]), "#123456");
});

test("rounded percents handle zeros and ties", () => {
  assert.deepEqual(roundedPercents([]), []);
  assert.deepEqual(roundedPercents([0, 0]), [0, 0]);
  assert.deepEqual(roundedPercents([1, 1, 1]), [34, 33, 33]);
  assert.deepEqual(roundedPercents([2, 1]), [67, 33]);
});
