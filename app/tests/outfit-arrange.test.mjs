import test from "node:test";
import assert from "node:assert/strict";
import { arrangeOutfit, MAX_EXTRAS } from "../src/lib/outfits/arrange.ts";

const item = (id, category) => ({ id, category });

test("top, bottom and shoes go to their own slots", () => {
  const result = arrangeOutfit([item("s", "footwear"), item("t", "top"), item("b", "bottom")]);
  assert.equal(result.top?.id, "t");
  assert.equal(result.bottom?.id, "b");
  assert.equal(result.footwear?.id, "s");
  assert.deepEqual(result.extras, []);
  assert.deepEqual(result.overflow, []);
});

test("a dress takes the whole left column and pushes a stray top out", () => {
  const result = arrangeOutfit([item("t", "top"), item("d", "dress"), item("s", "footwear")]);
  assert.equal(result.onepiece?.id, "d");
  assert.equal(result.top, null);
  assert.equal(result.bottom, null);
  assert.deepEqual(result.overflow.map((i) => i.id), ["t"]);
});

test("accessories and a bag stack in the right column up to the limit", () => {
  const result = arrangeOutfit([
    item("a1", "accessory"),
    item("bag", "bag"),
    item("a2", "accessory"),
    item("a3", "accessory"),
  ]);
  assert.equal(result.extras.length, MAX_EXTRAS);
  assert.deepEqual(result.extras.map((i) => i.id), ["a1", "bag", "a2"]);
  assert.deepEqual(result.overflow.map((i) => i.id), ["a3"]);
});

test("outerwear gets its own slot and a second top overflows", () => {
  const result = arrangeOutfit([item("t1", "top"), item("o", "outerwear"), item("t2", "top")]);
  assert.equal(result.outer?.id, "o");
  assert.equal(result.top?.id, "t1");
  assert.deepEqual(result.overflow.map((i) => i.id), ["t2"]);
});

test("categories with no slot are kept aside, not dropped", () => {
  const result = arrangeOutfit([item("z", "sleepwear")]);
  assert.deepEqual(result.overflow.map((i) => i.id), ["z"]);
});

