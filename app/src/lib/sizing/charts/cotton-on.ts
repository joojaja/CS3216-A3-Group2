// Transcribed from the official size guide on 21 September 2026. A person must check every number against source.url before release.
import type { SizeChart } from "../types.ts";

// From the "Women's Clothing" tab of the Cotton On Singapore size guide.
// The page gives one value per size (for example M: bust 95, waist 77,
// seat 103), so each value was converted to a range by splitting at the
// midpoints between neighbouring sizes. The published value sits in a
// comment on each row. "Seat" on the page is stored as hips. The same
// table covers tops and bottoms.

const URL = "https://cottonon.com/SG/size-guide.html";
const RETRIEVED = "2026-09-21";

export const COTTONON_CHARTS: SizeChart[] = [
  {
    key: "cottonon/womens/top",
    brand: "Cotton On",
    brandKey: "cottonon",
    category: "top",
    sizeRange: "womens",
    scope: "brand",
    basis: "body",
    unit: "cm",
    rows: [
      { label: "3XS (AU 4)", ranges: { chest: [72.5, 77.5], waist: [54.5, 59.5], hips: [80.5, 85.5] } }, // bust 75, waist 57, seat 83
      { label: "2XS (AU 6)", ranges: { chest: [77.5, 82.5], waist: [59.5, 64.5], hips: [85.5, 90.5] } }, // bust 80, waist 62, seat 88
      { label: "XS (AU 8)", ranges: { chest: [82.5, 87.5], waist: [64.5, 69.5], hips: [90.5, 95.5] } }, // bust 85, waist 67, seat 93
      { label: "S (AU 10)", ranges: { chest: [87.5, 92.5], waist: [69.5, 74.5], hips: [95.5, 100.5] } }, // bust 90, waist 72, seat 98
      { label: "M (AU 12)", ranges: { chest: [92.5, 98], waist: [74.5, 80], hips: [100.5, 106] } }, // bust 95, waist 77, seat 103
      { label: "L (AU 14)", ranges: { chest: [98, 104], waist: [80, 86], hips: [106, 112] } }, // bust 101, waist 83, seat 109
      { label: "XL (AU 16)", ranges: { chest: [104, 110.5], waist: [86, 92.5], hips: [112, 118.5] } }, // bust 107, waist 89, seat 115
      { label: "2XL (AU 18)", ranges: { chest: [110.5, 117.5], waist: [92.5, 99.5], hips: [118.5, 125.5] } }, // bust 114, waist 96, seat 122
      { label: "3XL (AU 20)", ranges: { chest: [117.5, 124.5], waist: [99.5, 106.5], hips: [125.5, 132.5] } }, // bust 121, waist 103, seat 129
      { label: "4XL (AU 22)", ranges: { chest: [124.5, 131.5], waist: [106.5, 113.5], hips: [132.5, 139.5] } }, // bust 128, waist 110, seat 136
      { label: "5XL (AU 24)", ranges: { chest: [131.5, 138.5], waist: [113.5, 120.5], hips: [139.5, 146.5] } }, // bust 135, waist 117, seat 143
    ],
    source: { type: "stored", url: URL, retrievedAt: RETRIEVED },
  },
  {
    key: "cottonon/womens/bottom",
    brand: "Cotton On",
    brandKey: "cottonon",
    category: "bottom",
    sizeRange: "womens",
    scope: "brand",
    basis: "body",
    unit: "cm",
    rows: [
      { label: "3XS (AU 4)", ranges: { waist: [54.5, 59.5], hips: [80.5, 85.5] } }, // waist 57, seat 83
      { label: "2XS (AU 6)", ranges: { waist: [59.5, 64.5], hips: [85.5, 90.5] } }, // waist 62, seat 88
      { label: "XS (AU 8)", ranges: { waist: [64.5, 69.5], hips: [90.5, 95.5] } }, // waist 67, seat 93
      { label: "S (AU 10)", ranges: { waist: [69.5, 74.5], hips: [95.5, 100.5] } }, // waist 72, seat 98
      { label: "M (AU 12)", ranges: { waist: [74.5, 80], hips: [100.5, 106] } }, // waist 77, seat 103
      { label: "L (AU 14)", ranges: { waist: [80, 86], hips: [106, 112] } }, // waist 83, seat 109
      { label: "XL (AU 16)", ranges: { waist: [86, 92.5], hips: [112, 118.5] } }, // waist 89, seat 115
      { label: "2XL (AU 18)", ranges: { waist: [92.5, 99.5], hips: [118.5, 125.5] } }, // waist 96, seat 122
      { label: "3XL (AU 20)", ranges: { waist: [99.5, 106.5], hips: [125.5, 132.5] } }, // waist 103, seat 129
      { label: "4XL (AU 22)", ranges: { waist: [106.5, 113.5], hips: [132.5, 139.5] } }, // waist 110, seat 136
      { label: "5XL (AU 24)", ranges: { waist: [113.5, 120.5], hips: [139.5, 146.5] } }, // waist 117, seat 143
    ],
    source: { type: "stored", url: URL, retrievedAt: RETRIEVED },
  },
];
