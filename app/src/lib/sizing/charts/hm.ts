// Transcribed from the official size guide on 21 September 2026. A person must check every number against source.url before release.
import type { SizeChart } from "../types.ts";

// The Singapore site (www2.hm.com/en_sg) returned 403, so these come from the
// H&M Thailand English size guide on th.hm.com. Labels use the EUR size.
// Letter sizes follow the page header: men S = EUR 44/46, M = 48/50,
// L = 52/54, XL = 56/58, XXL = 60/62 (the page is inconsistent about 40/42).
// Women XXS = 32, XS = 34, S = 36/38, M = 40/42, L = 44/46, XL = 48/50,
// XXL = 52/54, 3XL = 56/58.

const MEN_URL = "https://th.hm.com/th_en/customer-service/sizeguide/men.html";
const LADIES_URL = "https://th.hm.com/th_en/customer-service/sizeguide/ladies.html";
const RETRIEVED = "2026-09-21";

export const HM_CHARTS: SizeChart[] = [
  {
    key: "hm/mens/top",
    brand: "H&M",
    brandKey: "hm",
    category: "top",
    sizeRange: "mens",
    scope: "brand",
    basis: "body",
    unit: "cm",
    // "T-shirts and vests, shirts, hoodies, jackets, coats etc." table.
    rows: [
      { label: "EUR 40", ranges: { chest: [78, 82], waist: [66, 70] } },
      { label: "EUR 42", ranges: { chest: [82, 86], waist: [70, 74] } },
      { label: "EUR 44 (S)", ranges: { chest: [86, 90], waist: [74, 78] } },
      { label: "EUR 46 (S)", ranges: { chest: [90, 94], waist: [78, 82] } },
      { label: "EUR 48 (M)", ranges: { chest: [94, 98], waist: [82, 86] } },
      { label: "EUR 50 (M)", ranges: { chest: [98, 102], waist: [86, 90] } },
      { label: "EUR 52 (L)", ranges: { chest: [102, 106], waist: [90, 94] } },
      { label: "EUR 54 (L)", ranges: { chest: [106, 110], waist: [94, 98.5] } },
      { label: "EUR 56 (XL)", ranges: { chest: [110, 114], waist: [98.5, 103] } },
      { label: "EUR 58 (XL)", ranges: { chest: [114, 118], waist: [103, 107.5] } },
      { label: "EUR 60 (XXL)", ranges: { chest: [118, 122], waist: [107.5, 112] } },
      { label: "EUR 62 (XXL)", ranges: { chest: [122, 126], waist: [112, 116.5] } },
    ],
    source: { type: "stored", url: MEN_URL, retrievedAt: RETRIEVED },
  },
  {
    key: "hm/mens/bottom",
    brand: "H&M",
    brandKey: "hm",
    category: "bottom",
    sizeRange: "mens",
    scope: "brand",
    basis: "body",
    unit: "cm",
    // "Trousers, shorts, jeans etc." table. Hips are the published "low hip".
    // Inside leg length is a single value per size (76.5 to 81 cm), converted
    // to ranges by splitting at midpoints between neighbouring sizes.
    rows: [
      { label: "EUR 40", ranges: { waist: [66, 70], hips: [85.5, 88.5], inseam: [76.25, 76.75] } },
      { label: "EUR 42", ranges: { waist: [70, 74], hips: [88.5, 91.5], inseam: [76.75, 77.25] } },
      { label: "EUR 44 (S)", ranges: { waist: [74, 78], hips: [91.5, 94.5], inseam: [77.25, 77.75] } },
      { label: "EUR 46 (S)", ranges: { waist: [78, 82], hips: [94.5, 97.5], inseam: [77.75, 78.25] } },
      { label: "EUR 48 (M)", ranges: { waist: [82, 86], hips: [97.5, 100.5], inseam: [78.25, 78.75] } },
      { label: "EUR 50 (M)", ranges: { waist: [86, 90], hips: [100.5, 103.5], inseam: [78.75, 79.25] } },
      { label: "EUR 52 (L)", ranges: { waist: [90, 94], hips: [103.5, 106.5], inseam: [79.25, 79.75] } },
      { label: "EUR 54 (L)", ranges: { waist: [94, 98.5], hips: [106.5, 109.5], inseam: [79.75, 80.13] } },
      { label: "EUR 56 (XL)", ranges: { waist: [98.5, 103], hips: [109.5, 112.5], inseam: [80.13, 80.38] } },
      { label: "EUR 58 (XL)", ranges: { waist: [103, 107.5], hips: [112.5, 115.5], inseam: [80.38, 80.63] } },
      { label: "EUR 60 (XXL)", ranges: { waist: [107.5, 112], hips: [115.5, 118.5], inseam: [80.63, 80.88] } },
      { label: "EUR 62 (XXL)", ranges: { waist: [112, 116.5], hips: [118.5, 121.5], inseam: [80.88, 81.13] } },
    ],
    source: { type: "stored", url: MEN_URL, retrievedAt: RETRIEVED },
  },
  {
    key: "hm/womens/top",
    brand: "H&M",
    brandKey: "hm",
    category: "top",
    sizeRange: "womens",
    scope: "brand",
    basis: "body",
    unit: "cm",
    // "Upper body garments (tops, blouses, shirts, etc.)" table.
    rows: [
      { label: "EUR 32 (XXS)", ranges: { chest: [74, 78], waist: [58, 62], hips: [79, 83] } },
      { label: "EUR 34 (XS)", ranges: { chest: [78, 82], waist: [62, 66], hips: [83, 87] } },
      { label: "EUR 36 (S)", ranges: { chest: [82, 86], waist: [66, 70], hips: [87, 91] } },
      { label: "EUR 38 (S)", ranges: { chest: [86, 90], waist: [70, 74], hips: [91, 94.5] } },
      { label: "EUR 40 (M)", ranges: { chest: [90, 94], waist: [74, 78], hips: [94.5, 97.5] } },
      { label: "EUR 42 (M)", ranges: { chest: [94, 98], waist: [78, 82.5], hips: [97.5, 100.5] } },
      { label: "EUR 44 (L)", ranges: { chest: [98, 102], waist: [82.5, 87.5], hips: [100.5, 103.5] } },
      { label: "EUR 46 (L)", ranges: { chest: [102, 107], waist: [87.5, 93], hips: [103.5, 107.5] } },
      { label: "EUR 48 (XL)", ranges: { chest: [107, 113], waist: [93, 99], hips: [107.5, 112.5] } },
      { label: "EUR 50 (XL)", ranges: { chest: [113, 119], waist: [99, 105], hips: [112.5, 117.5] } },
      { label: "EUR 52 (XXL)", ranges: { chest: [119, 125], waist: [105, 111], hips: [117.5, 122.5] } },
      { label: "EUR 54 (XXL)", ranges: { chest: [125, 131], waist: [111, 117.5], hips: [122.5, 128] } },
      { label: "EUR 56 (3XL)", ranges: { chest: [131, 137], waist: [117.5, 124.5], hips: [128, 134] } },
      { label: "EUR 58 (3XL)", ranges: { chest: [137, 143], waist: [124.5, 131.5], hips: [134, 140] } },
    ],
    source: { type: "stored", url: LADIES_URL, retrievedAt: RETRIEVED },
  },
  {
    key: "hm/womens/bottom",
    brand: "H&M",
    brandKey: "hm",
    category: "bottom",
    sizeRange: "womens",
    scope: "brand",
    basis: "body",
    unit: "cm",
    // "Lower body garments (trousers, shorts, skirts etc.)" table. The page
    // gives 73 cm inside leg for every size, so inseam is left out.
    rows: [
      { label: "EUR 32 (XXS)", ranges: { waist: [58, 62], hips: [79, 83] } },
      { label: "EUR 34 (XS)", ranges: { waist: [62, 66], hips: [83, 87] } },
      { label: "EUR 36 (S)", ranges: { waist: [66, 70], hips: [87, 91] } },
      { label: "EUR 38 (S)", ranges: { waist: [70, 74], hips: [91, 94.5] } },
      { label: "EUR 40 (M)", ranges: { waist: [74, 78], hips: [94.5, 97.5] } },
      { label: "EUR 42 (M)", ranges: { waist: [78, 82.5], hips: [97.5, 100.5] } },
      { label: "EUR 44 (L)", ranges: { waist: [82.5, 87.5], hips: [100.5, 103.5] } },
      { label: "EUR 46 (L)", ranges: { waist: [87.5, 93], hips: [103.5, 107.5] } },
      { label: "EUR 48 (XL)", ranges: { waist: [93, 99], hips: [107.5, 112.5] } },
      { label: "EUR 50 (XL)", ranges: { waist: [99, 105], hips: [112.5, 117.5] } },
      { label: "EUR 52 (XXL)", ranges: { waist: [105, 111], hips: [117.5, 122.5] } },
      { label: "EUR 54 (XXL)", ranges: { waist: [111, 117.5], hips: [122.5, 128] } },
      { label: "EUR 56 (3XL)", ranges: { waist: [117.5, 124.5], hips: [128, 134] } },
      { label: "EUR 58 (3XL)", ranges: { waist: [124.5, 131.5], hips: [134, 140] } },
    ],
    source: { type: "stored", url: LADIES_URL, retrievedAt: RETRIEVED },
  },
];
