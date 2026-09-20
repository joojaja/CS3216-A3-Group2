import { generateObject } from "ai";
import { z } from "zod";
import { outfitSelectionSchema } from "@/lib/schemas/ai";
import { getModel, reportAiError, UNTRUSTED_CONTENT_RULE } from "@/lib/ai/gemini";
import { getSingaporeForecast } from "@/lib/weather";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

const requestSchema = z.object({
  occasion_text: z.string().min(2).max(1000),
  requested_date: z.string().optional(),
  // The conversation so far, so a short follow-up such as "more formal" can
  // adjust the last outfits instead of being read as a new occasion
  previous: z
    .object({
      messages: z.array(z.string().max(1000)).max(6),
      outfits: z
        .array(
          z.object({
            item_ids: z.array(z.uuid()).max(8),
            explanation: z.string().max(1000),
          }),
        )
        .max(3),
    })
    .optional(),
});

type WardrobeRow = {
  id: string;
  category: string;
  subcategory: string | null;
  primary_colour: string | null;
  pattern: string | null;
  formality: string | null;
  weather_tags: string[];
};

// Recommends 1-3 outfits assembled only from the user's confirmed items.
// The model ranks and explains; it can only pick from the IDs we supply,
// and every returned ID is validated against the wardrobe before use.
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

  if (!checkRateLimit(`outfits:${user.id}`, 15, 60_000)) {
    return Response.json(
      { error: "Too many requests. Wait a moment and try again." },
      { status: 429 },
    );
  }

  let input;
  try {
    input = requestSchema.parse(await request.json());
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const { data: items } = await supabase
    .from("wardrobe_items")
    .select(
      "id, category, subcategory, primary_colour, pattern, formality, weather_tags",
    )
    .eq("user_id", user.id)
    .eq("attributes_confirmed", true);

  const { data: profile } = await supabase
    .from("user_profiles")
    .select(
      "preferred_styles, preferred_colours, disliked_colours, preference_notes",
    )
    .eq("user_id", user.id)
    .single();

  const forecast = await getSingaporeForecast();

  if (!items || items.length === 0) {
    return Response.json(
      { error: "Add some confirmed wardrobe items first." },
      { status: 400 },
    );
  }

  const itemList = (items as WardrobeRow[])
    .map(
      (item) =>
        `- ${item.id}: ${item.primary_colour ?? "unknown"} ${item.pattern ?? ""} ${item.subcategory ?? item.category} (formality: ${item.formality ?? "unknown"}, weather: ${item.weather_tags.join(", ") || "unknown"})`,
    )
    .join("\n");

  const previous = input.previous;
  const conversation = previous
    ? `Earlier messages from the user in this conversation, oldest first:
${previous.messages.map((message, i) => `${i + 1}. "${message}"`).join("\n")}

Outfits you suggested most recently:
${
  previous.outfits.length
    ? previous.outfits
        .map((outfit, i) => `${i + 1}. items ${outfit.item_ids.join(", ")}: ${outfit.explanation}`)
        .join("\n")
    : "none"
}

New message from the user: "${input.occasion_text}"
If the new message adjusts the earlier request (for example "more formal", "not the sneakers", "show another option"), keep the earlier occasion and apply the adjustment. If it describes a different occasion, plan for that instead. Do not repeat an outfit you already suggested unless asked to.`
    : `Occasion request from the user: "${input.occasion_text}"`;

  const prompt = `You are the outfit recommendation engine for a wardrobe app used in Singapore. You only ever answer by choosing outfits from the user's own wardrobe.

${conversation}
Requested date: ${input.requested_date ?? "not specified"}
Singapore forecast: ${forecast?.summary ?? "unavailable, assume hot and humid tropical weather with possible rain"}
User preferences: ${JSON.stringify(profile ?? {})}

Available wardrobe items (id: description):
${itemList}

Rules:
- If the message is not a request to choose or adjust an outfit from this wardrobe (for example general fashion questions, shopping advice, requests to buy things, or unrelated topics), set is_outfit_request to false, return no outfits, and write one short plain sentence in decline_message saying you can only plan outfits from their wardrobe and inviting them to describe an occasion
- Otherwise set is_outfit_request to true, leave decline_message empty and return between 1 and 3 complete outfits
- You may only use item IDs from the list above. Never invent IDs
- A complete outfit covers the body: typically a top and bottom plus footwear, or a dress plus footwear
- Penalize heavy or warm items when the forecast is hot; flag rain risk where relevant
- Prefer the user's preferred colours and styles; avoid disliked colours
- In explanation, say briefly why the outfit fits the occasion and weather
- In warnings, note honest caveats such as missing footwear or a weak formality match

${UNTRUSTED_CONTENT_RULE}`;

  try {
    const { object } = await generateObject({
      model: getModel(),
      schema: outfitSelectionSchema,
      prompt,
    });

    if (!object.is_outfit_request) {
      return Response.json({
        declined: true,
        message:
          object.decline_message.trim() ||
          "I can only plan outfits from your wardrobe. Describe an occasion and I will suggest something.",
      });
    }

    const validIds = new Set((items as WardrobeRow[]).map((item) => item.id));
    const outfits = object.outfits
      .map((outfit) => ({
        ...outfit,
        item_ids: outfit.item_ids.filter((id) => validIds.has(id)),
      }))
      .filter((outfit) => outfit.item_ids.length > 0);

    if (outfits.length === 0) {
      return Response.json(
        { error: "Could not build an outfit from your wardrobe. Add more items." },
        { status: 422 },
      );
    }

    const { data: outfitRequest } = await supabase
      .from("outfit_requests")
      .insert({
        user_id: user.id,
        occasion_text: input.occasion_text,
        requested_date: input.requested_date ?? null,
        weather_snapshot: forecast ?? null,
      })
      .select("id")
      .single();

    const recommendations = [];
    for (const outfit of outfits) {
      const { data: rec } = await supabase
        .from("outfit_recommendations")
        .insert({
          request_id: outfitRequest?.id,
          user_id: user.id,
          wardrobe_item_ids: outfit.item_ids,
          explanation: outfit.explanation,
          warnings: outfit.warnings,
        })
        .select("id")
        .single();

      recommendations.push({
        id: rec?.id ?? null,
        item_ids: outfit.item_ids,
        explanation: outfit.explanation,
        warnings: outfit.warnings,
      });
    }

    const itemsById = Object.fromEntries(
      (items as WardrobeRow[]).map((item) => [item.id, item]),
    );

    return Response.json({
      recommendations,
      items: itemsById,
      weather: forecast?.summary ?? null,
    });
  } catch (error) {
    return Response.json({ error: reportAiError("outfits", error) }, { status: 502 });
  }
}
