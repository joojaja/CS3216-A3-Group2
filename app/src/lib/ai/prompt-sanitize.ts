// Free-text clothing attributes (colour, pattern, material cues, and so on)
// come from a model that read a user photo or a screenshot the user
// uploaded. Text visible in that image is untrusted: a screenshot can carry
// a string like "ignore previous instructions" as if it were a colour name,
// and that string later gets interpolated into a second prompt alongside
// real wardrobe data. Sanitize every free-text field before it is folded
// into a prompt, separately from the value shown to the user or stored in
// the database, which stays as the model produced it.

// Control characters and Unicode bidi override/isolate characters. Bidi
// characters can make text render in an order different from its actual
// character sequence, which is a known way to hide an instruction inside
// text that looks harmless when displayed.
const CONTROL_OR_BIDI = /[\u0000-\u001F\u007F-\u009F​-‏‪-‮⁦-⁩]/g;

// Words that suggest the text is trying to act as an instruction rather
// than describe a garment. Matched as whole words, case-insensitively.
const INSTRUCTION_LIKE = /\b(ignore|instructions?|system|prompt|decision_label)\b/i;

const DEFAULT_MAX_LENGTH = 40;

// Normalises one free-text attribute value for use inside a prompt: strips
// control and bidi characters, collapses whitespace, caps the length, and
// drops the value entirely when it reads like an instruction rather than a
// clothing description. Returns "" for anything unsafe or not a string.
export function sanitizeFreeText(value: unknown, maxLength: number = DEFAULT_MAX_LENGTH): string {
  if (typeof value !== "string") return "";

  const withoutControlChars = value.replace(CONTROL_OR_BIDI, "");
  const collapsed = withoutControlChars.replace(/\s+/g, " ").trim();
  if (!collapsed) return "";
  if (INSTRUCTION_LIKE.test(collapsed)) return "";

  return collapsed.slice(0, maxLength);
}

// Same as sanitizeFreeText, applied to a list, dropping any entry that
// sanitizes to nothing (either empty or instruction-like).
export function sanitizeFreeTextList(values: unknown, maxLength: number = DEFAULT_MAX_LENGTH): string[] {
  if (!Array.isArray(values)) return [];
  return values.map((value) => sanitizeFreeText(value, maxLength)).filter((value) => value.length > 0);
}

// The subset of clothing attribute fields that hold free text rather than an
// enum value. category, formality, layering_role and weather_tags come from
// a zod enum and are already restricted to known values, so they are safe
// to interpolate as-is and are left out here.
type FreeTextAttributes = {
  subcategory?: string | null;
  primary_colour?: string | null;
  secondary_colours?: string[] | null;
  pattern?: string | null;
  material_cues?: string | null;
  confidence_notes?: string | null;
  uncertain_fields?: string[] | null;
};

// Returns a copy of a clothing-attributes object with every free-text field
// sanitized for prompt use. Enum fields (category, formality, layering_role,
// weather_tags) and non-text fields pass through unchanged.
export function sanitizeClothingAttributesForPrompt<T extends FreeTextAttributes>(attrs: T): T {
  return {
    ...attrs,
    subcategory: sanitizeFreeText(attrs.subcategory),
    primary_colour: sanitizeFreeText(attrs.primary_colour),
    secondary_colours: sanitizeFreeTextList(attrs.secondary_colours),
    pattern: sanitizeFreeText(attrs.pattern),
    material_cues: sanitizeFreeText(attrs.material_cues),
    confidence_notes: sanitizeFreeText(attrs.confidence_notes),
    uncertain_fields: sanitizeFreeTextList(attrs.uncertain_fields),
  };
}

// The free-text fields of a wardrobe row as selected in the purchase
// evaluation route. Nullable because the columns are nullable in the
// database; null is preserved rather than turned into an empty string so a
// missing value still reads as "unknown" rather than a blank.
type FreeTextWardrobeRow = {
  subcategory: string | null;
  primary_colour: string | null;
  secondary_colours: string[];
  pattern: string | null;
};

// Returns a copy of a wardrobe row with its free-text fields sanitized for
// prompt use. A wardrobe item's attributes may themselves have been
// extracted from a photo containing injected text, so they are untrusted in
// the same way a fresh purchase screenshot is.
export function sanitizeWardrobeRowForPrompt<T extends FreeTextWardrobeRow>(row: T): T {
  return {
    ...row,
    subcategory: row.subcategory === null ? null : sanitizeFreeText(row.subcategory) || null,
    primary_colour: row.primary_colour === null ? null : sanitizeFreeText(row.primary_colour) || null,
    secondary_colours: sanitizeFreeTextList(row.secondary_colours),
    pattern: row.pattern === null ? null : sanitizeFreeText(row.pattern) || null,
  };
}
