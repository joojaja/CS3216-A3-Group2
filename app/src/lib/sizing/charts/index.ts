import type { SizeChart, SizingCategory, SizeRange } from "../types.ts";
import { HM_CHARTS } from "./hm.ts";
import { COTTONON_CHARTS } from "./cotton-on.ts";
import { LOVEBONITO_CHARTS } from "./love-bonito.ts";
import { NIKE_CHARTS } from "./nike.ts";

// Uniqlo and Zara are not stored yet. See docs/size-chart-sources.md.
export const STORED_CHARTS: SizeChart[] = [
  ...HM_CHARTS,
  ...COTTONON_CHARTS,
  ...LOVEBONITO_CHARTS,
  ...NIKE_CHARTS,
];

const ALIASES: Record<string, string> = {
  handm: "hm",
  hnm: "hm",
  hennesandmauritz: "hm",
  cottonon: "cottonon",
  lovebonito: "lovebonito",
  nikesg: "nike",
  uniqlosg: "uniqlo",
  zarasg: "zara",
};

// Lowercase, turn "&" into "and", strip everything that is not a letter or
// digit, then apply aliases.
export function normaliseBrand(name: string): string {
  const key = name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]/g, "");
  return ALIASES[key] ?? key;
}

export const STORED_BRANDS: string[] = [...new Set(STORED_CHARTS.map((c) => c.brand))].sort(
  (a, b) => a.localeCompare(b),
);

// Options for the brand picker. An empty query, or one that already names a
// stored brand, lists every brand, so reopening the picker after a choice
// still offers the others. Otherwise it filters on the normalised name.
export function brandSuggestions(query: string, brands: string[] = STORED_BRANDS): string[] {
  const q = normaliseBrand(query);
  if (!q || brands.some((b) => normaliseBrand(b) === q)) return brands;
  return brands.filter((b) => normaliseBrand(b).includes(q));
}

// Exact match on brandKey and category; prefers the requested size range,
// then unisex. Returns null when nothing matches.
// With a null sizeRange it returns a unisex chart if one exists, else the
// womens chart when the brand has no mens chart, else null so the UI can ask.
export function findChart(
  brand: string,
  category: SizingCategory,
  sizeRange: SizeRange | null,
): SizeChart | null {
  const brandKey = normaliseBrand(brand);
  const matches = STORED_CHARTS.filter((c) => c.brandKey === brandKey && c.category === category);
  const byRange = (range: SizeChart["sizeRange"]) => matches.find((c) => c.sizeRange === range) ?? null;

  if (sizeRange) return byRange(sizeRange) ?? byRange("unisex");

  const unisex = byRange("unisex");
  if (unisex) return unisex;
  if (!byRange("mens")) return byRange("womens");
  return null;
}
