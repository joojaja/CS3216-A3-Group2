import test from "node:test";
import assert from "node:assert/strict";
import { buildFeedbackContext } from "../src/lib/outfit-feedback.ts";

const recommendations = [
  { id: "rec-1", wardrobe_item_ids: ["shirt", "trousers"] },
  { id: "rec-2", wardrobe_item_ids: ["shirt", "shoes"] },
];

test("saved outfit feedback creates per-item preference signals", () => {
  const result = buildFeedbackContext(
    [
      {
        recommendation_id: "rec-1",
        action: "wore",
        reason: null,
        free_text: null,
        created_at: "2026-09-22T10:00:00Z",
      },
      {
        recommendation_id: "rec-2",
        action: "rejected",
        reason: "too_warm",
        free_text: null,
        created_at: "2026-09-22T09:00:00Z",
      },
    ],
    recommendations,
  );

  assert.deepEqual(result.itemScores, { shirt: 0, trousers: 3, shoes: -3 });
  assert.match(result.prompt, /too_warm/);
});

test("the newest response replaces older feedback for the same outfit", () => {
  const result = buildFeedbackContext(
    [
      {
        recommendation_id: "rec-1",
        action: "liked",
        reason: null,
        free_text: null,
        created_at: "2026-09-22T11:00:00Z",
      },
      {
        recommendation_id: "rec-1",
        action: "rejected",
        reason: "too_casual",
        free_text: null,
        created_at: "2026-09-22T10:00:00Z",
      },
    ],
    recommendations,
  );

  assert.deepEqual(result.itemScores, { shirt: 2, trousers: 2 });
  assert.doesNotMatch(result.prompt, /too_casual/);
});

test("a skip from the daily feed carries no item weight and hides nothing", () => {
  const result = buildFeedbackContext(
    [
      {
        recommendation_id: "rec-1",
        action: "dismissed",
        reason: null,
        free_text: null,
        created_at: "2026-09-22T12:00:00Z",
      },
      {
        recommendation_id: "rec-1",
        action: "wore",
        reason: null,
        free_text: null,
        created_at: "2026-09-22T10:00:00Z",
      },
    ],
    recommendations,
  );

  assert.deepEqual(result.itemScores, { shirt: 3, trousers: 3 });
  assert.doesNotMatch(result.prompt, /dismissed/);
});

test("saved outfits count like a like", () => {
  const result = buildFeedbackContext([], recommendations, ["rec-2", "rec-2"]);

  assert.deepEqual(result.itemScores, { shirt: 2, shoes: 2 });
  assert.match(result.prompt, /saved outfit/);
});
