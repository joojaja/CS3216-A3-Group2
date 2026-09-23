// Builds the daily outfits from the user's own confirmed items with plain
// rules: hard filters, then every valid combination scored, then a diverse
// pick. No model is involved, so an outfit is always complete and always
// made of items the user owns. See docs/architecture.md, "Daily outfits."

export type RuleItem = {
  id: string;
  category: string;
  subcategory: string | null;
  primary_colour: string | null;
  pattern: string | null;
  formality: string | null;
  layering_role: string | null;
  weather_tags: string[];
};

export type DayWeather = {
  available: boolean;
  hot: boolean;
  rainy: boolean;
  // "25 to 34°C", or null when unknown
  temperature: string | null;
  // "thundery showers", lower case, or null when unknown
  condition: string | null;
};

export type DailyInput = {
  items: RuleItem[];
  weather: DayWeather;
  preferredColours: string[];
  dislikedColours: string[];
  // Per-item scores from buildFeedbackContext
  itemScores: Record<string, number>;
  // Item ids shown in the daily feed over the last 3 days, one entry per showing
  recentItemIds: string[];
  // coreSignature() of every outfit shown over the last 7 days
  recentSignatures: string[];
  // The Singapore date, so ties break the same way all day and differently tomorrow
  seed: string;
  count?: number;
};

export type DailyOutfit = { itemIds: string[]; explanation: string; warnings: string[] };

export type DailyResult = {
  outfits: DailyOutfit[];
  // Roles the wardrobe lacks before any outfit can be built
  missing: ("top" | "bottom")[];
  hasFootwear: boolean;
};

const FORMALITY_RANK: Record<string, number> = {
  casual: 0,
  smart_casual: 1,
  business: 2,
  formal: 3,
};

// Also used by the My Style rule archetypes
export const PLAIN_PATTERNS = new Set(["", "solid", "plain", "none", "no pattern"]);

// Singapore fallback when NEA is unreachable: hot, humid, possibly wet
export const FALLBACK_WEATHER: DayWeather = {
  available: false,
  hot: true,
  rainy: false,
  temperature: null,
  condition: null,
};

export function readForecast(
  forecast: { temperature: string | null; condition: string | null } | null,
): DayWeather {
  if (!forecast) return FALLBACK_WEATHER;
  const [low, high] = (forecast.temperature ?? "").split("-").map(Number);
  const condition = forecast.condition?.toLowerCase() ?? null;
  return {
    available: true,
    // Unknown temperatures count as hot, which is the safe guess here
    hot: Number.isFinite(high) ? high >= 30 : true,
    rainy: /rain|shower|thunder|storm/.test(condition ?? ""),
    temperature:
      Number.isFinite(low) && Number.isFinite(high) ? `${low} to ${high}°C` : null,
    condition,
  };
}

// Identifies an outfit by its main pieces. Accessories and layers are left
// out, so swapping a bag does not make a repeated outfit count as new
export function coreSignature(items: { id: string; category: string }[]): string {
  return items
    .filter((item) => ["top", "bottom", "dress", "footwear"].includes(item.category))
    .map((item) => item.id)
    .sort()
    .join("+");
}

export function itemName(item: Pick<RuleItem, "primary_colour" | "subcategory" | "category">) {
  return [item.primary_colour, item.subcategory ?? item.category].filter(Boolean).join(" ");
}

function formalityGap(a: RuleItem, b: RuleItem): number {
  const ra = a.formality ? FORMALITY_RANK[a.formality] : undefined;
  const rb = b.formality ? FORMALITY_RANK[b.formality] : undefined;
  if (ra === undefined || rb === undefined) return 0;
  return Math.abs(ra - rb);
}

function isPatterned(item: RuleItem) {
  return !PLAIN_PATTERNS.has((item.pattern ?? "").trim().toLowerCase());
}

function colourMatches(colour: string | null, list: string[]) {
  if (!colour || list.length === 0) return false;
  const words = colour.toLowerCase().split(/[\s/-]+/);
  const whole = colour.toLowerCase().trim();
  return list.some((entry) => {
    const term = entry.toLowerCase().trim();
    return term.length > 0 && (whole === term || words.includes(term));
  });
}

// A small stable number in [0, 1) from a string, used to break ties
function jitter(text: string) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 1000) / 1000;
}

