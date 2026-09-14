import { generateObject } from "ai";
import { clothingAttributesSchema } from "@/lib/schemas/ai";
import { getModel, UNTRUSTED_CONTENT_RULE } from "@/lib/ai/gemini";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
]);

const PROMPT = `You are a clothing attribute extractor for a digital wardrobe app used in Singapore.

Look at the photograph and describe the single most prominent clothing item using the required schema.

Rules:
- Use only the enum values provided by the schema for category, formality, layering_role and weather_tags
- weather_tags must reflect Singapore's tropical climate (hot, humid, frequent rain, strong indoor air-conditioning)
- Do not guess exact fabric composition. Describe visible material cues only (e.g. "looks like knit", "sheen suggests satin")
- In confidence_notes, state what you are unsure about (e.g. colour accuracy in poor lighting, whether it is a dress or a long top)
- If the image shows multiple garments, describe the most prominent one and say so in confidence_notes

${UNTRUSTED_CONTENT_RULE}`;

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

  if (!checkRateLimit(`analyze:${user.id}`, 20, 60_000)) {
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
  if (!ALLOWED_TYPES.has(file.type)) {
    return Response.json(
      { error: "Unsupported image type. Use JPEG, PNG, WebP or HEIC." },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return Response.json(
      { error: "Image is too large. Maximum size is 8 MB." },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const dataUrl = `data:${file.type};base64,${buffer.toString("base64")}`;

  try {
    const { object } = await generateObject({
      model: getModel(),
      schema: clothingAttributesSchema,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: PROMPT },
            { type: "image", image: dataUrl },
          ],
        },
      ],
    });

    return Response.json({ attributes: object });
  } catch {
    return Response.json(
      { error: "Analysis failed. Please try again." },
      { status: 502 },
    );
  }
}
