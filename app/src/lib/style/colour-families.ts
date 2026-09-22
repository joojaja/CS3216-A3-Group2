// Colour families for the My Style palette. Item colours are free text
// written by the model and edited by the user, so "navy", "navy blue" and
// "dark navy" need to land in one row. The hex values are display swatches
// for the family, not colours measured from the photo.
// See docs/plans/style-and-colour-palette.md section 1.

export type ColourFamily = {
  key: string;
  name: string;
  hex: string;
  neutral: boolean;
  keywords: string[];
};

// Listed in display order for ties. Keywords are whole words or phrases
export const COLOUR_FAMILIES: ColourFamily[] = [
  { key: "black", name: "Black", hex: "#1A1A1A", neutral: true, keywords: ["black", "jet", "onyx", "ebony"] },
  {
    key: "charcoal",
    name: "Charcoal",
    hex: "#3C3C3C",
    neutral: true,
    keywords: ["charcoal", "dark grey", "dark gray", "graphite", "anthracite", "gunmetal"],
  },
  {
    key: "grey",
    name: "Grey",
    hex: "#8A8A8A",
    neutral: true,
    keywords: ["grey", "gray", "heather", "ash", "slate", "marl", "medium grey", "medium gray"],
  },
  {
    key: "light_grey",
    name: "Light grey",
    hex: "#C8C8C8",
    neutral: true,
    keywords: ["light grey", "light gray", "pale grey", "pale gray", "silver", "dove grey"],
  },
  { key: "white", name: "White", hex: "#F7F7F5", neutral: true, keywords: ["white", "optic white", "snow"] },
  {
    key: "cream",
    name: "Cream",
    hex: "#EFE6D2",
    neutral: true,
    keywords: ["cream", "off white", "ivory", "ecru", "oatmeal", "bone", "vanilla", "eggshell", "natural"],
  },
  {
    key: "beige",
    name: "Beige",
    hex: "#D8C3A0",
    neutral: true,
    keywords: ["beige", "khaki", "sand", "stone", "taupe", "nude", "fawn", "oat"],
  },
  { key: "tan", name: "Tan", hex: "#B98A5A", neutral: true, keywords: ["tan", "camel", "caramel", "cognac", "toffee"] },
  {
    key: "brown",
    name: "Brown",
    hex: "#6B4A32",
    neutral: true,
    keywords: ["brown", "chocolate", "coffee", "mocha", "espresso", "chestnut", "walnut"],
  },
  {
    key: "navy",
    name: "Navy",
    hex: "#1F2A44",
    neutral: true,
    keywords: ["navy", "navy blue", "dark blue", "midnight", "midnight blue", "ink"],
  },
  {
    key: "denim",
    name: "Denim",
    hex: "#3B5378",
    neutral: true,
    keywords: ["denim", "indigo", "dark wash", "mid wash", "medium wash", "light wash", "chambray"],
  },
  {
    key: "blue",
    name: "Blue",
    hex: "#3F6FB5",
    neutral: false,
    keywords: ["blue", "royal blue", "cobalt", "cornflower", "azure", "electric blue", "slate blue"],
  },
  {
    key: "light_blue",
    name: "Light blue",
    hex: "#A9C4E0",
    neutral: false,
    keywords: ["light blue", "sky blue", "baby blue", "powder blue", "pale blue", "ice blue"],
  },
  {
    key: "teal",
    name: "Teal",
    hex: "#2E7D7A",
    neutral: false,
    keywords: ["teal", "teal blue", "turquoise", "aqua", "petrol"],
  },
  {
    key: "green",
    name: "Green",
    hex: "#3F7A4A",
    neutral: false,
    keywords: ["green", "emerald", "forest green", "bottle green", "kelly green", "mint", "sage", "jade", "lime"],
  },
  {
    key: "olive",
    name: "Olive",
    hex: "#6B6B3A",
    neutral: false,
    keywords: ["olive", "olive green", "khaki green", "army green", "military green", "moss"],
  },
  {
    key: "yellow",
    name: "Yellow",
    hex: "#E3C343",
    neutral: false,
    keywords: ["yellow", "mustard", "butter", "lemon", "ochre", "golden yellow"],
  },
  {
    key: "orange",
    name: "Orange",
    hex: "#E0823A",
    neutral: false,
    keywords: ["orange", "rust", "burnt orange", "apricot", "peach", "coral", "terracotta", "tangerine"],
  },
  { key: "red", name: "Red", hex: "#B8312F", neutral: false, keywords: ["red", "scarlet", "crimson", "cherry", "brick"] },
  {
    key: "burgundy",
    name: "Burgundy",
    hex: "#6D1F2B",
    neutral: false,
    keywords: ["burgundy", "maroon", "wine", "wine red", "oxblood", "merlot"],
  },
  {
    key: "pink",
    name: "Pink",
    hex: "#E3A1B4",
    neutral: false,
    keywords: ["pink", "rose", "blush", "fuchsia", "magenta", "hot pink", "dusty pink", "salmon"],
  },
  {
    key: "purple",
    name: "Purple",
    hex: "#6E4A8E",
    neutral: false,
    keywords: ["purple", "lilac", "lavender", "violet", "mauve", "plum", "aubergine"],
  },
  {
    key: "metallic",
    name: "Metallic",
    hex: "#B8A06A",
    neutral: false,
    keywords: ["metallic", "gold", "rose gold", "bronze", "copper", "silver metallic"],
  },
  {
    key: "multicolour",
    name: "Multicolour",
    hex: "#A58D7F",
    neutral: false,
    keywords: ["multicolour", "multicolor", "multicoloured", "multicolored", "multi", "rainbow", "colour block", "color block"],
  },
];

// Items whose colour is empty or matches no keyword. Shown last so the user
// can open those items and fix the colour
export const OTHER_FAMILY: ColourFamily = {
  key: "other",
  name: "Not recognised",
  hex: "#D4D5CB",
  neutral: false,
  keywords: [],
};

const BY_KEY = new Map(COLOUR_FAMILIES.map((family) => [family.key, family]));

export function familyByKey(key: string): ColourFamily {
  return BY_KEY.get(key) ?? OTHER_FAMILY;
}

// "Off-white", "OFF WHITE" and "off  white" all become "off white"
function normalise(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z]+/g, " ")
    .trim();
}

const MATCHERS = COLOUR_FAMILIES.flatMap((family) =>
  family.keywords.map((keyword) => ({ family, keyword: normalise(keyword) })),
);

// Picks the family whose keyword is the longest whole-word match, so "light
// grey" beats "grey" and "charcoal grey" is Charcoal. On a tie the match
// further right wins, because English puts the main colour last: "grey blue"
// is Blue. "navy blue" and "olive green" have their own keywords
export function colourFamily(text: string | null | undefined): ColourFamily {
  if (!text) return OTHER_FAMILY;
  const words = normalise(text);
  if (words === "") return OTHER_FAMILY;
  const padded = ` ${words} `;

  let best: { family: ColourFamily; length: number; position: number } | null = null;
  for (const matcher of MATCHERS) {
    const position = padded.lastIndexOf(` ${matcher.keyword} `);
    if (position < 0) continue;
    const length = matcher.keyword.length;
    if (!best || length > best.length || (length === best.length && position > best.position)) {
      best = { family: matcher.family, length, position };
    }
  }
  return best?.family ?? OTHER_FAMILY;
}
