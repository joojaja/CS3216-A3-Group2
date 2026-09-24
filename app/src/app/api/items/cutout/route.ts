import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { inUserFolder, isValidCutout } from "@/lib/image/cutout";

const BUCKET = "wardrobe-images";

type ItemRow = {
  id: string;
  image_path: string;
  cutout_path?: string | null;
  ai_confidence: Record<string, unknown> | null;
};

// Cut-outs for items saved before they existed. The browser fetches the
// stored photo here (same origin, so the canvas can read it), removes the
// background on the device, and posts the result back. No model runs on the
// server and nothing is sent to an AI provider.
async function ownedItem(id: string) {
  const supabase = await createClient();
  if (!supabase) return { error: Response.json({ error: "Service is not configured" }, { status: 503 }) };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: Response.json({ error: "Unauthorized" }, { status: 401 }) };

  if (!checkRateLimit(`cutout:${user.id}`, 60, 60_000)) {
    return { error: Response.json({ error: "Too many requests" }, { status: 429 }) };
  }

  // All columns, so a missing cutout_path column reads as undefined
  const { data: item } = await supabase
    .from("wardrobe_items")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle<ItemRow>();
  if (!item) return { error: Response.json({ error: "Item not found" }, { status: 404 }) };

  return { supabase, user, item };
}

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "id is required" }, { status: 400 });

  const found = await ownedItem(id);
  if ("error" in found) return found.error;
  const { supabase, user, item } = found;

  if (!inUserFolder(item.image_path, user.id)) {
    return Response.json({ error: "Item not found" }, { status: 404 });
  }
  const { data: blob, error } = await supabase.storage.from(BUCKET).download(item.image_path);
  if (error || !blob) {
    return Response.json({ error: "Could not read the photo" }, { status: 502 });
  }
  return new Response(blob, {
    headers: {
      "Content-Type": blob.type || "application/octet-stream",
      "Cache-Control": "private, no-store",
    },
  });
}

// Stores a cut-out for the item, or records that none could be made so the
// browser does not keep retrying the same photo
export async function POST(request: Request) {
  const form = await request.formData();
  const id = form.get("id");
  if (typeof id !== "string" || !id) {
    return Response.json({ error: "id is required" }, { status: 400 });
  }

  const found = await ownedItem(id);
  if ("error" in found) return found.error;
  const { supabase, user, item } = found;

  if (form.get("failed") === "1") {
    const { error } = await supabase
      .from("wardrobe_items")
      .update({ ai_confidence: { ...(item.ai_confidence ?? {}), cutout_failed: true } })
      .eq("id", item.id)
      .eq("user_id", user.id);
    if (error) return Response.json({ error: "Could not record the result" }, { status: 500 });
    return Response.json({ ok: true });
  }

  const cutout = form.get("cutout");
  if (!(cutout instanceof File) || !isValidCutout(cutout)) {
    return Response.json({ error: "A PNG cut-out under 3 MB is required" }, { status: 400 });
  }

  const cutoutPath = `${user.id}/${randomUUID()}-cutout.png`;
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(cutoutPath, cutout, { contentType: "image/png" });
  if (uploadError) return Response.json({ error: "Upload failed" }, { status: 502 });

  const { error } = await supabase
    .from("wardrobe_items")
    .update({ cutout_path: cutoutPath })
    .eq("id", item.id)
    .eq("user_id", user.id);
  if (error) {
    await supabase.storage.from(BUCKET).remove([cutoutPath]);
    // 42703 or PGRST204: the item cut-outs migration has not been run yet
    const missingColumn = error.code === "42703" || error.code === "PGRST204";
    return Response.json({ error: "Could not save the cut-out" }, { status: missingColumn ? 503 : 500 });
  }

  // Replaced an older cut-out: remove it so no orphan stays in storage
  if (inUserFolder(item.cutout_path, user.id)) {
    await supabase.storage.from(BUCKET).remove([item.cutout_path]);
  }

  return Response.json({ ok: true, cutout_path: cutoutPath });
}
