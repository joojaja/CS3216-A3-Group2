// Transcribed from the official size guide on 24 September 2026. A person must check every number against source.url before release.
import type { SizeChart } from "../types.ts";

// From the Women's Shoe Size Conversion table on the Charles & Keith
// Singapore size guide, "Length of Foot (CM)" column. One foot length per
// size, converted to ranges at midpoints. The JP/KR column (for example 245)
// is a size label, not foot length, so it is not used. The page prints the
// letter sizes only on the first of each pair of EU sizes.

const URL = "https://www.charleskeith.com/sg/information/shopping-with-us/size-guide.html";
const RETRIEVED = "2026-09-24";

export const CHARLESKEITH_CHARTS: SizeChart[] = [
  {
    key: "charlesandkeith/womens/footwear",
    brand: "Charles & Keith",
    brandKey: "charlesandkeith",
    category: "footwear",
    sizeRange: "womens",
    scope: "brand",
    basis: "body",
    unit: "cm",
    rows: [
      { label: "EU 34 (S)", ranges: { foot_length: [21.4, 22] } }, // foot 21.7
      { label: "EU 35", ranges: { foot_length: [22, 22.6] } }, // foot 22.3
      { label: "EU 36 (M)", ranges: { foot_length: [22.6, 23.4] } }, // foot 23
      { label: "EU 37", ranges: { foot_length: [23.4, 24] } }, // foot 23.7
      { label: "EU 38 (L)", ranges: { foot_length: [24, 24.6] } }, // foot 24.3
      { label: "EU 39", ranges: { foot_length: [24.6, 25.4] } }, // foot 25
      { label: "EU 40 (XL)", ranges: { foot_length: [25.4, 26] } }, // foot 25.7
      { label: "EU 41", ranges: { foot_length: [26, 26.6] } }, // foot 26.3
      { label: "EU 42 (2XL)", ranges: { foot_length: [26.6, 27.2] } }, // foot 26.9
      { label: "EU 43", ranges: { foot_length: [27.2, 27.8] } }, // foot 27.5
    ],
    source: { type: "stored", url: URL, retrievedAt: RETRIEVED },
  },
];
