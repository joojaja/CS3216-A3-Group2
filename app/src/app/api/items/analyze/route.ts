import { generateObject } from "ai";
import { clothingAttributesSchema } from "@/lib/schemas/ai";
import {
  getModel,
  imagePart,
  aiFailure,
  MODEL_ID,
} from "@/lib/ai/gemini";
import {
  CLOTHING_ANALYSIS_PROMPT,
  CLOTHING_ANALYSIS_PROMPT_VERSION,
} from "@/lib/ai/clothing-analysis-prompt";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { recordAiMeasurement } from "@/lib/ai/measurements";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
]);

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

  const modelStarted = performance.now();
  try {
    const { object, usage } = await generateObject({
      model: getModel(),
      schema: clothingAttributesSchema,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: CLOTHING_ANALYSIS_PROMPT },
            await imagePart(file),
          ],
        },
      ],
    });

    recordAiMeasurement({
      workflow: "attribute_extraction",
      promptVersion: CLOTHING_ANALYSIS_PROMPT_VERSION,
      model: MODEL_ID,
      keyTier: "paid",
      success: true,
      modelLatencyMs: Math.round(performance.now() - modelStarted),
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      totalTokens: usage.totalTokens,
      imageBytes: file.size,
      imageType: file.type,
    });

    return Response.json({ attributes: object });
  } catch (error) {
    recordAiMeasurement({
      workflow: "attribute_extraction",
      promptVersion: CLOTHING_ANALYSIS_PROMPT_VERSION,
      model: MODEL_ID,
      keyTier: "paid",
      success: false,
      modelLatencyMs: Math.round(performance.now() - modelStarted),
      imageBytes: file.size,
      imageType: file.type,
    });
    return aiFailure("analyze", error, { model: MODEL_ID, key: "paid" });
  }
}
