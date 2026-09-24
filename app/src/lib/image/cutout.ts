// Rules for the transparent garment cut-outs outfit cards draw. The browser
// makes them; the server only checks and stores them.

// Fired in the browser when new cut-outs have been stored, so open outfit
// views can reload and show them
export const CUTOUTS_UPDATED_EVENT = "wearabouts:cutouts-updated";

// An 800 px PNG of one garment is well under this
export const CUTOUT_MAX_BYTES = 3 * 1024 * 1024;

// PNG is the only format that keeps the transparency the card relies on
export function isValidCutout(file: { type: string; size: number }): boolean {
  return file.type === "image/png" && file.size > 0 && file.size <= CUTOUT_MAX_BYTES;
}

// A stored path is only ever touched when it sits in the caller's own folder
export function inUserFolder(path: string | null | undefined, userId: string): path is string {
  return typeof path === "string" && path.startsWith(`${userId}/`) && !path.includes("..");
}