function capitalise(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function buildDailyOutfits(input: DailyInput): DailyResult {
  const count = input.count ?? 3;
  const { weather } = input;

  const usable = input.items.filter(
    (item) =>
      !["sleepwear", "activewear"].includes(item.category) &&
      !colourMatches(item.primary_colour, input.dislikedColours),
  );
  const byCategory = (category: string) => usable.filter((item) => item.category === category);
  const tops = byCategory("top");
  const bottoms = byCategory("bottom");
  const dresses = byCategory("dress");
  const shoes = byCategory("footwear");
  const extras = usable.filter((item) => item.category === "accessory" || item.category === "bag");
  const outers = byCategory("outerwear");
  const hasFootwear = shoes.length > 0;

  const missing: ("top" | "bottom")[] = [];
  if (dresses.length === 0) {
    if (tops.length === 0) missing.push("top");
    if (bottoms.length === 0) missing.push("bottom");
  }
  if (missing.length > 0) return { outfits: [], missing, hasFootwear };

  const recentCounts = new Map<string, number>();
  for (const id of input.recentItemIds) recentCounts.set(id, (recentCounts.get(id) ?? 0) + 1);
  const recentSignatures = new Set(input.recentSignatures);

  function itemScore(item: RuleItem) {
    const tags = item.weather_tags;
    let score = 0;
    if (weather.hot) {
      if (tags.includes("hot_humid")) score += 1;
      else if (
        tags.length > 0 &&
        !tags.includes("all_weather") &&
        tags.every((tag) => tag === "cool_evening" || tag === "air_conditioned")
      ) {
        score -= 1;
      }
    }
    if (weather.rainy && item.category === "footwear" && tags.includes("rain")) score += 1.5;
    if (tags.includes("all_weather")) score += 0.25;
    if (colourMatches(item.primary_colour, input.preferredColours)) score += 0.75;
    score += Math.max(-3, Math.min(3, (input.itemScores[item.id] ?? 0) * 0.5));
    score -= Math.min(2.25, (recentCounts.get(item.id) ?? 0) * 0.75);
    return score;
  }

  const scores = new Map(usable.map((item) => [item.id, itemScore(item)]));
  const scoreOf = (item: RuleItem) => scores.get(item.id) ?? 0;

  // Every valid body: a one-piece, or a top and bottom close in formality
  // with at most one patterned piece
  const bodies: RuleItem[][] = dresses.map((dress) => [dress]);
  for (const top of tops) {
    for (const bottom of bottoms) {
      if (formalityGap(top, bottom) > 1) continue;
      if (isPatterned(top) && isPatterned(bottom)) continue;
      bodies.push([top, bottom]);
    }
  }

  type Candidate = { pieces: RuleItem[]; body: string; signature: string; score: number };
  const candidates: Candidate[] = [];
  for (const body of bodies) {
    const bodyScore = body.reduce((sum, item) => sum + scoreOf(item), 0);
    const matched = body.length === 2 && formalityGap(body[0], body[1]) === 0 ? 0.5 : 0;
    for (const shoe of hasFootwear ? shoes : [null]) {
      const pieces = shoe ? [...body, shoe] : body;
      const signature = coreSignature(pieces);
      let score = bodyScore + matched;
      if (shoe) {
        score += scoreOf(shoe);
        if (body.some((item) => formalityGap(item, shoe) >= 2)) score -= 1;
      }
      if (recentSignatures.has(signature)) score -= 4;
      score += jitter(`${input.seed}|${signature}`) * 0.6;
      candidates.push({
        pieces,
        body: body.map((item) => item.id).sort().join("+"),
        signature,
        score,
      });
    }
  }

  // Greedy pick: each next outfit needs a different body, and loses points
  // for every piece it shares with the outfits already picked
  const picked: Candidate[] = [];
  const usedIds = new Map<string, number>();
  const usedBodies = new Set<string>();
  while (picked.length < count) {
    let best: Candidate | null = null;
    let bestValue = -Infinity;
    for (const candidate of candidates) {
      if (usedBodies.has(candidate.body)) continue;
      const overlap = candidate.pieces.reduce((sum, item) => sum + (usedIds.get(item.id) ?? 0), 0);
      const value = candidate.score - 1.5 * overlap;
      if (value > bestValue) {
        best = candidate;
        bestValue = value;
      }
    }
    if (!best) break;
    picked.push(best);
    usedBodies.add(best.body);
    for (const item of best.pieces) usedIds.set(item.id, (usedIds.get(item.id) ?? 0) + 1);
  }

  // Layers and extras come last, rotated so the three outfits differ
  const rainLayer = weather.rainy
    ? outers.filter((item) => item.weather_tags.includes("rain")).sort((a, b) => scoreOf(b) - scoreOf(a))[0]
    : undefined;
  const bags = extras.filter((item) => item.category === "bag").sort((a, b) => scoreOf(b) - scoreOf(a));
  const accessories = extras
    .filter((item) => item.category === "accessory")
    .sort((a, b) => scoreOf(b) - scoreOf(a));

  const outfits = picked.map((candidate, index) => {
    const pieces = [...candidate.pieces];
    if (rainLayer && pieces.some((item) => item.category === "top")) pieces.push(rainLayer);
    if (accessories.length) pieces.push(accessories[index % accessories.length]);
    if (bags.length) pieces.push(bags[index % bags.length]);
    return {
      itemIds: pieces.map((item) => item.id),
      explanation: explain(pieces, weather, input),
      warnings: warn(pieces, weather, hasFootwear),
    };
  });

  return { outfits, missing, hasFootwear };
}

function explain(pieces: RuleItem[], weather: DayWeather, input: DailyInput): string {
  const sentences: string[] = [];

  if (weather.available && (weather.temperature || weather.condition)) {
    const parts = [weather.temperature, weather.condition].filter(Boolean).join(" with ");
    sentences.push(`Today looks like ${parts}.`);
  } else {
    sentences.push("Planned for typical hot and humid Singapore weather.");
  }

  const reasons: string[] = [];
  const cool = pieces.find(
    (item) => weather.hot && item.category !== "footwear" && item.weather_tags.includes("hot_humid"),
  );
  if (cool) reasons.push(`the ${itemName(cool)} suits hot, humid days`);
  const wetShoe = pieces.find(
    (item) => weather.rainy && item.category === "footwear" && item.weather_tags.includes("rain"),
  );
  if (wetShoe) reasons.push(`the ${itemName(wetShoe)} can handle rain`);
  const layer = pieces.find((item) => item.category === "outerwear");
  if (layer) reasons.push(`the ${itemName(layer)} covers the showers`);
  if (reasons.length) sentences.push(`${capitalise(reasons.join(" and "))}.`);

  const liked = pieces.find((item) => (input.itemScores[item.id] ?? 0) > 0);
  const preferred = pieces.find((item) => colourMatches(item.primary_colour, input.preferredColours));
  const [top, bottom] = [
    pieces.find((item) => item.category === "top"),
    pieces.find((item) => item.category === "bottom"),
  ];
  const dress = pieces.find((item) => item.category === "dress");
  if (liked) {
    sentences.push(`Your past saves and feedback favour the ${itemName(liked)}.`);
  } else if (preferred?.primary_colour) {
    sentences.push(`${capitalise(preferred.primary_colour)} is one of your preferred colours.`);
  } else if (top && bottom && top.formality && top.formality === bottom.formality) {
    sentences.push(`Both main pieces are ${top.formality.replace("_", " ")}, so they sit well together.`);
  } else if (dress) {
    sentences.push(`The ${itemName(dress)} works as the whole outfit, so there is less to match.`);
  }

  return sentences.join(" ");
}

// Written into cards before the feed showed a separate tip for a wardrobe
// with no shoes. Stored batches may still carry it, so the feed filters it out
export const LEGACY_NO_SHOES_WARNING =
  "There are no shoes in your wardrobe yet, so this outfit has an empty shoe slot.";

// Card warnings. A wardrobe with no shoes gets one tip in the feed instead of
// a warning on every card
function warn(pieces: RuleItem[], weather: DayWeather, hasFootwear: boolean): string[] {
  const warnings: string[] = [];
  const shoe = pieces.find((item) => item.category === "footwear");
  if (hasFootwear && weather.rainy && shoe && !shoe.weather_tags.includes("rain")) {
    warnings.push("Showers are forecast and these shoes are not tagged for rain.");
  }
  return warnings;
}
