import { randomUUID } from "crypto";
import { z } from "zod";
import { clothingAttributesSchema } from "@/lib/schemas/ai";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
]);
const BUCKET = "wardrobe-images";

const saveItemSchema = z.object({
  attributes: clothingAttributesSchema,
  user_notes: z.string().max(2000).optional(),
});

// Saves a user-confirmed wardrobe item: uploads the image to the user's
// private storage folder and inserts the confirmed attributes.
export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) {
    return Response.json({ error: "Service is not configured" }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!checkRateLimit(`items:${user.id}`, 60, 60_000)) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  const form = await request.formData();
  const file = form.get("image");
  const payload = form.get("payload");

  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ error: "An image file is required" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type) || file.size > MAX_BYTES) {
    return Response.json(
      { error: "Invalid image. Use JPEG, PNG, WebP or HEIC under 8 MB." },
      { status: 400 },
    );
  }

  let attributes: unknown;
  try {
    attributes = JSON.parse(String(payload));
  } catch {
    return Response.json({ error: "Invalid item attributes" }, { status: 400 });
  }

  const result = saveItemSchema.safeParse({
    attributes,
    user_notes: form.get("user_notes") ?? undefined,
  });
  if (!result.success) {
    // Name the first offending field so the user can fix it, and log the
    // full issue list for debugging
    const first = result.error.issues[0];
    const field = first?.path.filter((p) => p !== "attributes").join(".") || "form";
    console.error("[items:save] validation failed", result.error.issues);
    return Response.json(
      { error: `Invalid item attributes: ${field} ${first?.message.toLowerCase() ?? "is invalid"}` },
      { status: 400 },
    );
  }
  const parsed = result.data;

  const ext = file.type === "image/heic" ? "heic" : file.type.split("/")[1];
  const imagePath = `${user.id}/${randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(imagePath, file, { contentType: file.type });

  if (uploadError) {
    return Response.json({ error: "Image upload failed" }, { status: 502 });
  }

  // confidence fields live in the ai_confidence jsonb column, not as their
  // own columns, so split them off before spreading
  const { confidence_notes, uncertain_fields, ...columns } = parsed.attributes;

  const { data, error } = await supabase
    .from("wardrobe_items")
    .insert({
      user_id: user.id,
      image_path: imagePath,
      ...columns,
      ai_confidence: { notes: confidence_notes, uncertain_fields },
      user_notes: parsed.user_notes ?? null,
      attributes_confirmed: true,
    })
    .select("id")
    .single();

  if (error) {
    await supabase.storage.from(BUCKET).remove([imagePath]);
    return Response.json({ error: "Could not save item" }, { status: 500 });
  }

  return Response.json({ id: data.id }, { status: 201 });
}

// Deletes an item row and its stored image.
export async function DELETE(request: Request) {
  const supabase = await createClient();
  if (!supabase) {
    return Response.json({ error: "Service is not configured" }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return Response.json({ error: "id is required" }, { status: 400 });
  }

  const { data: item } = await supabase
    .from("wardrobe_items")
    .select("id, image_path")
    .eq("id", id)
    .single();

  if (!item) {
    return Response.json({ error: "Item not found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("wardrobe_items")
    .delete()
    .eq("id", item.id);

  if (error) {
    return Response.json({ error: "Could not delete item" }, { status: 500 });
  }

  await supabase.storage.from(BUCKET).remove([item.image_path]);

  return Response.json({ ok: true });
}
