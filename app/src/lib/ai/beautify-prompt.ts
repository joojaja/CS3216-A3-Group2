const SINGLE_GARMENT_RULES = `Choose exactly one target garment before editing the image.

Target selection rules:
- If garments overlap, choose the garment physically lying on top of the others and closest to the camera. Treat every garment underneath it as background, even when an underneath garment is larger.
- If the garments do not overlap, choose the garment nearest the centre with the largest clearly visible area.
- If the choice is still unclear, choose the least occluded garment.

The finished image must contain exactly one garment. Remove every non-target garment completely. Never return an outfit, a stack, a set, a before-and-after comparison or a second clothing item. Do not merge details from another garment into the target.`;

// Beautify is one operation. It isolates the selected garment and presents it
// flat and smooth in the same generated image. The model can still change
// small details, which is why the UI keeps the original selectable and says so.
export const BEAUTIFY_PROMPT = `${SINGLE_GARMENT_RULES}

Create one clean catalogue photo of only the selected target garment. Remove the original background and every other object, then place the target garment centred on a plain pure white background, filling most of a square frame.

Lay the target garment flat and smooth. Remove wrinkles and folds and even out the lighting, but keep its colours, print, logo, lettering, stripes, fabric texture, proportions, silhouette, waistband, fasteners and neckline. Do not add, remove or redesign any part of the target garment, and do not change its colour.`;
