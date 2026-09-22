// Rule-based style archetypes for My Style. Each item gets a signature from
// four tags we can trust (formality, neutral or colourful, plain or
// patterned, activewear or not), items with the same signature form a
// group, and small groups merge into their nearest neighbour. No model is
// involved. This is what shows while the AI grouping runs, and what ships
// when it fails. See docs/plans/style-and-colour-palette.md section 2.

import { PLAIN_PATTERNS } from "../outfits/daily-rules.ts";
import { colourFamily } from "./colour-families.ts";
import { roundedPercents } from "./shares.ts";

export type StyleItem = {
  id: string;
  category: string;
  subcategory: string | null;
  primary_colour: string | null;
  pattern: string | null;
  formality: string | null;
  material_cues?: string | null;
};

export type Archetype = {
  name: string;
  description: string;
  itemIds: string[];
  percent: number;
};

// Where a grouping came from: the AI pass, or these rules as the fallback
export type ArchetypeSource = "ai" | "rules";

export type StyleGrouping = { archetypes: Archetype[]; source: ArchetypeSource };

export type Signature = {
  formality: "casual" | "smart" | "dressy";
  palette: "neutral" | "colourful";
  pattern: "plain" | "patterned";
  active: boolean;
};

export const MAX_ARCHETYPES = 4;

// Sleepwear says nothing about how someone dresses. Footwear, accessories and
// bags count like clothes
const EXCLUDED_CATEGORIES = new Set(["sleepwear"]);

export function styleItems<T extends Pick<StyleItem, "category">>(items: T[]): T[] {
  return items.filter((item) => !EXCLUDED_CATEGORIES.has(item.category));
}

const ACTIVE_WORDS =
  /\b(legging|leggings|jogger|joggers|track|tracksuit|sports|sport|gym|yoga|running|athletic|training|sweatpants|bike shorts)\b/;

export function signatureOf(item: StyleItem): Signature {
  const formality =
    item.formality === "business" || item.formality === "formal"
      ? "dressy"
      : item.formality === "smart_casual"
        ? "smart"
        : "casual";
  const family = colourFamily(item.primary_colour);
  // An unrecognised colour counts as neutral so it does not invent a
  // colourful group on its own
  const palette = family.neutral || family.key === "other" ? "neutral" : "colourful";
  const pattern = PLAIN_PATTERNS.has((item.pattern ?? "").trim().toLowerCase()) ? "plain" : "patterned";
  const active =
    item.category === "activewear" || ACTIVE_WORDS.test((item.subcategory ?? "").toLowerCase());
  return { formality, palette, pattern, active };
}

function signatureKey(signature: Signature) {
  return `${signature.formality}|${signature.palette}|${signature.pattern}|${signature.active ? "active" : "everyday"}`;
}

// How many of the four fields two signatures share
export function sharedFields(a: Signature, b: Signature) {
  return (
    Number(a.formality === b.formality) +
    Number(a.palette === b.palette) +
    Number(a.pattern === b.pattern) +
    Number(a.active === b.active)
  );
}

// The group whose members share the most signature fields with the item on
// average. Ties go to the larger group, then the earlier one. Used to merge
// small rule groups and to place items the AI grouping left out
export function closestGroup(signature: Signature, groups: Signature[][]): number {
  let best = -1;
  let bestScore = -1;
  groups.forEach((members, index) => {
    if (members.length === 0) return;
    const score = members.reduce((sum, member) => sum + sharedFields(signature, member), 0) / members.length;
    if (score > bestScore || (score === bestScore && members.length > groups[best].length)) {
      best = index;
      bestScore = score;
    }
  });
  return best;
}

type Group = { signature: Signature; key: string; itemIds: string[] };

export function ruleArchetypes(allItems: StyleItem[]): Archetype[] {
  // Sorting by id keeps the result the same however the database orders rows
  const items = styleItems(allItems).sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  if (items.length === 0) return [];

  const byKey = new Map<string, Group>();
  for (const item of items) {
    const signature = signatureOf(item);
    const key = signatureKey(signature);
    const group = byKey.get(key) ?? { signature, key, itemIds: [] };
    group.itemIds.push(item.id);
    byKey.set(key, group);
  }
  let groups = [...byKey.values()];

  const minimum = Math.max(2, Math.ceil(items.length * 0.1));
  const mergeSmallest = () => {
    const smallest = [...groups].sort(
      (a, b) => a.itemIds.length - b.itemIds.length || (a.key < b.key ? 1 : -1),
    )[0];
    const others = groups.filter((group) => group !== smallest);
    const target =
      others[
        closestGroup(
          smallest.signature,
          others.map((group) => group.itemIds.map(() => group.signature)),
        )
      ];
    target.itemIds.push(...smallest.itemIds);
    groups = others;
  };

  while (groups.length > 1 && Math.min(...groups.map((group) => group.itemIds.length)) < minimum) {
    mergeSmallest();
  }
  while (groups.length > MAX_ARCHETYPES) mergeSmallest();

  groups.sort((a, b) => b.itemIds.length - a.itemIds.length || (a.key < b.key ? -1 : 1));
  const names = uniqueNames(groups.map((group) => group.signature));
  const percents = roundedPercents(groups.map((group) => group.itemIds.length));

  return groups.map((group, index) => ({
    name: names[index],
    description: describe(group.signature),
    itemIds: group.itemIds,
    percent: percents[index],
  }));
}

function formalityWord(signature: Signature) {
  return signature.formality === "dressy" ? "formal" : signature.formality === "smart" ? "smart casual" : "casual";
}

function shortName(signature: Signature) {
  const lead =
    signature.pattern === "patterned" ? "Patterned" : signature.palette === "neutral" ? "Neutral" : "Colourful";
  return `${lead} ${signature.active ? "activewear" : formalityWord(signature)}`;
}

function longName(signature: Signature) {
  const lead = signature.palette === "neutral" ? "Neutral" : "Colourful";
  const pattern = signature.pattern === "patterned" ? "patterned " : "";
  return `${lead} ${pattern}${formalityWord(signature)}${signature.active ? " activewear" : ""}`;
}

// Two signatures can share a short name, for example neutral and colourful
// patterned casual. Those get the longer name, which spells out every field
// and so is unique per signature
function uniqueNames(signatures: Signature[]) {
  const short = signatures.map(shortName);
  return signatures.map((signature, index) =>
    short.indexOf(short[index]) !== short.lastIndexOf(short[index]) ? longName(signature) : short[index],
  );
}

function describe(signature: Signature) {
  const colours = signature.palette === "neutral" ? "Neutral colours" : "Colour-led pieces";
  const pattern = signature.pattern === "plain" ? "in plain fabrics" : "with prints and patterns";
  const use = signature.active
    ? "built around activewear"
    : signature.formality === "dressy"
      ? "for business and formal occasions"
      : signature.formality === "smart"
        ? "for smart casual days"
        : "for everyday casual wear";
  return `${colours} ${pattern}, ${use}.`;
}
