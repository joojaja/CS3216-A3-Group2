import type { SizeChart, SizingCategory, SizeRange } from "../types.ts";
import { HM_CHARTS } from "./hm.ts";
import { COTTONON_CHARTS } from "./cotton-on.ts";
import { LOVEBONITO_CHARTS } from "./love-bonito.ts";
import { NIKE_CHARTS } from "./nike.ts";
import { ADIDAS_CHARTS } from "./adidas.ts";
import { CHARLESKEITH_CHARTS } from "./charles-and-keith.ts";
import { GAP_CHARTS } from "./gap.ts";
import { LEVIS_CHARTS } from "./levis.ts";
import { MANGO_CHARTS } from "./mango.ts";

const CATEGORY_ORDER: SizingCategory[] = ["top", "bottom", "dress", "footwear"];

// Uniqlo, Zara and others with no public general chart are not stored. See
// docs/size-chart-sources.md.
export const STORED_CHARTS: SizeChart[] = [
  ...HM_CHARTS,
  ...COTTONON_CHARTS,
  ...LOVEBONITO_CHARTS,
  ...NIKE_CHARTS,
  ...ADIDAS_CHARTS,
  ...CHARLESKEITH_CHARTS,
  ...GAP_CHARTS,
  ...LEVIS_CHARTS,
  ...MANGO_CHARTS,
];

const ALIASES: Record<string, string> = {
  handm: "hm",
  hnm: "hm",
  hennesandmauritz: "hm",
  cottonon: "cottonon",
  lovebonito: "lovebonito",
  nikesg: "nike",
  adidasoriginals: "adidas",
  charleskeith: "charlesandkeith",
  levi: "levis",
  levistrauss: "levis",
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

export type BrandCoverage = {
  brand: string;
  categories: SizingCategory[];
  ranges: Partial<Record<SizingCategory, SizeRange[]>>;
};

// What a stored brand's charts cover, so the picker can grey out the rest
// before the user asks. A unisex chart counts as both ranges. Null for a
// brand we hold no chart for.
export function brandCoverage(brand: string): BrandCoverage | null {
  const brandKey = normaliseBrand(brand);
  const charts = STORED_CHARTS.filter((c) => c.brandKey === brandKey);
  if (!brandKey || charts.length === 0) return null;
  const ranges: BrandCoverage["ranges"] = {};
  for (const c of charts) {
    const add: SizeRange[] = c.sizeRange === "unisex" ? ["womens", "mens"] : [c.sizeRange];
    ranges[c.category] = [...new Set([...(ranges[c.category] ?? []), ...add])];
  }
  return { brand: charts[0].brand, categories: CATEGORY_ORDER.filter((cat) => ranges[cat]), ranges };
}

// Keeps the manual picks inside what the brand's stored charts cover: a
// brand with one category gets it preselected, a pick the brand has no
// chart for is cleared, and a category with one size range gets that range
export function fitToCoverage(cov: BrandCoverage | null, category: SizingCategory | null, range: SizeRange | null) {
  if (!cov) return { category, range };
  const cat = cov.categories.length === 1 ? cov.categories[0] : category && cov.categories.includes(category) ? category : null;
  const ranges = cat ? cov.ranges[cat] ?? [] : [];
  const fitted = !cat || !range || ranges.includes(range) ? range : ranges.length === 1 ? ranges[0] : null;
  return { category: cat, range: fitted };
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
