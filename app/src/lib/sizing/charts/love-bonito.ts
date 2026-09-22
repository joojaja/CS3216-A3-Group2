// Transcribed from the official size guide on 21 September 2026. A person must check every number against source.url before release.
import type { SizeChart } from "../types.ts";

// The Singapore size guide (lovebonito.com/sg/global/general-size-charts)
// loads its tables in the browser, so the numbers come from the "General
// sizes" CM table image on the international page listed in source.url.
// That page is marked "old" in its URL. Love, Bonito publishes one general
// table for all clothing, so tops, bottoms and dresses share it. The site
// says sizing may run small and each product page has its own measurements.

const URL = "https://www.lovebonito.com/intl/global/general-size-charts-old";
const RETRIEVED = "2026-09-21";

// Published body measurements in cm: [label, bust, waist, hips].
const GENERAL: [string, [number, number], [number, number], [number, number]][] = [
  ["XXS", [71, 76], [53, 58], [79, 84]],
  ["XS", [76, 81], [58, 63], [84, 89]],
  ["S", [81, 86], [63, 68], [89, 94]],
  ["M", [86, 91], [68, 73], [94, 99]],
  ["L", [91, 96], [73, 79], [99, 104]],
  ["XL", [96, 101], [79, 84], [104, 109]],
  ["XXL", [101, 106], [84, 89], [109, 114]],
];

const base = {
  brand: "Love, Bonito",
  brandKey: "lovebonito",
  sizeRange: "womens",
  scope: "brand",
  basis: "body",
  unit: "cm",
  source: { type: "stored", url: URL, retrievedAt: RETRIEVED },
} as const;

export const LOVEBONITO_CHARTS: SizeChart[] = [
  {
    ...base,
    key: "lovebonito/womens/top",
    category: "top",
    rows: GENERAL.map(([label, chest, waist, hips]) => ({ label, ranges: { chest, waist, hips } })),
  },
  {
    ...base,
    key: "lovebonito/womens/bottom",
    category: "bottom",
    rows: GENERAL.map(([label, , waist, hips]) => ({ label, ranges: { waist, hips } })),
  },
  {
    ...base,
    key: "lovebonito/womens/dress",
    category: "dress",
    rows: GENERAL.map(([label, chest, waist, hips]) => ({ label, ranges: { chest, waist, hips } })),
  },
];
