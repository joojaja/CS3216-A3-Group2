// Transcribed from the official size guide on 24 September 2026. A person must check every number against source.url before release.
import type { SizeChart } from "../types.ts";

// adidas.com.sg returned 403, so these come from the en_GB size charts on
// Adidas's support site. Ranges as published, from the standard tables; the
// Tall and Short tables are left out. Inseam is left out: the men's values
// fall after XL, so they do not ascend, and the women's are left out to
// match. No shoe chart could be read.

const BASE = "https://support.dtb.adidas.com/static-content/size-charts/en_GB/apparel";
const RETRIEVED = "2026-09-24";

export const ADIDAS_CHARTS: SizeChart[] = [
  {
    key: "adidas/mens/top",
    brand: "Adidas",
    brandKey: "adidas",
    category: "top",
    sizeRange: "mens",
    scope: "brand",
    basis: "body",
    unit: "cm",
    rows: [
      { label: "XS", ranges: { chest: [83, 86], waist: [71, 74], hips: [82, 85] } },
      { label: "S", ranges: { chest: [87, 92], waist: [75, 80], hips: [86, 91] } },
      { label: "M", ranges: { chest: [93, 100], waist: [81, 88], hips: [92, 99] } },
      { label: "L", ranges: { chest: [101, 108], waist: [89, 96], hips: [100, 107] } },
      { label: "XL", ranges: { chest: [109, 118], waist: [97, 106], hips: [108, 116] } },
      { label: "2XL", ranges: { chest: [119, 130], waist: [107, 119], hips: [117, 125] } },
      { label: "3XL", ranges: { chest: [131, 142], waist: [120, 132], hips: [126, 135] } },
    ],
    source: { type: "stored", url: `${BASE}/size-m_tops.html`, retrievedAt: RETRIEVED },
  },
  {
    key: "adidas/mens/bottom",
    brand: "Adidas",
    brandKey: "adidas",
    category: "bottom",
    sizeRange: "mens",
    scope: "brand",
    basis: "body",
    unit: "cm",
    rows: [
      { label: "XS", ranges: { waist: [71, 74], hips: [82, 85] } },
      { label: "S", ranges: { waist: [75, 80], hips: [86, 91] } },
      { label: "M", ranges: { waist: [81, 88], hips: [92, 99] } },
      { label: "L", ranges: { waist: [89, 96], hips: [100, 107] } },
      { label: "XL", ranges: { waist: [97, 106], hips: [108, 116] } },
      { label: "2XL", ranges: { waist: [107, 119], hips: [117, 125] } },
      { label: "3XL", ranges: { waist: [120, 132], hips: [126, 135] } },
    ],
    source: { type: "stored", url: `${BASE}/size-m_bottoms.html`, retrievedAt: RETRIEVED },
  },
  {
    key: "adidas/womens/top",
    brand: "Adidas",
    brandKey: "adidas",
    category: "top",
    sizeRange: "womens",
    scope: "brand",
    basis: "body",
    unit: "cm",
    rows: [
      { label: "2XS (0-2)", ranges: { chest: [73, 76], waist: [57, 60], hips: [82, 85] } },
      { label: "XS (4-6)", ranges: { chest: [77, 82], waist: [61, 66], hips: [86, 91] } },
      { label: "S (8-10)", ranges: { chest: [83, 88], waist: [67, 72], hips: [92, 97] } },
      { label: "M (12-14)", ranges: { chest: [89, 94], waist: [73, 78], hips: [98, 103] } },
      { label: "L (16-18)", ranges: { chest: [95, 101], waist: [79, 85], hips: [104, 110] } },
      { label: "XL (20-22)", ranges: { chest: [102, 109], waist: [86, 94], hips: [111, 117] } },
      { label: "2XL (24-26)", ranges: { chest: [110, 118], waist: [95, 104], hips: [118, 125] } },
    ],
    source: { type: "stored", url: `${BASE}/size-w_tops.html`, retrievedAt: RETRIEVED },
  },
  {
    key: "adidas/womens/bottom",
    brand: "Adidas",
    brandKey: "adidas",
    category: "bottom",
    sizeRange: "womens",
    scope: "brand",
    basis: "body",
    unit: "cm",
    rows: [
      { label: "2XS (0-2)", ranges: { waist: [57, 60], hips: [82, 85] } },
      { label: "XS (4-6)", ranges: { waist: [61, 66], hips: [86, 91] } },
      { label: "S (8-10)", ranges: { waist: [67, 72], hips: [92, 97] } },
      { label: "M (12-14)", ranges: { waist: [73, 78], hips: [98, 103] } },
      { label: "L (16-18)", ranges: { waist: [79, 85], hips: [104, 110] } },
      { label: "XL (20-22)", ranges: { waist: [86, 94], hips: [111, 117] } },
      { label: "XXL (24-26)", ranges: { waist: [95, 104], hips: [118, 125] } },
    ],
    source: { type: "stored", url: `${BASE}/size-w_bottoms.html`, retrievedAt: RETRIEVED },
  },
];
