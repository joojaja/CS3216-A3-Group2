import { generateObject } from "ai";
import { garmentLocationSchema } from "@/lib/schemas/ai";
import {
  getModel,
  imagePart,
  aiFailure,
  MODEL_ID,
  UNTRUSTED_CONTENT_RULE,
} from "@/lib/ai/gemini";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const PROMPT = `Locate the single most prominent clothing item in this photo.

Return its bounding box on a 0 to 1000 scale where (0, 0) is the top-left corner: ymin, xmin, ymax, xmax.

Rules:
- Include every part of the garment: sleeves, straps, collars and hems, and any pale or white fabric that blends into the surface behind it
- Exclude the surface it lies on, bedding, pillows, hangers, hands and other objects
- If there is no clothing item, set found to false and the box to zeros

${UNTRUSTED_CONTENT_RULE}`;

// Fallback for photos the on-device model cannot separate, typically a pale
// garment on a pale surface. The box lets the client crop to the item so the
// wardrobe tile at least frames the garment rather than the whole bed.
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

  if (!checkRateLimit(`locate:${user.id}`, 20, 60_000)) {
    return Response.json(
      { error: "Too many requests. Wait a moment and try again." },
      { status: 429 },
    );
  }

  const form = await request.formData();
  const file = form.get("image");

  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ error: "An image file is required" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type) || file.size > MAX_BYTES) {
    return Response.json(
      { error: "Invalid image. Use JPEG, PNG or WebP under 8 MB." },
      { status: 400 },
    );
  }

  try {
    const { object } = await generateObject({
      model: getModel(),
      schema: garmentLocationSchema,
      temperature: 0,
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: PROMPT }, await imagePart(file)],
        },
      ],
    });

    if (!object.found || object.ymax <= object.ymin || object.xmax <= object.xmin) {
      return Response.json({ found: false });
    }

    return Response.json({
      found: true,
      box: {
        ymin: object.ymin / 1000,
        xmin: object.xmin / 1000,
        ymax: object.ymax / 1000,
        xmax: object.xmax / 1000,
      },
    });
  } catch (error) {
    return aiFailure("locate", error, { model: MODEL_ID, key: "paid" });
  }
}
