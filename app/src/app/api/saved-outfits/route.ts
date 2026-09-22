import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({ recommendation_id: z.uuid() });

async function signedInUser() {
  const supabase = await createClient();
  if (!supabase) {
    return { error: Response.json({ error: "Service is not configured" }, { status: 503 }) };
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (!checkRateLimit(`saved-outfits:${user.id}`, 60, 60_000)) {
    return {
      error: Response.json(
        { error: "Too many requests. Wait a moment and try again." },
        { status: 429 },
      ),
    };
  }
  return { supabase, user };
}

// Saves an outfit from the planner or the daily feed. Saving the same
// outfit twice does nothing. The recommendation must belong to the signed-in
// user; RLS enforces the same rule as a backstop.
export async function POST(request: Request) {
  const auth = await signedInUser();
  if ("error" in auth) return auth.error;
  const { supabase, user } = auth;

  let input;
  try {
    input = bodySchema.parse(await request.json());
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const { data: rec } = await supabase
    .from("outfit_recommendations")
    .select("id")
    .eq("id", input.recommendation_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!rec) {
    return Response.json({ error: "Outfit not found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("saved_outfits")
    .upsert(
      { user_id: user.id, recommendation_id: input.recommendation_id },
      { onConflict: "user_id,recommendation_id", ignoreDuplicates: true },
    );
  if (error) {
    console.error("[saved-outfits:save]", error.code);
    return Response.json({ error: "Could not save the outfit" }, { status: 500 });
  }

  return Response.json({ ok: true });
}

// Removes a saved outfit, keyed by its recommendation so the planner, the
// daily feed and the saved page can all undo a save the same way
export async function DELETE(request: Request) {
  const auth = await signedInUser();
  if ("error" in auth) return auth.error;
  const { supabase, user } = auth;

  const parsed = bodySchema.safeParse({
    recommendation_id: new URL(request.url).searchParams.get("recommendation_id"),
  });
  if (!parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const { error } = await supabase
    .from("saved_outfits")
    .delete()
    .eq("user_id", user.id)
    .eq("recommendation_id", parsed.data.recommendation_id);
  if (error) {
    console.error("[saved-outfits:remove]", error.code);
    return Response.json({ error: "Could not remove the outfit" }, { status: 500 });
  }

  return Response.json({ ok: true });
}
