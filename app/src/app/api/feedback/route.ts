import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const feedbackSchema = z.object({
  recommendation_id: z.uuid(),
  // dismissed is a skip in the daily feed, a weak signal rather than a rejection
  action: z.enum(["wore", "liked", "rejected", "dismissed"]),
  reason: z
    .enum([
      "too_warm",
      "too_formal",
      "too_casual",
      "uncomfortable",
      "disliked_colour_combination",
      "other",
    ])
    .optional(),
  free_text: z.string().max(500).optional(),
});

// Records feedback on an outfit recommendation. The recommendation row is
// only writable by its owner through RLS, so cross-user feedback fails.
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

  let input;
  try {
    input = feedbackSchema.parse(await request.json());
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const { data: rec } = await supabase
    .from("outfit_recommendations")
    .select("id")
    .eq("id", input.recommendation_id)
    .eq("user_id", user.id)
    .single();

  if (!rec) {
    return Response.json({ error: "Recommendation not found" }, { status: 404 });
  }

  const { error } = await supabase.from("recommendation_feedback").insert({
    user_id: user.id,
    recommendation_id: input.recommendation_id,
    action: input.action,
    reason: input.reason ?? null,
    free_text: input.free_text ?? null,
  });

  if (error) {
    return Response.json({ error: "Could not save feedback" }, { status: 500 });
  }

  return Response.json({ ok: true });
}
