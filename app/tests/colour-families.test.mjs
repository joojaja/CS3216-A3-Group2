import test from "node:test";
import assert from "node:assert/strict";
import { COLOUR_FAMILIES, colourFamily } from "../src/lib/style/colour-families.ts";

const cases = {
  // From scripts/seed-wardrobe.mjs and the size chart fixtures
  black: "black",
  navy: "navy",
  white: "white",
  grey: "grey",
  blue: "blue",
  beige: "beige",
  tan: "tan",
  olive: "olive",
  cream: "cream",
  brown: "brown",
  "charcoal grey": "charcoal",
  "off white": "cream",
  "medium grey": "grey",
  "medium grey stripe": "grey",
  "dark grey": "charcoal",
  // From src/lib/demo-items.ts
  "off-white": "cream",
  apricot: "orange",
  sage: "green",
  indigo: "denim",
  butter: "yellow",
  rose: "pink",
  // Modifiers and compound names
  "dark navy": "navy",
  "navy blue": "navy",
  "Heather Grey": "grey",
  "light wash denim": "denim",
  "dark wash": "denim",
  "light grey": "light_grey",
  "sky blue": "light_blue",
  "grey blue": "blue",
  "olive green": "olive",
  "rose gold": "metallic",
  "silver metallic": "metallic",
  wine: "burgundy",
  "multi-colour": "multicolour",
};

for (const [text, key] of Object.entries(cases)) {
  test(`"${text}" maps to ${key}`, () => {
    assert.equal(colourFamily(text).key, key);
  });
}

test("empty, missing and unknown colours are not recognised", () => {
  for (const text of ["", "   ", null, undefined, "iridescent", "--"]) {
    assert.equal(colourFamily(text).key, "other");
  }
});

test("keywords match whole words only", () => {
  // "ink" is a navy keyword but must not match inside "pink"
  assert.equal(colourFamily("pink").key, "pink");
  // "tan" must not match inside "tangerine"
  assert.equal(colourFamily("tangerine").key, "orange");
});

test("family keys and swatches are unique", () => {
  const keys = COLOUR_FAMILIES.map((family) => family.key);
  assert.equal(new Set(keys).size, keys.length);
  for (const family of COLOUR_FAMILIES) assert.match(family.hex, /^#[0-9A-F]{6}$/);
});
