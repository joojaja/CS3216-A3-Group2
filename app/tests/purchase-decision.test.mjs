import test from "node:test";
import assert from "node:assert/strict";
import { applyDecisionLabelFloor } from "../src/lib/ai/purchase-decision.ts";

test("fills_wardrobe_gap is downgraded to potentially_useful with one strong match", () => {
  assert.equal(
    applyDecisionLabelFloor("fills_wardrobe_gap", { sameCategoryCount: 1, stronglySimilarCount: 1 }),
    "potentially_useful",
  );
});

test("fills_wardrobe_gap is downgraded to likely_redundant with several strong matches", () => {
  assert.equal(
    applyDecisionLabelFloor("fills_wardrobe_gap", { sameCategoryCount: 3, stronglySimilarCount: 2 }),
    "likely_redundant",
  );
});

test("likely_redundant is corrected to fills_wardrobe_gap when the category is empty", () => {
  assert.equal(
    applyDecisionLabelFloor("likely_redundant", { sameCategoryCount: 0, stronglySimilarCount: 0 }),
    "fills_wardrobe_gap",
  );
});

test("likely_redundant stands when the wardrobe does own the category", () => {
  assert.equal(
    applyDecisionLabelFloor("likely_redundant", { sameCategoryCount: 2, stronglySimilarCount: 1 }),
    "likely_redundant",
  );
});

test("labels are left alone when no rule applies", () => {
  assert.equal(
    applyDecisionLabelFloor("potentially_useful", { sameCategoryCount: 2, stronglySimilarCount: 1 }),
    "potentially_useful",
  );
  assert.equal(
    applyDecisionLabelFloor("insufficient_information", { sameCategoryCount: 0, stronglySimilarCount: 0 }),
    "insufficient_information",
  );
  assert.equal(
    applyDecisionLabelFloor("fills_wardrobe_gap", { sameCategoryCount: 0, stronglySimilarCount: 0 }),
    "fills_wardrobe_gap",
  );
});

test("same category and colour counts as a strong match despite floating-point rounding", async () => {
  const { purchaseSimilarity, STRONG_MATCH_THRESHOLD } = await import("../src/lib/ai/purchase-decision.ts");
  const attrs = { category: "top", primary_colour: "Navy" };
  const exact = purchaseSimilarity(attrs, { category: "top", primary_colour: "navy", secondary_colours: [] });
  const secondary = purchaseSimilarity(attrs, { category: "top", primary_colour: "white", secondary_colours: ["navy"] });
  const categoryOnly = purchaseSimilarity(attrs, { category: "top", primary_colour: "red", secondary_colours: [] });
  assert.ok(exact >= STRONG_MATCH_THRESHOLD);
  assert.ok(secondary < STRONG_MATCH_THRESHOLD);
  assert.ok(categoryOnly < STRONG_MATCH_THRESHOLD);
});
