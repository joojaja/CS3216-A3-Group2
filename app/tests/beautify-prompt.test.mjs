import test from "node:test";
import assert from "node:assert/strict";
import { BEAUTIFY_PROMPT } from "../src/lib/ai/beautify-prompt.ts";

test("Beautify selects one foreground garment when clothing overlaps", () => {
  assert.match(BEAUTIFY_PROMPT, /exactly one target garment/i);
  assert.match(BEAUTIFY_PROMPT, /physically lying on top/i);
  assert.match(BEAUTIFY_PROMPT, /closest to the camera/i);
  assert.match(BEAUTIFY_PROMPT, /every garment underneath it as background/i);
});

test("Beautify removes the background and smooths the garment in one operation", () => {
  assert.match(BEAUTIFY_PROMPT, /remove the original background/i);
  assert.match(BEAUTIFY_PROMPT, /plain pure white background/i);
  assert.match(BEAUTIFY_PROMPT, /lay the target garment flat and smooth/i);
  assert.match(BEAUTIFY_PROMPT, /remove wrinkles and folds/i);
});

test("Beautify forbids a second garment in the result", () => {
  assert.match(BEAUTIFY_PROMPT, /finished image must contain exactly one garment/i);
  assert.match(BEAUTIFY_PROMPT, /remove every non-target garment completely/i);
  assert.match(BEAUTIFY_PROMPT, /never return an outfit, a stack, a set/i);
  assert.match(BEAUTIFY_PROMPT, /do not merge details from another garment/i);
});
