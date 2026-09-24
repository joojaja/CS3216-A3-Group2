// Transcribed from the official size guide on 24 September 2026. A person must check every number against source.url before release.
import type { SizeChart } from "../types.ts";

// gap.com loads its charts by script, so these come from the Gap UK size
// guide. Clothing tables give ranges as published; the jeans tables give one
// value per size, converted to ranges at midpoints. The women's 2XS row is
// left out because the page rendered it differently on every read. Jeans
// inseam depends on the leg length (Short, Regular, Long), not the size, so
// it is left out. Men's clothing lists chest only (neck and sleeve are not
// used), and XXXL is a single value.

const URL = "https://www.gap.co.uk/size-guide";
const RETRIEVED = "2026-09-24";

export const GAP_CHARTS: SizeChart[] = [
  // "Women's Clothing" table.
  {
    key: "gap/womens/top",
    brand: "Gap",
    brandKey: "gap",
    category: "top",
    sizeRange: "womens",
    scope: "brand",
    basis: "body",
    unit: "cm",
    rows: [
      { label: "XS / UK 4-6", ranges: { chest: [81, 84], waist: [65, 67], hips: [89, 91] } },
      { label: "S / UK 8-10", ranges: { chest: [86, 89], waist: [70, 72], hips: [94, 96.5] } },
      { label: "M / UK 12-14", ranges: { chest: [91, 94], waist: [75, 77.5], hips: [99, 102] } },
      { label: "L / UK 16-18", ranges: { chest: [96.5, 102], waist: [81, 85], hips: [105, 109] } },
      { label: "XL / UK 20-22", ranges: { chest: [107, 109], waist: [90, 95], hips: [114, 119] } },
      { label: "2XL / UK 24", ranges: { chest: [114, 119], waist: [100, 105], hips: [124, 129.5] } },
    ],
    source: { type: "stored", url: URL, retrievedAt: RETRIEVED },
  },
  // "Women's Jeans" table.
  {
    key: "gap/womens/bottom",
    brand: "Gap",
    brandKey: "gap",
    category: "bottom",
    sizeRange: "womens",
    scope: "brand",
    basis: "body",
    unit: "cm",
    rows: [
      { label: "24 / UK 4", ranges: { waist: [60.5, 63.5], hips: [85.8, 88.2] } }, // waist 62, hips 87
      { label: "25 / UK 6", ranges: { waist: [63.5, 66], hips: [88.2, 90.8] } }, // waist 65, hips 89.5
      { label: "26 / UK 8", ranges: { waist: [66, 68], hips: [90.8, 93.2] } }, // waist 67, hips 92
      { label: "27 / UK 8-10", ranges: { waist: [68, 70.5], hips: [93.2, 95.8] } }, // waist 69, hips 94.5
      { label: "28 / UK 10", ranges: { waist: [70.5, 73.5], hips: [95.8, 98.5] } }, // waist 72, hips 97
      { label: "29 / UK 12", ranges: { waist: [73.5, 76], hips: [98.5, 101] } }, // waist 75, hips 100
      { label: "30 / UK 12-14", ranges: { waist: [76, 79], hips: [101, 104] } }, // waist 77, hips 102
      { label: "31 / UK 14", ranges: { waist: [79, 83], hips: [104, 108] } }, // waist 81, hips 106
      { label: "32 / UK 16", ranges: { waist: [83, 87.5], hips: [108, 112.5] } }, // waist 85, hips 110
      { label: "33 / UK 18", ranges: { waist: [87.5, 92.5], hips: [112.5, 117.5] } }, // waist 90, hips 115
      { label: "34 / UK 20", ranges: { waist: [92.5, 97.5], hips: [117.5, 122.5] } }, // waist 95, hips 120
    ],
    source: { type: "stored", url: URL, retrievedAt: RETRIEVED },
  },
  // "Men's Clothing" table.
  {
    key: "gap/mens/top",
    brand: "Gap",
    brandKey: "gap",
    category: "top",
    sizeRange: "mens",
    scope: "brand",
    basis: "body",
    unit: "cm",
    rows: [
      { label: "XS", ranges: { chest: [89, 91] } },
      { label: "S", ranges: { chest: [94, 97] } },
      { label: "M", ranges: { chest: [99, 104] } },
      { label: "L", ranges: { chest: [107, 112] } },
      { label: "XL", ranges: { chest: [114, 122] } },
      { label: "XXL", ranges: { chest: [124, 132] } },
      { label: "XXXL", ranges: { chest: [140, 140] } },
    ],
    source: { type: "stored", url: URL, retrievedAt: RETRIEVED },
  },
  // "Men's Jeans" table, waist only.
  {
    key: "gap/mens/bottom",
    brand: "Gap",
    brandKey: "gap",
    category: "bottom",
    sizeRange: "mens",
    scope: "brand",
    basis: "body",
    unit: "cm",
    rows: [
      { label: "28", ranges: { waist: [68.5, 73.5] } }, // waist 71
      { label: "30", ranges: { waist: [73.5, 77.5] } }, // waist 76
      { label: "31", ranges: { waist: [77.5, 80.5] } }, // waist 79
      { label: "32", ranges: { waist: [80.5, 83] } }, // waist 82
      { label: "33", ranges: { waist: [83, 85.5] } }, // waist 84
      { label: "34", ranges: { waist: [85.5, 89.5] } }, // waist 87
      { label: "36", ranges: { waist: [89.5, 94.5] } }, // waist 92
      { label: "38", ranges: { waist: [94.5, 99] } }, // waist 97
      { label: "40", ranges: { waist: [99, 104] } }, // waist 101
      { label: "42", ranges: { waist: [104, 110] } }, // waist 107
    ],
    source: { type: "stored", url: URL, retrievedAt: RETRIEVED },
  },
];
