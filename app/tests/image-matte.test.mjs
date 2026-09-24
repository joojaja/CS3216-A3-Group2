import { test } from "node:test";
import assert from "node:assert/strict";
import { fitWithin, hardenAlpha } from "../src/lib/image/matte.ts";
import { CUTOUT_MAX_BYTES, inUserFolder, isValidCutout } from "../src/lib/image/cutout.ts";

test("only non-empty PNGs within the size limit are accepted as cut-outs", () => {
  assert.equal(isValidCutout({ type: "image/png", size: 1000 }), true);
  assert.equal(isValidCutout({ type: "image/jpeg", size: 1000 }), false);
  assert.equal(isValidCutout({ type: "image/png", size: 0 }), false);
  assert.equal(isValidCutout({ type: "image/png", size: CUTOUT_MAX_BYTES + 1 }), false);
});

test("stored paths are only trusted inside the caller's own folder", () => {
  assert.equal(inUserFolder("u1/abc-cutout.png", "u1"), true);
  assert.equal(inUserFolder("u2/abc-cutout.png", "u1"), false);
  assert.equal(inUserFolder("u1/../u2/x.png", "u1"), false);
  assert.equal(inUserFolder(null, "u1"), false);
});

test("alpha below the low threshold is cleared and above the high one is solid", () => {
  assert.equal(hardenAlpha(0, 90, 190), 0);
  assert.equal(hardenAlpha(90, 90, 190), 0);
  assert.equal(hardenAlpha(190, 90, 190), 255);
  assert.equal(hardenAlpha(255, 90, 190), 255);
});

test("alpha between the thresholds ramps smoothly and in order", () => {
  const mid = hardenAlpha(140, 90, 190);
  assert.equal(mid, 128);
  assert.ok(hardenAlpha(100, 90, 190) < mid);
  assert.ok(hardenAlpha(180, 90, 190) > mid);
});

test("fitWithin shrinks the longer side to the limit and keeps the ratio", () => {
  assert.deepEqual(fitWithin(1600, 800, 800), { width: 800, height: 400 });
  assert.deepEqual(fitWithin(600, 1200, 800), { width: 400, height: 800 });
});

test("fitWithin never enlarges and never returns zero", () => {
  assert.deepEqual(fitWithin(300, 200, 800), { width: 300, height: 200 });
  assert.deepEqual(fitWithin(4000, 1, 800), { width: 800, height: 1 });
});
