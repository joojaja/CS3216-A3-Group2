import { generateText } from "ai";
import {
  getImageModel,
  IMAGE_MODEL_ID,
  imagePart,
  aiFailure,
  UNTRUSTED_CONTENT_RULE,
} from "@/lib/ai/gemini";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export type EnhanceMode = "isolate" | "iron";

// Both prompts insist on fidelity. The model can still change small details
// such as printed text, which is why the UI keeps the original selectable
// and says so.
const PROMPTS: Record<EnhanceMode, string> = {
  isolate: `Cut out the single clothing item in this photo and place it centred on a plain pure white background, filling most of a square frame.

Keep the garment exactly as it appears: the same colours, print, logo, lettering, stripes, fabric texture, wrinkles and shape. Remove everything else, including any bedsheet, pillow, floor, hands or hangers. Do not add, remove or redesign any part of the garment.`,
  iron: `Show this exact clothing item laid perfectly flat and smooth on a plain pure white background, centred and filling most of a square frame, like a product photo in an online shop.

Remove wrinkles and folds and even out the lighting, but keep the same colours, print, logo, lettering, stripes, proportions and neckline. Do not add, remove or redesign any part of the garment, and do not change its colour.`,
};

// Sends the photo to the image model and returns the edited image as
// binary. Costs real money per call, so the limit is tighter than analysis.
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

  if (!checkRateLimit(`enhance:${user.id}`, 10, 60_000)) {
    return Response.json(
      { error: "Too many image edits. Wait a minute and try again." },
      { status: 429 },
    );
  }

  const form = await request.formData();
  const file = form.get("image");
  const mode = form.get("mode");

  if (mode !== "isolate" && mode !== "iron") {
    return Response.json({ error: "mode must be isolate or iron" }, { status: 400 });
  }
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
    const started = Date.now();
    const result = await generateText({
      model: getImageModel(),
      providerOptions: { google: { responseModalities: ["IMAGE", "TEXT"] } },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: `${PROMPTS[mode]}\n\n${UNTRUSTED_CONTENT_RULE}` },
            await imagePart(file),
          ],
        },
      ],
    });

    const image = result.files.find((f) => f.mediaType.startsWith("image/"));
    if (!image) {
      console.error(`[ai:enhance] ${IMAGE_MODEL_ID} returned no image for mode=${mode}`);
      return Response.json(
        { error: "The model did not return an image. Try again or use another version." },
        { status: 502 },
      );
    }

    console.log(
      `[ai:enhance] ${IMAGE_MODEL_ID} ${mode} ${Date.now() - started}ms tokens=${result.usage.totalTokens ?? "?"}`,
    );

    return new Response(new Uint8Array(image.uint8Array), {
      status: 200,
      headers: {
        "Content-Type": image.mediaType,
        "Cache-Control": "no-store",
        "X-Enhance-Mode": mode,
      },
    });
  } catch (error) {
    return aiFailure("enhance", error, { model: IMAGE_MODEL_ID, key: "paid", mode });
  }
}
