// Transcribed from the official size guide on 24 September 2026. A person must check every number against source.url before release.
import type { SizeChart } from "../types.ts";

// From the women's EUR size guide on the Mango Singapore site. The US page
// in inches has the same numbers. One value per size, converted to ranges at
// midpoints. The page's in-between labels (XS-S, S-M and so on) repeat the
// larger size's numbers, so they are left out. The page has one women's
// table and does not say which garments it covers, so it serves tops,
// bottoms and dresses. There is no men's table.

const URL = "https://shop.mango.com/sg/en/size-guide";
const RETRIEVED = "2026-09-24";

export const MANGO_CHARTS: SizeChart[] = [
  {
    key: "mango/womens/top",
    brand: "Mango",
    brandKey: "mango",
    category: "top",
    sizeRange: "womens",
    scope: "brand",
    basis: "body",
    unit: "cm",
    rows: [
      { label: "XXS", ranges: { chest: [76, 80], waist: [57.5, 60.5], hips: [84, 88] } }, // chest 78, waist 59, hips 86
      { label: "XS", ranges: { chest: [80, 84], waist: [60.5, 64], hips: [88, 92] } }, // chest 82, waist 62, hips 90
      { label: "S", ranges: { chest: [84, 89], waist: [64, 69], hips: [92, 97] } }, // chest 86, waist 66, hips 94
      { label: "M", ranges: { chest: [89, 95], waist: [69, 75], hips: [97, 103] } }, // chest 92, waist 72, hips 100
      { label: "L", ranges: { chest: [95, 101], waist: [75, 81.5], hips: [103, 109] } }, // chest 98, waist 78, hips 106
      { label: "XL", ranges: { chest: [101, 107], waist: [81.5, 88.5], hips: [109, 115] } }, // chest 104, waist 85, hips 112
      { label: "XXL", ranges: { chest: [107, 113], waist: [88.5, 95.5], hips: [115, 121] } }, // chest 110, waist 92, hips 118
      { label: "1XL", ranges: { chest: [113, 120], waist: [95.5, 103.5], hips: [121, 128] } }, // chest 116, waist 99, hips 124
      { label: "2XL", ranges: { chest: [120, 128], waist: [103.5, 112.5], hips: [128, 136] } }, // chest 124, waist 108, hips 132
      { label: "3XL", ranges: { chest: [128, 136], waist: [112.5, 121.5], hips: [136, 144] } }, // chest 132, waist 117, hips 140
      { label: "4XL", ranges: { chest: [136, 144], waist: [121.5, 130.5], hips: [144, 152] } }, // chest 140, waist 126, hips 148
    ],
    source: { type: "stored", url: URL, retrievedAt: RETRIEVED },
  },
  {
    key: "mango/womens/bottom",
    brand: "Mango",
    brandKey: "mango",
    category: "bottom",
    sizeRange: "womens",
    scope: "brand",
    basis: "body",
    unit: "cm",
    rows: [
      { label: "XXS", ranges: { waist: [57.5, 60.5], hips: [84, 88] } }, // waist 59, hips 86
      { label: "XS", ranges: { waist: [60.5, 64], hips: [88, 92] } }, // waist 62, hips 90
      { label: "S", ranges: { waist: [64, 69], hips: [92, 97] } }, // waist 66, hips 94
      { label: "M", ranges: { waist: [69, 75], hips: [97, 103] } }, // waist 72, hips 100
      { label: "L", ranges: { waist: [75, 81.5], hips: [103, 109] } }, // waist 78, hips 106
      { label: "XL", ranges: { waist: [81.5, 88.5], hips: [109, 115] } }, // waist 85, hips 112
      { label: "XXL", ranges: { waist: [88.5, 95.5], hips: [115, 121] } }, // waist 92, hips 118
      { label: "1XL", ranges: { waist: [95.5, 103.5], hips: [121, 128] } }, // waist 99, hips 124
      { label: "2XL", ranges: { waist: [103.5, 112.5], hips: [128, 136] } }, // waist 108, hips 132
      { label: "3XL", ranges: { waist: [112.5, 121.5], hips: [136, 144] } }, // waist 117, hips 140
      { label: "4XL", ranges: { waist: [121.5, 130.5], hips: [144, 152] } }, // waist 126, hips 148
    ],
    source: { type: "stored", url: URL, retrievedAt: RETRIEVED },
  },
  {
    key: "mango/womens/dress",
    brand: "Mango",
    brandKey: "mango",
    category: "dress",
    sizeRange: "womens",
    scope: "brand",
    basis: "body",
    unit: "cm",
    rows: [
      { label: "XXS", ranges: { chest: [76, 80], waist: [57.5, 60.5], hips: [84, 88] } }, // chest 78, waist 59, hips 86
      { label: "XS", ranges: { chest: [80, 84], waist: [60.5, 64], hips: [88, 92] } }, // chest 82, waist 62, hips 90
      { label: "S", ranges: { chest: [84, 89], waist: [64, 69], hips: [92, 97] } }, // chest 86, waist 66, hips 94
      { label: "M", ranges: { chest: [89, 95], waist: [69, 75], hips: [97, 103] } }, // chest 92, waist 72, hips 100
      { label: "L", ranges: { chest: [95, 101], waist: [75, 81.5], hips: [103, 109] } }, // chest 98, waist 78, hips 106
      { label: "XL", ranges: { chest: [101, 107], waist: [81.5, 88.5], hips: [109, 115] } }, // chest 104, waist 85, hips 112
      { label: "XXL", ranges: { chest: [107, 113], waist: [88.5, 95.5], hips: [115, 121] } }, // chest 110, waist 92, hips 118
      { label: "1XL", ranges: { chest: [113, 120], waist: [95.5, 103.5], hips: [121, 128] } }, // chest 116, waist 99, hips 124
      { label: "2XL", ranges: { chest: [120, 128], waist: [103.5, 112.5], hips: [128, 136] } }, // chest 124, waist 108, hips 132
      { label: "3XL", ranges: { chest: [128, 136], waist: [112.5, 121.5], hips: [136, 144] } }, // chest 132, waist 117, hips 140
      { label: "4XL", ranges: { chest: [136, 144], waist: [121.5, 130.5], hips: [144, 152] } }, // chest 140, waist 126, hips 148
    ],
    source: { type: "stored", url: URL, retrievedAt: RETRIEVED },
  },
];
