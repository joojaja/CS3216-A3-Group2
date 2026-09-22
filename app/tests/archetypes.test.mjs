import test from "node:test";
import assert from "node:assert/strict";
import { closestGroup, ruleArchetypes, signatureOf } from "../src/lib/style/archetypes.ts";

const item = (id, category, primary_colour, formality = "casual", extra = {}) => ({
  id,
  category,
  subcategory: null,
  primary_colour,
  pattern: "solid",
  formality,
  ...extra,
});

const wardrobe = [
  item("01", "top", "grey"),
  item("02", "top", "white"),
  item("03", "bottom", "black"),
  item("04", "footwear", "white"),
  item("05", "top", "navy", "smart_casual"),
  item("06", "bottom", "beige", "smart_casual"),
  item("07", "footwear", "brown", "smart_casual"),
  item("08", "top", "red", "casual", { pattern: "floral" }),
  item("09", "dress", "pink", "casual", { pattern: "floral print" }),
  item("10", "activewear", "black", "casual", { subcategory: "leggings" }),
  item("11", "bottom", "grey", "casual", { subcategory: "joggers" }),
];

test("signatures read formality, colour, pattern and activewear", () => {
  assert.deepEqual(signatureOf(item("a", "top", "navy", "business")), {
    formality: "dressy",
    palette: "neutral",
    pattern: "plain",
    active: false,
  });
  assert.deepEqual(signatureOf(item("b", "bottom", "red", null, { pattern: "check", subcategory: "track pants" })), {
    formality: "casual",
    palette: "colourful",
    pattern: "patterned",
    active: true,
  });
  // A colour we cannot place does not make its own colourful group
  assert.equal(signatureOf(item("c", "top", "iridescent")).palette, "neutral");
});

test("groups items that share a signature, largest first", () => {
  const archetypes = ruleArchetypes(wardrobe);
  assert.deepEqual(
    archetypes.map((archetype) => [archetype.name, archetype.itemIds]),
    [
      ["Neutral casual", ["01", "02", "03", "04"]],
      ["Neutral smart casual", ["05", "06", "07"]],
      ["Patterned casual", ["08", "09"]],
      ["Neutral activewear", ["10", "11"]],
    ],
  );
  assert.deepEqual(archetypes.map((archetype) => archetype.percent), [37, 27, 18, 18]);
  assert.equal(archetypes[0].description, "Neutral colours in plain fabrics, for everyday casual wear.");
});

test("the same items give the same groups in any order", () => {
  const forward = ruleArchetypes(wardrobe);
  const reversed = ruleArchetypes([...wardrobe].reverse());
  assert.deepEqual(reversed, forward);
});

test("single items merge into the nearest group", () => {
  const archetypes = ruleArchetypes([
    item("a", "top", "white"),
    item("b", "top", "grey"),
    item("c", "bottom", "black"),
    // Alone in its signature; shares three fields with the neutral casual group
    item("d", "top", "white", "smart_casual"),
  ]);
  assert.equal(archetypes.length, 1);
  assert.deepEqual([...archetypes[0].itemIds].sort(), ["a", "b", "c", "d"]);
  assert.equal(archetypes[0].percent, 100);
});

test("never more than four archetypes", () => {
  const many = [];
  let n = 0;
  for (const colour of ["white", "red"])
    for (const pattern of ["solid", "stripe"])
      for (const formality of ["casual", "smart_casual", "business"])
        for (let copy = 0; copy < 3; copy++) many.push(item(String(n++).padStart(3, "0"), "top", colour, formality, { pattern }));
  const archetypes = ruleArchetypes(many);
  assert.ok(archetypes.length <= 4);
  assert.equal(archetypes.flatMap((archetype) => archetype.itemIds).length, many.length);
});

test("sleepwear is left out; footwear, accessories and bags count", () => {
  const archetypes = ruleArchetypes([
    item("a", "sleepwear", "pink"),
    item("b", "footwear", "white"),
    item("c", "accessory", "black"),
    item("d", "bag", "tan"),
  ]);
  assert.deepEqual(archetypes.flatMap((archetype) => archetype.itemIds).sort(), ["b", "c", "d"]);
});

test("a one-item wardrobe is one archetype at 100%", () => {
  const archetypes = ruleArchetypes([item("a", "top", "red")]);
  assert.equal(archetypes.length, 1);
  assert.equal(archetypes[0].percent, 100);
  assert.equal(archetypes[0].name, "Colourful casual");
});

test("an empty wardrobe has no archetypes", () => {
  assert.deepEqual(ruleArchetypes([]), []);
  assert.deepEqual(ruleArchetypes([item("a", "sleepwear", "grey")]), []);
});

test("names stay unique when short names collide", () => {
  const archetypes = ruleArchetypes([
    item("a", "top", "white", "casual", { pattern: "stripe" }),
    item("b", "top", "grey", "casual", { pattern: "check" }),
    item("c", "top", "red", "casual", { pattern: "floral" }),
    item("d", "top", "pink", "casual", { pattern: "polka dot" }),
  ]);
  assert.deepEqual(archetypes.map((archetype) => archetype.name).sort(), [
    "Colourful patterned casual",
    "Neutral patterned casual",
  ]);
});

test("closest group prefers more shared fields, then the larger group", () => {
  const casualNeutral = { formality: "casual", palette: "neutral", pattern: "plain", active: false };
  const smartNeutral = { formality: "smart", palette: "neutral", pattern: "plain", active: false };
  const colourful = { formality: "casual", palette: "colourful", pattern: "patterned", active: false };
  assert.equal(closestGroup(casualNeutral, [[colourful], [smartNeutral]]), 1);
  assert.equal(closestGroup(casualNeutral, [[smartNeutral], [smartNeutral, smartNeutral]]), 1);
  assert.equal(closestGroup(casualNeutral, [[], [colourful]]), 1);
});
