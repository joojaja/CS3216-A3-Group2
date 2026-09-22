// Builds the My Style colour palette from confirmed wardrobe items. Each item
// adds one to the family of its primary colour. Secondary colours never
// change the shares; they only show as "also appears in" counts, so a
// striped top is not counted twice. Every category counts, including
// footwear, accessories and bags.

import { COLOUR_FAMILIES, OTHER_FAMILY, colourFamily, type ColourFamily } from "./colour-families.ts";
import { roundedPercents } from "./shares.ts";

export type PaletteItem = {
  id: string;
  primary_colour: string | null;
  secondary_colours?: string[] | null;
};

export type PaletteRow = {
  key: string;
  name: string;
  hex: string;
  neutral: boolean;
  count: number;
  percent: number;
  itemIds: string[];
  // Items that carry this family as a secondary colour but not as the primary
  alsoIn: number;
};

export type Palette = {
  total: number;
  // Families in order of item count. "Not recognised" is always last
  rows: PaletteRow[];
  // Share of items with a neutral primary colour, 0 to 100
  neutralPercent: number;
  // CSS background for the blended bar above the rows
  gradient: string;
};

const ORDER = new Map([...COLOUR_FAMILIES, OTHER_FAMILY].map((family, index) => [family.key, index]));

export function buildPalette(items: PaletteItem[]): Palette {
  const groups = new Map<string, { family: ColourFamily; itemIds: string[]; alsoIn: Set<string> }>();

  for (const item of items) {
    const family = colourFamily(item.primary_colour);
    const entry = groups.get(family.key) ?? { family, itemIds: [], alsoIn: new Set<string>() };
    entry.itemIds.push(item.id);
    groups.set(family.key, entry);
  }
  // Secondary colours only annotate families already in the palette
  for (const item of items) {
    const primary = colourFamily(item.primary_colour).key;
    for (const colour of item.secondary_colours ?? []) {
      const family = colourFamily(colour);
      if (family.key === OTHER_FAMILY.key || family.key === primary) continue;
      groups.get(family.key)?.alsoIn.add(item.id);
    }
  }

  const sorted = [...groups.values()].sort((a, b) => {
    if (a.family.key === OTHER_FAMILY.key) return 1;
    if (b.family.key === OTHER_FAMILY.key) return -1;
    return b.itemIds.length - a.itemIds.length || ORDER.get(a.family.key)! - ORDER.get(b.family.key)!;
  });
  const percents = roundedPercents(sorted.map((entry) => entry.itemIds.length));

  const rows: PaletteRow[] = sorted.map((entry, index) => ({
    key: entry.family.key,
    name: entry.family.name,
    hex: entry.family.hex,
    neutral: entry.family.neutral,
    count: entry.itemIds.length,
    percent: percents[index],
    itemIds: entry.itemIds,
    alsoIn: entry.alsoIn.size,
  }));

  const neutralCount = rows.filter((row) => row.neutral).reduce((sum, row) => sum + row.count, 0);

  return {
    total: items.length,
    rows,
    neutralPercent: items.length ? Math.round((neutralCount / items.length) * 100) : 0,
    gradient: paletteGradient(rows),
  };
}

// Each family's swatch sits at the middle of its share of the bar, and the
// browser blends between neighbours
export function paletteGradient(rows: Pick<PaletteRow, "hex" | "count">[]): string {
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  if (total === 0) return OTHER_FAMILY.hex;
  if (rows.length === 1) return rows[0].hex;
  let start = 0;
  const stops = rows.map((row) => {
    const width = (row.count / total) * 100;
    const middle = start + width / 2;
    start += width;
    return `${row.hex} ${middle.toFixed(1)}%`;
  });
  return `linear-gradient(90deg, ${stops.join(", ")})`;
}
