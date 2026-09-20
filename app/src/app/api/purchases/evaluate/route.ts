import { generateObject } from "ai";
import {
  clothingAttributesSchema,
  purchaseEvaluationSchema,
} from "@/lib/schemas/ai";
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
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
]);

const EXTRACT_PROMPT = `Extract the clothing attributes of the item in this product photo or screenshot using the required schema.

Rules:
- Use only the enum values provided by the schema
- Do not guess exact fabric composition; describe visible cues only
- State your uncertainty in confidence_notes

${UNTRUSTED_CONTENT_RULE}`;

type WardrobeRow = {
  id: string;
  category: string;
  subcategory: string | null;
  primary_colour: string | null;
  secondary_colours: string[];
  pattern: string | null;
  formality: string | null;
};

function similarity(
  attrs: { category: string; primary_colour: string },
  item: WardrobeRow,
): number {
  let score = 0;
  if (item.category === attrs.category) score += 0.6;
  if (
    item.primary_colour?.toLowerCase() === attrs.primary_colour.toLowerCase()
  ) {
    score += 0.3;
  } else if (
    item.secondary_colours
      .map((c) => c.toLowerCase())
      .includes(attrs.primary_colour.toLowerCase())
  ) {
    score += 0.15;
  }
  return score;
}

// Two-step evaluation: extract attributes from the prospective purchase,
// then judge redundancy against the user's wardrobe. Deterministic
// similarity is computed in code; the model only explains the evidence.
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

  if (!checkRateLimit(`evaluate:${user.id}`, 15, 60_000)) {
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
      { error: "Invalid image. Use JPEG, PNG, WebP or HEIC under 8 MB." },
      { status: 400 },
    );
  }


  const { data: items } = await supabase
    .from("wardrobe_items")
    .select(
      "id, category, subcategory, primary_colour, secondary_colours, pattern, formality",
    )
    .eq("user_id", user.id)
    .eq("attributes_confirmed", true);

  try {
    const { object: attrs } = await generateObject({
      model: getModel(),
      schema: clothingAttributesSchema,
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: EXTRACT_PROMPT }, await imagePart(file)],
        },
      ],
    });

    const scored = ((items ?? []) as WardrobeRow[])
      .map((item) => ({ item, score: similarity(attrs, item) }))
      .sort((a, b) => b.score - a.score);

    const similar = scored.filter((entry) => entry.score >= 0.6);
    const sameCategoryCount = scored.filter(
      (entry) => entry.item.category === attrs.category,
    ).length;

    const evidencePrompt = `You are the purchase evaluation engine for a wardrobe app. A user in Singapore is considering buying an item.

Extracted attributes of the prospective purchase:
${JSON.stringify(attrs)}

Deterministic evidence computed by the application:
- Items in the same category already owned: ${sameCategoryCount}
- Strongly similar items (same category and colour): ${similar.map((entry) => `${entry.item.id} (${entry.item.primary_colour} ${entry.item.subcategory ?? entry.item.category})`).join(", ") || "none"}
- Total wardrobe size: ${(items ?? []).length}

The user's wardrobe items (id: description):
${(items as WardrobeRow[] | null)?.map((item) => `- ${item.id}: ${item.primary_colour ?? "?"} ${item.pattern ?? ""} ${item.subcategory ?? item.category}`).join("\n") || "wardrobe is empty"}

Rules:
- Pick the most honest decision_label. Use insufficient_information when evidence is thin
- similar_item_ids may only contain IDs from the wardrobe list
- Explain the evidence plainly; the final decision stays with the user
- Singapore context: flag items poorly suited to hot humid weather

${UNTRUSTED_CONTENT_RULE}`;

    const { object: verdict } = await generateObject({
      model: getModel(),
      schema: purchaseEvaluationSchema,
      prompt: evidencePrompt,
    });

    const validIds = new Set(((items ?? []) as WardrobeRow[]).map((i) => i.id));
    const similarIds = verdict.similar_item_ids.filter((id) =>
      validIds.has(id),
    );

    await supabase.from("purchase_evaluations").insert({
      user_id: user.id,
      extracted_attributes: attrs,
      similar_wardrobe_item_ids: similarIds,
      compatibility_score: verdict.compatibility_score,
      redundancy_score: verdict.redundancy_score,
      decision_label: verdict.decision_label,
      explanation: verdict.explanation,
    });

    return Response.json({
      attributes: attrs,
      evaluation: { ...verdict, similar_item_ids: similarIds },
      similar_items: similarIds
        .map((id) => (items as WardrobeRow[] | null)?.find((i) => i.id === id))
        .filter(Boolean),
    });
  } catch (error) {
    return aiFailure("evaluate", error, { model: MODEL_ID, key: "paid" });
  }
}
