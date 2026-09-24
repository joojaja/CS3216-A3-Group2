import test from "node:test";
import assert from "node:assert/strict";
import {
  buildDailyOutfits,
  coreSignature,
  FALLBACK_WEATHER,
  readForecast,
} from "../src/lib/outfits/daily-rules.ts";
import { wearStreak } from "../src/lib/outfits/streak.ts";
import { nextSingaporeMidnight, singaporeDate, singaporeDaysAgo } from "../src/lib/outfits/sg-day.ts";

function item(id, category, extra = {}) {
  return {
    id,
    category,
    subcategory: null,
    primary_colour: null,
    pattern: "solid",
    formality: "casual",
    layering_role: "standalone",
    weather_tags: [],
    ...extra,
  };
}

const hotRain = readForecast({ temperature: "25-34", condition: "Thundery Showers" });
const hotDry = readForecast({ temperature: "26-33", condition: "Fair" });

function run(items, overrides = {}) {
  return buildDailyOutfits({
    items,
    weather: hotDry,
    preferredColours: [],
    dislikedColours: [],
    itemScores: {},
    recentItemIds: [],
    recentSignatures: [],
    seed: "2026-09-22",
    ...overrides,
  });
}

const wardrobe = [
  item("t1", "top"),
  item("t2", "top"),
  item("t3", "top"),
  item("b1", "bottom"),
  item("b2", "bottom"),
  item("s1", "footwear"),
];

test("the forecast is read into simple flags", () => {
  assert.equal(hotRain.hot, true);
  assert.equal(hotRain.rainy, true);
  assert.equal(hotRain.temperature, "25 to 34°C");
  assert.equal(hotDry.rainy, false);
  assert.deepEqual(readForecast(null), FALLBACK_WEATHER);
});

test("every outfit is complete and uses only wardrobe ids", () => {
  const { outfits, missing } = run(wardrobe);
  assert.deepEqual(missing, []);
  assert.equal(outfits.length, 3);
  const ids = new Set(wardrobe.map((i) => i.id));
  for (const outfit of outfits) {
    assert.ok(outfit.itemIds.every((id) => ids.has(id)));
    assert.equal(outfit.itemIds.filter((id) => id.startsWith("t")).length, 1);
    assert.equal(outfit.itemIds.filter((id) => id.startsWith("b")).length, 1);
    assert.ok(outfit.itemIds.includes("s1"));
    assert.ok(outfit.explanation.length > 0);
  }
});

test("no two outfits share the same top and bottom", () => {
  const { outfits } = run(wardrobe);
  const bodies = outfits.map((o) => o.itemIds.filter((id) => id !== "s1").sort().join("+"));
  assert.equal(new Set(bodies).size, bodies.length);
});

test("a small wardrobe gives fewer outfits instead of repeats", () => {
  const { outfits } = run([item("t1", "top"), item("b1", "bottom"), item("s1", "footwear")]);
  assert.equal(outfits.length, 1);
});

test("a dress alone is a complete body", () => {
  const { outfits, missing } = run([item("d1", "dress"), item("s1", "footwear")]);
  assert.deepEqual(missing, []);
  assert.deepEqual(outfits[0].itemIds, ["d1", "s1"]);
});

test("missing roles are reported when no body can be built", () => {
  assert.deepEqual(run([item("t1", "top"), item("t2", "top")]).missing, ["bottom"]);
  assert.deepEqual(run([item("s1", "footwear")]).missing, ["top", "bottom"]);
});

test("no footwear still gives outfits, without a shoe warning on the card", () => {
  const { outfits, hasFootwear } = run([item("t1", "top"), item("b1", "bottom")]);
  assert.equal(hasFootwear, false);
  assert.equal(outfits.length, 1);
  assert.equal(outfits[0].warnings.some((w) => /shoe/i.test(w)), false);
});

