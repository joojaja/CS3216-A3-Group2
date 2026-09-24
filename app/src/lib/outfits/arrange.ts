// Places the items of one outfit into the slots of the outfit card collage.
// The left column holds the body (top over bottom, or a one-piece), with an
// outer layer over the top. The right column stacks accessories and a bag
// from the top, with footwear fixed in the bottom corner.
// See docs/architecture.md, "Daily outfits."

export type CollageSlot = "top" | "bottom" | "onepiece" | "outer" | "extra" | "footwear";

export type ArrangeableItem = { id: string; category: string };

export type Arranged<T extends ArrangeableItem> = {
  top: T | null;
  bottom: T | null;
  onepiece: T | null;
  outer: T | null;
  // Accessories and bags in the right column, at most MAX_EXTRAS
  extras: T[];
  footwear: T | null;
  // Anything that did not fit a slot, such as a second top
  overflow: T[];
};

export const MAX_EXTRAS = 3;

export function slotFor(category: string): CollageSlot | null {
  switch (category) {
    case "top":
      return "top";
    case "bottom":
      return "bottom";
    case "dress":
      return "onepiece";
    case "outerwear":
      return "outer";
    case "accessory":
    case "bag":
      return "extra";
    case "footwear":
      return "footwear";
    default:
      return null;
  }
}

export function arrangeOutfit<T extends ArrangeableItem>(items: T[]): Arranged<T> {
  const arranged: Arranged<T> = {
    top: null,
    bottom: null,
    onepiece: null,
    outer: null,
    extras: [],
    footwear: null,
    overflow: [],
  };

  for (const item of items) {
    const slot = slotFor(item.category);
    if (slot === "extra") {
      if (arranged.extras.length < MAX_EXTRAS) arranged.extras.push(item);
      else arranged.overflow.push(item);
    } else if (slot && arranged[slot] === null) {
      arranged[slot] = item;
    } else {
      arranged.overflow.push(item);
    }
  }

  // A one-piece takes the whole left column, so a separate top or bottom
  // would have nowhere to go
  if (arranged.onepiece) {
    if (arranged.top) arranged.overflow.push(arranged.top);
    if (arranged.bottom) arranged.overflow.push(arranged.bottom);
    arranged.top = null;
    arranged.bottom = null;
  }

  return arranged;
}
