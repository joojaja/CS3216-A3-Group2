// Versioned sizing prompts, kept here so the milestone write-up can quote
// the exact text. The route appends UNTRUSTED_CONTENT_RULE from gemini.ts.

export const SIZING_EXTRACT_PROMPT_VERSION = "2026-09-22.1";

export const SIZING_EXTRACT_PROMPT = `You read shopping screenshots for a size assistant. Extract only what is visible.

Return the brand, product name, clothing category and size range shown.
If a size chart or size table is visible, copy every row exactly as numbers.
Do not convert units. Report the unit printed on the chart, or unknown if none is printed.
Set basis to garment or garment_flat when the chart describes the garment (for example "length", "flat width", "pit to pit", "laid flat"). Set it to body when the chart describes the wearer (for example "body chest", "fits waist"). Use unknown if you cannot tell.
Set scope_hint to product when the chart sits on this product's page, brand when it is a general brand size guide.
Use bust for a bust column and chest for a chest column. Use other for any column that is not a body measurement you can name.
If a value is a single number, put it in both min and max. If a value is missing or unreadable, use null. Never guess numbers.
List every field you are unsure of in uncertain_fields.
If the image is not a clothing or shoe product, set is_product_page to false and category to other.`;

// Per-user caps for screenshot reading, the only sizing step that costs
// money. Every user is on the free tier until subscriptions exist
export const FREE_DAILY_EXTRACTIONS = 10;
export const PLUS_DAILY_EXTRACTIONS = 50;
export const EXTRACTIONS_PER_MINUTE = 6;