test("disliked colours are never used", () => {
  const { outfits } = run(
    [
      item("t1", "top", { primary_colour: "bright orange" }),
      item("t2", "top", { primary_colour: "navy" }),
      item("b1", "bottom"),
      item("s1", "footwear"),
    ],
    { dislikedColours: ["orange"] },
  );
  assert.ok(outfits.every((o) => !o.itemIds.includes("t1")));
});

test("tops and bottoms far apart in formality are not paired", () => {
  const { outfits } = run([
    item("t1", "top", { formality: "formal" }),
    item("b1", "bottom", { formality: "casual" }),
    item("s1", "footwear"),
  ]);
  assert.equal(outfits.length, 0);
});

test("two patterned main pieces are not paired", () => {
  const { outfits } = run([
    item("t1", "top", { pattern: "floral" }),
    item("b1", "bottom", { pattern: "striped" }),
    item("s1", "footwear"),
  ]);
  assert.equal(outfits.length, 0);
});

test("rain-ready shoes win on a rainy day", () => {
  const { outfits } = run(
    [
      item("t1", "top"),
      item("b1", "bottom"),
      item("s1", "footwear"),
      item("s2", "footwear", { weather_tags: ["rain"] }),
    ],
    { weather: hotRain },
  );
  assert.ok(outfits[0].itemIds.includes("s2"));
  assert.match(outfits[0].explanation, /can handle rain/);
});

test("an outfit shown in the last week drops behind fresh ones", () => {
  const items = [item("t1", "top"), item("t2", "top"), item("b1", "bottom"), item("s1", "footwear")];
  const shown = coreSignature([items[0], items[2], items[3]]);
  const { outfits } = run(items, { recentSignatures: [shown], count: 1 });
  assert.ok(outfits[0].itemIds.includes("t2"));
});

test("rejected items lose to others through feedback scores", () => {
  const items = [item("t1", "top"), item("t2", "top"), item("b1", "bottom"), item("s1", "footwear")];
  const { outfits } = run(items, { itemScores: { t1: -6 }, count: 1 });
  assert.ok(outfits[0].itemIds.includes("t2"));
});

test("the same inputs give the same outfits", () => {
  assert.deepEqual(run(wardrobe), run(wardrobe));
});

test("accessories and a bag are added to the right column", () => {
  const { outfits } = run([
    ...wardrobe,
    item("a1", "accessory"),
    item("bag1", "bag"),
  ]);
  assert.ok(outfits[0].itemIds.includes("a1"));
  assert.ok(outfits[0].itemIds.includes("bag1"));
});

test("singapore days roll over at 4 pm UTC", () => {
  assert.equal(singaporeDate(new Date("2026-09-22T15:59:00Z")), "2026-09-22");
  assert.equal(singaporeDate(new Date("2026-09-22T16:00:00Z")), "2026-09-23");
  assert.equal(nextSingaporeMidnight(new Date("2026-09-22T11:28:00Z")), "2026-09-22T16:00:00.000Z");
  assert.equal(singaporeDaysAgo("2026-09-01", 3), "2026-08-29");
});

test("the wear streak counts consecutive singapore days", () => {
  const today = "2026-09-22";
  // 21 Sep 23:30 SGT is 15:30 UTC, and 22 Sep 00:30 SGT is 16:30 UTC on the 21st
  assert.deepEqual(
    wearStreak(["2026-09-21T16:30:00Z", "2026-09-21T01:00:00Z", "2026-09-20T02:00:00Z"], today),
    { days: 3, wornToday: true },
  );
  // Nothing worn yet today: yesterday's streak still stands
  assert.deepEqual(wearStreak(["2026-09-21T01:00:00Z", "2026-09-20T02:00:00Z"], today), {
    days: 2,
    wornToday: false,
  });
  // A gap breaks it
  assert.deepEqual(wearStreak(["2026-09-19T01:00:00Z"], today), { days: 0, wornToday: false });
});
