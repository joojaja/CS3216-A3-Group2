"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useToast } from "@/components/toast";
import { trackFunnel } from "@/lib/analytics";
import type { StyleGrouping } from "@/lib/style/archetypes";

export type StyleThumb = { id: string; name: string; imageUrl: string | null; hex: string };

const THUMBS_SHOWN = 6;

const METHOD = {
  ai: "Wearabouts sent the tags you confirmed for each item (category, colour, pattern, formality and material notes) to an AI model, which grouped your items into styles and named them. The app checks every item in its answer and works out the percentages itself. Your photos are never sent.",
  rules:
    "Items are grouped by four tags you confirmed: formality, whether the main colour is neutral, whether the item is patterned, and whether it is activewear. Groups with very few items join the closest one.",
};

// The style half of My Style. The server renders the rule groups straight
// away. When `refine` is set, the AI grouping is fetched after the page
// shows and swapped in; the page never waits on the model.
export function StyleArchetypes({
  initial,
  thumbs,
  itemCount,
  preferredStyles,
  refine,
  aiAvailable,
}: {
  initial: StyleGrouping;
  thumbs: Record<string, StyleThumb>;
  itemCount: number;
  preferredStyles: string[];
  refine: boolean;
  aiAvailable: boolean;
}) {
  const [grouping, setGrouping] = useState(initial);
  const [busy, setBusy] = useState<"refining" | "regrouping" | null>(refine ? "refining" : null);
  const [showMethod, setShowMethod] = useState(false);
  const { toast } = useToast();
  const reduceMotion = useReducedMotion();
  const started = useRef(false);

  useEffect(() => {
    if (!refine || started.current) return;
    started.current = true;
    fetch("/api/style/archetypes")
      .then((response) => (response.ok ? response.json() : null))
      .then((result: StyleGrouping | null) => {
        if (result?.archetypes?.length) setGrouping(result);
      })
      // The rule groups already on screen are a complete answer
      .catch(() => {})
      .finally(() => setBusy(null));
  }, [refine]);

  async function regroup() {
    setBusy("regrouping");
    try {
      const response = await fetch("/api/style/archetypes", { method: "POST" });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.archetypes?.length) {
        toast(result?.error ?? "Could not regroup your styles. Try again later.");
        return;
      }
      setGrouping(result);
      trackFunnel("style_regrouped");
      if (result.source === "rules") toast("The AI could not group your styles, so these are grouped by tags.");
    } catch {
      toast("Could not regroup your styles. Check your connection and try again.");
    } finally {
      setBusy(null);
    }
  }

  const [top] = grouping.archetypes;
  if (!top) return null;

  return (
    <section aria-labelledby="style-heading">
      <p className="text-xs font-medium tracking-[0.08em] text-mute uppercase">Your main style</p>
      <div className="mt-1 flex items-start gap-3">
        <h2 id="style-heading" className="text-[28px] leading-tight font-bold tracking-tight md:text-[38px]">
          {top.name}
        </h2>
        <button
          type="button"
          onClick={() => setShowMethod((open) => !open)}
          aria-expanded={showMethod}
          aria-controls="style-method"
          aria-label="How your styles are worked out"
          className="mt-1.5 grid size-11 shrink-0 place-items-center rounded-full text-cobalt hover:bg-cobalt-light md:mt-3"
        >
          <span className="grid size-6 place-items-center rounded-full bg-cobalt text-[13px] font-bold text-white">i</span>
        </button>
      </div>
      <p className="mt-1 max-w-[60ch] text-[15px] text-body">{top.description}</p>

      {showMethod && (
        <div id="style-method" className="mt-3 max-w-[64ch] rounded-xl bg-ink px-4 py-3.5 text-[13.5px] leading-relaxed text-white">
          {METHOD[grouping.source]}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] text-mute">
        <span>
          {grouping.source === "ai" ? "Grouped by AI from your confirmed tags" : "Grouped by colour, pattern and formality"}
          {` · ${itemCount} ${itemCount === 1 ? "item" : "items"}`}
        </span>
        <span aria-live="polite">
          {busy && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cobalt-light px-2.5 py-1 text-xs text-cobalt">
              <span className="size-1.5 animate-pulse rounded-full bg-cobalt" />
              {busy === "refining" ? "Refining your styles" : "Regrouping"}
            </span>
          )}
        </span>
      </div>

      {preferredStyles.length > 0 && (
        <p className="mt-4 max-w-[64ch] rounded-xl border border-line bg-[#fcfbf7] px-4 py-3 text-[13.5px] text-body">
          You described your style as {preferredStyles.join(", ")}.{" "}
          {top.percent === 100 ? "All" : "Most"} of your wardrobe reads as {top.name.toLowerCase()}.
        </p>
      )}

      <ul className="mt-6 grid gap-5">
        {grouping.archetypes.map((archetype, index) => {
          const shown = archetype.itemIds.slice(0, THUMBS_SHOWN);
          const hidden = archetype.itemIds.length - shown.length;
          return (
            <li key={`${archetype.name}-${index}`}>
              <div className="flex items-baseline justify-between gap-3">
                <b className="text-[15px] font-semibold">{archetype.name}</b>
                <span className="text-[15px] font-semibold tabular-nums">{archetype.percent}%</span>
              </div>
              {index > 0 && <p className="mt-0.5 text-[13px] text-mute">{archetype.description}</p>}
              <div
                className="mt-2 h-2.5 overflow-hidden rounded-full bg-wash"
                role="img"
                aria-label={`${archetype.percent}% of your items`}
              >
                <motion.div
                  className={`h-full rounded-full ${index === 0 ? "bg-cobalt" : "bg-cobalt/45"}`}
                  initial={reduceMotion ? false : { width: 0 }}
                  animate={{ width: `${archetype.percent}%` }}
                  transition={{ duration: 0.7, delay: index * 0.08, ease: [0.2, 0.8, 0.3, 1] }}
                />
              </div>
              <ul className="mt-2.5 flex flex-wrap gap-1.5" aria-label={`Items in ${archetype.name}`}>
                {shown.map((id) => {
                  const thumb = thumbs[id];
                  return (
                    <li key={id}>
                      <Link
                        href={`/wardrobe/${id}`}
                        title={thumb?.name}
                        aria-label={thumb?.name ?? "Wardrobe item"}
                        className="block size-12 overflow-hidden rounded-lg border border-line bg-white hover:border-cobalt md:size-14"
                      >
                        {thumb?.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={thumb.imageUrl} alt="" className="size-full object-cover" />
                        ) : (
                          <span className="block size-full" style={{ background: thumb?.hex ?? "#eae9e1" }} />
                        )}
                      </Link>
                    </li>
                  );
                })}
                {hidden > 0 && (
                  <li className="grid size-12 place-items-center rounded-lg bg-wash text-xs text-mute md:size-14">
                    +{hidden}
                  </li>
                )}
              </ul>
            </li>
          );
        })}
      </ul>

      {aiAvailable && (
        <button
          type="button"
          onClick={regroup}
          disabled={busy !== null}
          className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg border border-line px-4 text-sm font-medium text-cobalt transition hover:border-cobalt disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="size-4" aria-hidden>
            <path d="M20 12a8 8 0 01-14.3 4.9M4 12a8 8 0 0114.3-4.9M18 3v4h-4M6 21v-4h4" />
          </svg>
          Regroup with AI
        </button>
      )}
    </section>
  );
}
