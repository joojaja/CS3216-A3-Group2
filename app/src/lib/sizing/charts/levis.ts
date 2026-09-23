// Transcribed from the official size guide on 24 September 2026. A person must check every number against source.url before release.
import type { SizeChart } from "../types.ts";

// From the men's numeric bottoms chart (cm) on the Levi's Singapore site.
// Ranges as published; "Seat" is stored as hips. The page's thigh values
// look wrong and are not used, and inseam is a separate length chart, not
// per waist size. The page does not say clearly whether these are body or
// garment measurements; its how-to-measure text describes the body, so the
// chart is stored as body. The women's page was internally inconsistent and
// is not stored.

const URL = "https://levi.com.sg/pages/men-sizechart-bottoms";
const RETRIEVED = "2026-09-24";

export const LEVIS_CHARTS: SizeChart[] = [
  {
    key: "levis/mens/bottom",
    brand: "Levi's",
    brandKey: "levis",
    category: "bottom",
    sizeRange: "mens",
    scope: "brand",
    basis: "body",
    unit: "cm",
    rows: [
      { label: "28", ranges: { waist: [72.3, 73.6], hips: [86.2, 87.5] } },
      { label: "29", ranges: { waist: [74.9, 76.2], hips: [88.7, 90] } },
      { label: "30", ranges: { waist: [77.4, 78.7], hips: [91.2, 92.5] } },
      { label: "31", ranges: { waist: [80, 81.2], hips: [93.7, 95] } },
      { label: "32", ranges: { waist: [82.5, 83.8], hips: [96.2, 97.5] } },
      { label: "33", ranges: { waist: [85, 86.3], hips: [98.7, 100] } },
      { label: "34", ranges: { waist: [87.6, 88.9], hips: [101, 102.5] } },
      { label: "36", ranges: { waist: [92.7, 95.2], hips: [106, 108.7] } },
      { label: "38", ranges: { waist: [97.7, 100], hips: [111, 113.7] } },
      { label: "40", ranges: { waist: [102, 105], hips: [116, 118.7] } },
      { label: "42", ranges: { waist: [107, 110], hips: [121, 123.7] } },
    ],
    source: { type: "stored", url: URL, retrievedAt: RETRIEVED },
  },
];
