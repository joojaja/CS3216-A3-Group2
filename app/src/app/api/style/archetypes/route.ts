import { generateObject } from "ai";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getModel, MODEL_ID, reportAiError } from "@/lib/ai/gemini";
import { styleGroupsSchema } from "@/lib/schemas/ai";
import { createClient } from "@/lib/supabase/server";
import { checkDailyLimit, checkRateLimit } from "@/lib/rate-limit";
import { ruleArchetypes, styleItems, type StyleGrouping, type StyleItem } from "@/lib/style/archetypes";
import { buildStylePrompt, orderStyleItems, STYLE_PROMPT_VERSION, wardrobeHash } from "@/lib/style/archetype-prompt";
import { validateStyleGroups } from "@/lib/style/validate-archetypes";
import { cachedGroupingFor, loadStyleData, readStyleCache, writeStyleCache } from "@/lib/style/server";

// A slow model should not keep the "Refining" indicator up for long
const MODEL_TIMEOUT_MS = 15000;
const REGROUPS_PER_DAY = 5;

// One grouping per user and wardrobe at a time on this instance, so a double
// page load does not make two model calls
const generating = new Map<string, Promise<StyleGrouping>>();

// Text only, so it runs on the free-tier key and never touches the paid one.
// One repair retry when the answer fails validation, as AGENTS.md asks; a
// provider error goes straight to the rule groups
async function groupWithModel(
  items: StyleItem[],
  preferredStyles: string[],
  previousNames?: string[],
): Promise<StyleGrouping> {
  let repairReason: string | undefined;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const prompt = buildStylePrompt({ items, preferredStyles, previousNames, repairReason });
    const started = Date.now();
    try {
      const { object, usage } = await generateObject({
        model: getModel("free"),
        schema: styleGroupsSchema,
        prompt,
        abortSignal: AbortSignal.timeout(MODEL_TIMEOUT_MS),
      });
      console.log(
        `[ai:style] ${MODEL_ID} key=free prompt=${STYLE_PROMPT_VERSION} attempt=${attempt} ${Date.now() - started}ms tokens=${usage.totalTokens ?? "?"}`,
      );
      const result = validateStyleGroups(object, items);
      if (result.ok) return { archetypes: result.archetypes, source: "ai" };
      console.warn(`[ai:style] answer failed validation: ${result.reason}`);
      repairReason = result.reason;
    } catch (error) {
      reportAiError("style", error, {
        model: MODEL_ID,
        key: "free",
        ms: Date.now() - started,
        items: items.length,
        attempt,
      });
      break;
    }
  }
  return { archetypes: ruleArchetypes(items), source: "rules" };
}

type Context =
  | { error: Response }
  | {
      supabase: SupabaseClient;
      userId: string;
      items: StyleItem[];
      preferredStyles: string[];
      hash: string;
    };

async function context(): Promise<Context> {
  const supabase = await createClient();
  if (!supabase) return { error: Response.json({ error: "Service is not configured" }, { status: 503 }) };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: Response.json({ error: "Unauthorized" }, { status: 401 }) };

  const data = await loadStyleData(supabase, user.id);
  if (!data) return { error: Response.json({ error: "Could not read your wardrobe." }, { status: 500 }) };

  const items = orderStyleItems(styleItems(data.items));
  return { supabase, userId: user.id, items, preferredStyles: data.preferredStyles, hash: wardrobeHash(items) };
}

// The grouping for the current wardrobe: from the cache when the wardrobe has
// not changed, otherwise from the model, checked and then cached
export async function GET() {
  const ctx = await context();
  if ("error" in ctx) return ctx.error;
  const { supabase, userId, items, preferredStyles, hash } = ctx;
  if (items.length === 0) return Response.json({ archetypes: [], source: "rules" });

  const cached = cachedGroupingFor(await readStyleCache(supabase, userId), items);
  if (cached) return Response.json(cached);

  // Past the limit the rule groups are still a full answer; they are just
  // not cached, so the AI is tried again on a later view
  if (!checkRateLimit(`style:${userId}`, 6, 60_000)) {
    return Response.json({ archetypes: ruleArchetypes(items), source: "rules" });
  }

  const key = `${userId}:${hash}`;
  let pending = generating.get(key);
  if (!pending) {
    pending = groupWithModel(items, preferredStyles).finally(() => generating.delete(key));
    generating.set(key, pending);
  }
  const grouping = await pending;
  await writeStyleCache(supabase, userId, hash, grouping);
  return Response.json(grouping);
}

// Regroup: a fresh model call even when the wardrobe has not changed, asking
// for a different grouping from the last one. Limited per day
export async function POST() {
  const ctx = await context();
  if ("error" in ctx) return ctx.error;
  const { supabase, userId, items, preferredStyles, hash } = ctx;
  if (items.length === 0) {
    return Response.json({ error: "Add a confirmed item first." }, { status: 400 });
  }

  if (!checkRateLimit(`style:${userId}`, 6, 60_000)) {
    return Response.json({ error: "Too many requests. Wait a moment and try again." }, { status: 429 });
  }
  if (!checkDailyLimit(`style-regroup:${userId}`, REGROUPS_PER_DAY)) {
    return Response.json(
      { error: `You can regroup ${REGROUPS_PER_DAY} times a day. Try again tomorrow.` },
      { status: 429 },
    );
  }

  const previous = cachedGroupingFor(await readStyleCache(supabase, userId), items);
  const previousNames =
    previous?.source === "ai" ? previous.archetypes.map((archetype) => archetype.name) : undefined;

  const grouping = await groupWithModel(items, preferredStyles, previousNames);

  // A failed regroup keeps the AI grouping the user already has
  if (grouping.source === "rules" && previous?.source === "ai") {
    return Response.json(
      { error: "The AI could not regroup your styles right now. Your current grouping is unchanged." },
      { status: 503 },
    );
  }
  await writeStyleCache(supabase, userId, hash, grouping);
  return Response.json(grouping);
}
