// Transcribed from the official size guide on 21 September 2026. A person must check every number against source.url before release.
import type { SizeChart } from "../types.ts";

// From the Nike Singapore men's shoe size chart. Labels are US men's sizes.
// The page gives one foot length in cm per size, so each value was converted
// to a range by splitting at the midpoints between neighbouring sizes. The
// published foot length sits in a comment on each row. Stored as unisex
// because Nike lists US women's sizes on the same table (US women's = US
// men's + 1.5).

export const NIKE_CHARTS: SizeChart[] = [
  {
    key: "nike/unisex/footwear",
    brand: "Nike",
    brandKey: "nike",
    category: "footwear",
    sizeRange: "unisex",
    scope: "brand",
    basis: "body",
    unit: "cm",
    rows: [
      { label: "US 3.5", ranges: { foot_length: [21.4, 21.8] } }, // foot length 21.6
      { label: "US 4", ranges: { foot_length: [21.8, 22.2] } }, // foot length 22
      { label: "US 4.5", ranges: { foot_length: [22.2, 22.65] } }, // foot length 22.4
      { label: "US 5", ranges: { foot_length: [22.65, 23.1] } }, // foot length 22.9
      { label: "US 5.5", ranges: { foot_length: [23.1, 23.5] } }, // foot length 23.3
      { label: "US 6", ranges: { foot_length: [23.5, 23.9] } }, // foot length 23.7
      { label: "US 6.5", ranges: { foot_length: [23.9, 24.3] } }, // foot length 24.1
      { label: "US 7", ranges: { foot_length: [24.3, 24.75] } }, // foot length 24.5
      { label: "US 7.5", ranges: { foot_length: [24.75, 25.2] } }, // foot length 25
      { label: "US 8", ranges: { foot_length: [25.2, 25.6] } }, // foot length 25.4
      { label: "US 8.5", ranges: { foot_length: [25.6, 26] } }, // foot length 25.8
      { label: "US 9", ranges: { foot_length: [26, 26.45] } }, // foot length 26.2
      { label: "US 9.5", ranges: { foot_length: [26.45, 26.9] } }, // foot length 26.7
      { label: "US 10", ranges: { foot_length: [26.9, 27.3] } }, // foot length 27.1
      { label: "US 10.5", ranges: { foot_length: [27.3, 27.7] } }, // foot length 27.5
      { label: "US 11", ranges: { foot_length: [27.7, 28.1] } }, // foot length 27.9
      { label: "US 11.5", ranges: { foot_length: [28.1, 28.55] } }, // foot length 28.3
      { label: "US 12", ranges: { foot_length: [28.55, 29] } }, // foot length 28.8
      { label: "US 12.5", ranges: { foot_length: [29, 29.4] } }, // foot length 29.2
      { label: "US 13", ranges: { foot_length: [29.4, 29.8] } }, // foot length 29.6
      { label: "US 13.5", ranges: { foot_length: [29.8, 30.25] } }, // foot length 30
      { label: "US 14", ranges: { foot_length: [30.25, 30.7] } }, // foot length 30.5
      { label: "US 14.5", ranges: { foot_length: [30.7, 31.1] } }, // foot length 30.9
      { label: "US 15", ranges: { foot_length: [31.1, 31.5] } }, // foot length 31.3
      { label: "US 15.5", ranges: { foot_length: [31.5, 31.95] } }, // foot length 31.7
      { label: "US 16", ranges: { foot_length: [31.95, 32.4] } }, // foot length 32.2
      { label: "US 16.5", ranges: { foot_length: [32.4, 32.8] } }, // foot length 32.6
      { label: "US 17", ranges: { foot_length: [32.8, 33.2] } }, // foot length 33
      { label: "US 17.5", ranges: { foot_length: [33.2, 33.65] } }, // foot length 33.4
      { label: "US 18", ranges: { foot_length: [33.65, 34.1] } }, // foot length 33.9
      { label: "US 18.5", ranges: { foot_length: [34.1, 34.5] } }, // foot length 34.3
      { label: "US 19", ranges: { foot_length: [34.5, 34.9] } }, // foot length 34.7
      { label: "US 19.5", ranges: { foot_length: [34.9, 35.3] } }, // foot length 35.1
      { label: "US 20", ranges: { foot_length: [35.3, 35.75] } }, // foot length 35.5
      { label: "US 20.5", ranges: { foot_length: [35.75, 36.2] } }, // foot length 36
      { label: "US 21", ranges: { foot_length: [36.2, 36.6] } }, // foot length 36.4
      { label: "US 21.5", ranges: { foot_length: [36.6, 37] } }, // foot length 36.8
      { label: "US 22", ranges: { foot_length: [37, 37.4] } }, // foot length 37.2
    ],
    source: { type: "stored", url: "https://www.nike.com/sg/size-fit/mens-footwear", retrievedAt: "2026-09-21" },
  },
];
