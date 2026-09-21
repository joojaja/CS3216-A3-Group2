import test from "node:test";
import assert from "node:assert/strict";
import { EXPLORE_CATALOGUE, retrieveExploreCandidates } from "../src/lib/explore/catalogue.ts";

const fiveTops = Array.from({ length: 5 }, () => ({
  category: "top",
  primary_colour: "white",
  weather_tags: ["hot_humid"],
}));

test("Explore retrieval returns a controlled subset with real retailer URLs", () => {
  const candidates = retrieveExploreCandidates(fiveTops, null, 16);
  assert.equal(candidates.length, 16);
  assert.ok(candidates.every(({ product }) => EXPLORE_CATALOGUE.includes(product)));
  assert.ok(candidates.every(({ product }) => product.productUrl.startsWith("https://www.muji.com/sg/")));
});

test("Explore retrieval favours wardrobe gaps over another repeated category", () => {
  const [first] = retrieveExploreCandidates(fiveTops, null, 16);
  assert.notEqual(first.product.category, "top");
});

test("Explore retrieval strongly penalises a disliked colour", () => {
  const candidates = retrieveExploreCandidates(fiveTops, { disliked_colours: ["black"] }, 10);
  assert.ok(candidates.every(({ product }) => product.colour !== "black"));
});
