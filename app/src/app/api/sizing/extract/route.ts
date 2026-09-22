import { generateObject } from "ai";
import { sizingExtractionSchema } from "@/lib/schemas/ai";
import { MODEL_ID, getModel, imagePart, reportAiError, UNTRUSTED_CONTENT_RULE } from "@/lib/ai/gemini";
import { validateImage } from "@/lib/image/validate";
import { createClient } from "@/lib/supabase/server";
import { checkDailyLimit, checkRateLimit } from "@/lib/rate-limit";
import { toPurchaseContext } from "@/lib/sizing/extraction";
import { mockExtraction } from "@/lib/sizing/mock-extraction";
import { EXTRACTIONS_PER_MINUTE, FREE_DAILY_EXTRACTIONS, SIZING_EXTRACT_PROMPT } from "@/lib/sizing/prompts";

// Reads a shopping screenshot into a PurchaseContext: brand, product,
// category and any size chart on screen. This is the only sizing step that
// calls a model, and it is on the paid key because it sends a user's image.
// The image is held in memory for the call and never stored. The model only
// fills a schema of enums, numbers and short strings, which toPurchaseContext
// cleans and validates; the size itself is matched later in code.
export async function POST(request: Request) {
  // Local testing without a paid call. Never active in production builds
  if (process.env.NODE_ENV === "development" && process.env.SIZING_EXTRACT_MOCK === "1") {
    const check = validateImage((await request.formData()).get("image"));
    if (!check.ok) return Response.json({ error: check.error }, { status: 400 });
    await new Promise((r) => setTimeout(r, 900));
    return Response.json({ context: toPurchaseContext(mockExtraction(check.file.name)), mock: true });
  }

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

  if (!checkRateLimit(`sizing-extract:${user.id}`, EXTRACTIONS_PER_MINUTE, 60_000)) {
    return Response.json({ error: "Too many requests. Wait a moment and try again." }, { status: 429 });
  }

  const check = validateImage((await request.formData()).get("image"));
  if (!check.ok) return Response.json({ error: check.error }, { status: 400 });

  // Counted after validation so a rejected upload does not use up the day
  if (!checkDailyLimit(`sizing-extract:${user.id}`, FREE_DAILY_EXTRACTIONS)) {
    return Response.json(
      { error: `You have read ${FREE_DAILY_EXTRACTIONS} screenshots today. Pick the brand by hand, or try again tomorrow.` },
      { status: 429 },
    );
  }

  try {
    const started = Date.now();
    const { object, usage } = await generateObject({
      model: getModel("paid"),
      schema: sizingExtractionSchema,
      abortSignal: request.signal,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: `${SIZING_EXTRACT_PROMPT}\n\n${UNTRUSTED_CONTENT_RULE}` },
            await imagePart(check.file),
          ],
        },
      ],
    });
    // Timing and token count only. Never the image, the brand or the user
    console.log(`[ai:sizing-extract] ${MODEL_ID} ${Date.now() - started}ms tokens=${usage.totalTokens ?? "?"}`);

    return Response.json({ context: toPurchaseContext(object) });
  } catch (error) {
    return Response.json({ error: reportAiError("sizing-extract", error) }, { status: 502 });
  }
}
