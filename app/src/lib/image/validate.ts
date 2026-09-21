// Upload checks shared by image routes. The older routes still carry their
// own copies; new routes use this one.

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic"]);

export function validateImage(file: FormDataEntryValue | null): { ok: true; file: File } | { ok: false; error: string } {
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "An image file is required" };
  if (!ALLOWED_IMAGE_TYPES.has(file.type) || file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: "Invalid image. Use JPEG, PNG, WebP or HEIC under 8 MB." };
  }
  return { ok: true, file };
}
