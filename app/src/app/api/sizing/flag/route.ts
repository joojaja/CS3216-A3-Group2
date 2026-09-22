import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

const flagSchema = z.object({
  chart_key: z.string().min(1).max(120),
  brand: z.string().min(1).max(80),
  category: z.enum(["top", "bottom", "dress", "footwear"]),
  source_type: z.enum(["product", "stored", "web"]),
  reason: z.enum(["wrong_brand", "wrong_product", "wrong_numbers", "other"]),
});

// Records a "wrong chart?" report. Holds the chart and brand only, never the
// user's measurements or the size they were shown.
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

  if (!checkRateLimit(`sizing-flag:${user.id}`, 10, 60_000)) {
    return Response.json({ error: "Too many requests. Wait a moment and try again." }, { status: 429 });
  }

  const parsed = flagSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const { error } = await supabase
    .from("size_chart_flags")
    .insert({ user_id: user.id, ...parsed.data });

  if (error) {
    console.error("[sizing:flag]", error.code);
    return Response.json({ error: "Could not send your report" }, { status: 500 });
  }

  return Response.json({ ok: true }, { status: 201 });
}
