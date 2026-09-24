import test from "node:test";
import assert from "node:assert/strict";
import {
  EXPLORE_CATALOGUE,
  catalogueForGender,
  retrieveExploreCandidates,
} from "../src/lib/explore/catalogue.ts";

const fiveTops = Array.from({ length: 5 }, () => ({
  category: "top",
  primary_colour: "white",
  weather_tags: ["hot_humid"],
}));

test("Explore retrieval returns a controlled subset with real retailer URLs", () => {
  const candidates = retrieveExploreCandidates(fiveTops, null, 16);
  assert.equal(candidates.length, 16);
  assert.ok(candidates.every(({ product }) => EXPLORE_CATALOGUE.includes(product)));
  const allowedHosts = new Set([
    "www.muji.com",
    "www.uniqlo.com",
    "www.decathlon.sg",
  ]);
  assert.ok(
    candidates.every(({ product }) =>
      allowedHosts.has(new URL(product.productUrl).hostname),
    ),
  );
  assert.equal(
    new Set(candidates.map(({ product }) => product.retailer)).size,
    3,
  );
});

test("Explore catalogue has 100 unique products from three Singapore retailers", () => {
  assert.equal(EXPLORE_CATALOGUE.length, 100);
  assert.equal(new Set(EXPLORE_CATALOGUE.map((product) => product.id)).size, 100);
  assert.equal(
    new Set(EXPLORE_CATALOGUE.map((product) => product.productUrl)).size,
    100,
  );
  assert.deepEqual(
    new Set(EXPLORE_CATALOGUE.map((product) => product.retailer)),
    new Set(["MUJI Singapore", "UNIQLO Singapore", "Decathlon Singapore"]),
  );
  assert.ok(
    EXPLORE_CATALOGUE.every(
      (product) =>
        product.productUrl.startsWith("https://") &&
        product.imageUrl.startsWith("https://"),
    ),
  );
});

test("Explore retrieval favours wardrobe gaps over another repeated category", () => {
  const [first] = retrieveExploreCandidates(fiveTops, null, 16);
  assert.notEqual(first.product.category, "top");
});

test("Explore retrieval strongly penalises a disliked colour", () => {
  const candidates = retrieveExploreCandidates(fiveTops, { disliked_colours: ["black"] }, 10);
  assert.ok(candidates.every(({ product }) => product.colour !== "black"));
});

test("Explore retrieval only returns men's sizing lines for a male profile", () => {
  const candidates = retrieveExploreCandidates(fiveTops, { gender: "male" }, 16);
  assert.equal(candidates.length, 16);
  assert.ok(candidates.every(({ product }) => product.fitLine === "men"));
});

test("Explore retrieval only returns women's sizing lines for a female profile", () => {
  const candidates = retrieveExploreCandidates(fiveTops, { gender: "female" }, 16);
  assert.equal(candidates.length, 16);
  assert.ok(candidates.every(({ product }) => product.fitLine === "women"));
});

test("Others and unspecified profiles can retrieve both sizing lines", () => {
  for (const gender of ["others", null]) {
    const eligible = catalogueForGender(gender);
    assert.deepEqual(
      new Set(eligible.map((product) => product.fitLine)),
      new Set(["men", "women"]),
    );
  }
});
