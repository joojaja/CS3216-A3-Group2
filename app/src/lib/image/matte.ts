// Pure pixel maths for the garment cut-out, kept apart from the canvas code in
// clean.ts so it can be tested without a browser.

// Alpha at or below low becomes fully transparent, at or above high fully
// opaque, with a smooth ramp between. Removes the faint haze the model leaves
// over low-contrast backgrounds while keeping soft garment edges
export function hardenAlpha(alpha: number, low: number, high: number): number {
  if (alpha <= low) return 0;
  if (alpha >= high) return 255;
  const t = (alpha - low) / (high - low);
  return Math.round(255 * t * t * (3 - 2 * t));
}

// Scales a width and height down, never up, so the longer side is at most
// maxSide. Keeps the aspect ratio and never returns a zero dimension
export function fitWithin(width: number, height: number, maxSide: number) {
  const scale = Math.min(1, maxSide / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}
