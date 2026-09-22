import test from "node:test";
import assert from "node:assert/strict";
import { applyDailyPicks, buildDailyPrompt } from "../src/lib/outfits/daily-prompt.ts";
import { readForecast } from "../src/lib/outfits/daily-rules.ts";

const candidates = [1, 2, 3, 4].map((n) => ({
  itemIds: [`t${n}`, `b${n}`],
  explanation: `rules ${n}`,
  warnings: n === 2 ? ["rain warning"] : [],
}));

test("valid picks replace explanations and keep rule warnings", () => {
  const result = applyDailyPicks(candidates, [
    { candidate: 2, explanation: "  Light layers   for showers. " },
    { candidate: 4, explanation: "Cool enough for 34°C." },
    { candidate: 1, explanation: "Easy for a hot day." },
  ]);
  assert.deepEqual(result.map((o) => o.itemIds[0]), ["t2", "t4", "t1"]);
  assert.equal(result[0].explanation, "Light layers for showers.");
  assert.deepEqual(result[0].warnings, ["rain warning"]);
});

test("an out-of-range candidate rejects the whole answer", () => {
  assert.equal(
    applyDailyPicks(candidates, [
      { candidate: 1, explanation: "a" },
      { candidate: 2, explanation: "b" },
      { candidate: 9, explanation: "c" },
    ]),
    null,
  );
});

test("a repeated candidate rejects the whole answer", () => {
  assert.equal(
    applyDailyPicks(candidates, [
      { candidate: 1, explanation: "a" },
      { candidate: 1, explanation: "b" },
      { candidate: 2, explanation: "c" },
    ]),
    null,
  );
});

test("too few picks falls back to the rules", () => {
  assert.equal(applyDailyPicks(candidates, [{ candidate: 1, explanation: "a" }]), null);
});

test("with fewer candidates than picks, all of them are needed", () => {
  const two = candidates.slice(0, 2);
  assert.equal(applyDailyPicks(two, [{ candidate: 2, explanation: "b" }, { candidate: 1, explanation: "a" }]).length, 2);
});

test("the prompt numbers candidates and never includes item ids", () => {
  const items = new Map(
    candidates.flatMap((c) => c.itemIds).map((id) => [
      id,
      {
        id,
        category: id.startsWith("t") ? "top" : "bottom",
        subcategory: id.startsWith("t") ? "linen shirt" : "chinos",
        primary_colour: "navy",
        pattern: "solid",
        formality: "smart_casual",
        layering_role: "standalone",
        weather_tags: ["hot_humid"],
      },
    ]),
  );
  const prompt = buildDailyPrompt({
    candidates,
    items,
    weather: readForecast({ temperature: "25-34", condition: "Thundery Showers" }),
    preferredColours: ["navy"],
    preferredStyles: [],
  });
  assert.match(prompt, /^4\. navy linen shirt/m);
  assert.match(prompt, /25 to 34°C, thundery showers/);
  assert.doesNotMatch(prompt, /\bt1\b/);
});
