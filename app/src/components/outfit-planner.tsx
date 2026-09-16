"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { GarmentIcon, tintFor } from "@/components/garment-icon";
import { useToast } from "@/components/toast";

type RecommendedItem = {
  id: string;
  category: string;
  subcategory: string | null;
  primary_colour: string | null;
};

type Recommendation = {
  id: string | null;
  item_ids: string[];
  explanation: string;
  warnings: string[];
};

const FEEDBACK_REASONS = [
  { value: "too_warm", label: "Too warm" },
  { value: "too_formal", label: "Too formal" },
  { value: "too_casual", label: "Too casual" },
  { value: "uncomfortable", label: "Uncomfortable" },
  { value: "disliked_colour_combination", label: "Bad colour combo" },
  { value: "other", label: "Other" },
] as const;

type Reason = (typeof FEEDBACK_REASONS)[number]["value"];

const inputClass =
  "mt-1.5 block w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm font-normal transition focus:border-cobalt focus:outline-none focus:ring-[3px] focus:ring-cobalt-light";

export function OutfitPlanner() {
  const { toast } = useToast();
  const [occasion, setOccasion] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weather, setWeather] = useState<string | null>(null);
  const [items, setItems] = useState<Record<string, RecommendedItem>>({});
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [sentFeedback, setSentFeedback] = useState<Record<string, string>>({});
  // Which recommendation has the reason sheet open, and what is ticked
  const [sheetFor, setSheetFor] = useState<string | null>(null);
  const [reasons, setReasons] = useState<Set<Reason>>(new Set());

  async function recommend() {
    setLoading(true);
    setError(null);
    setSheetFor(null);

    const res = await fetch("/api/outfits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        occasion_text: occasion,
        requested_date: date || undefined,
      }),
    });
    const body = await res.json();

    setLoading(false);

    if (!res.ok) {
      setError(body.error ?? "Recommendation failed");
      return;
    }

    setRecs(body.recommendations);
    setItems(body.items);
    setWeather(body.weather);
  }

  async function sendFeedback(
    recommendationId: string | null,
    action: "wore" | "liked" | "rejected",
    picked?: Reason[],
  ) {
    if (!recommendationId) return;

    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recommendation_id: recommendationId,
        action,
        reason: picked?.[0],
        free_text:
          picked && picked.length > 1
            ? FEEDBACK_REASONS.filter((r) => picked.includes(r.value))
                .map((r) => r.label)
                .join(", ")
            : undefined,
      }),
    });

    if (res.ok) {
      setSentFeedback((prev) => ({ ...prev, [recommendationId]: action }));
      setSheetFor(null);
      setReasons(new Set());
      toast(action === "wore" ? "Marked as worn" : "Feedback recorded");
    } else {
      toast("Could not save feedback");
    }
  }

  function toggleReason(value: Reason) {
    setReasons((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  const sheetRec = recs.find((r) => r.id === sheetFor);
  const sheetIndex = sheetRec ? recs.indexOf(sheetRec) + 1 : 0;

  return (
    <div className="relative grid gap-6 md:grid-cols-[360px_1fr] md:items-start">
      <div className="grid gap-3.5 md:sticky md:top-0">
        <label className="block text-[13.5px] font-medium">
          Describe the occasion
          <textarea
            value={occasion}
            onChange={(e) => setOccasion(e.target.value)}
            rows={4}
            placeholder="Casual outdoor birthday lunch tomorrow afternoon"
            className={inputClass}
          />
        </label>
        <label className="block text-[13.5px] font-medium">
          Date (optional)
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </label>
        <div>
          <button
            onClick={recommend}
            disabled={loading || occasion.trim().length < 3}
            className="rounded-lg bg-cobalt px-4 py-2.5 text-sm font-medium text-white transition hover:bg-cobalt-deep disabled:opacity-40"
          >
            {loading ? "Building outfits..." : "Suggest outfits"}
          </button>
        </div>
        {error && <p className="text-sm text-bad">{error}</p>}
      </div>

      <div className="grid gap-3.5">
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-3.5">
            <p className="flex items-center gap-3 text-sm text-mute">
              <span className="size-[18px] animate-spin rounded-full border-[2.5px] border-line border-t-cobalt" />
              Building outfits from your confirmed items.
            </p>
            <div className="grid gap-3.5 rounded-xl border border-line p-5">
              <div className="shim h-3.5 w-1/3" />
              <div className="flex gap-3">
                <div className="shim aspect-[3/4] w-full max-w-[120px]" />
                <div className="shim aspect-[3/4] w-full max-w-[120px]" />
                <div className="shim aspect-[3/4] w-full max-w-[120px]" />
              </div>
              <div className="shim h-10" />
            </div>
          </motion.div>
        )}

        {!loading && weather && (
          <p className="rounded-lg bg-wash px-3.5 py-2.5 text-[13.5px] text-mute">
            Singapore forecast used: {weather}
          </p>
        )}

        {!loading &&
          recs.map((rec, index) => {
            const feedback = rec.id ? sentFeedback[rec.id] : null;
            return (
              <motion.article
                key={rec.id ?? index}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4, ease: [0.2, 0.8, 0.3, 1] }}
                className="grid gap-3.5 rounded-xl border border-line p-5"
              >
                <h3 className="text-base font-semibold">Outfit {index + 1}</h3>

                <div className="flex gap-3 pb-5">
                  {rec.item_ids.map((id, i) => {
                    const item = items[id];
                    const tint = tintFor(item?.primary_colour);
                    const label = item
                      ? [item.primary_colour, item.subcategory ?? item.category]
                          .filter(Boolean)
                          .join(" ")
                      : "Unknown item";
                    return (
                      <motion.div
                        key={id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 + i * 0.1 }}
                        whileHover={{ y: -3 }}
                        className="relative grid aspect-[3/4] w-full max-w-[120px] place-items-center rounded-[10px]"
                        style={{ background: tint.bg, color: tint.fg }}
                      >
                        <GarmentIcon kind={item?.category ?? "top"} className="w-[52%]" />
                        <span className="absolute inset-x-0 -bottom-5 text-center text-xs text-mute capitalize">
                          {label}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="rounded-xl bg-wash px-4 py-3.5 text-[14.5px] leading-relaxed text-body">
                  <b className="block font-semibold text-ink">Why this</b>
                  {rec.explanation}
                </div>

                {rec.warnings.map((warning) => (
                  <p
                    key={warning}
                    className="rounded-lg bg-warn-light px-3 py-2 text-[13.5px] text-warn"
                  >
                    {warning}
                  </p>
                ))}

                {rec.id && (
                  <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3.5">
                    {feedback ? (
                      <p className="text-sm text-ok">
                        {feedback === "wore"
                          ? "Marked as worn. Future picks will lean this way."
                          : feedback === "liked"
                            ? "Noted that you like it."
                            : "Feedback recorded. Future picks will avoid this."}
                      </p>
                    ) : (
                      <>
                        <button
                          onClick={() => sendFeedback(rec.id, "wore")}
                          className="rounded-lg bg-tangerine px-4 py-2.5 text-sm font-medium text-white transition hover:brightness-95"
                        >
                          Wear this
                        </button>
                        <button
                          onClick={recommend}
                          className="rounded-lg border border-line px-4 py-2.5 text-sm font-medium transition hover:bg-wash"
                        >
                          Show another
                        </button>
                        <div className="ml-auto flex gap-1.5">
                          <button
                            aria-label="I like this outfit"
                            onClick={() => sendFeedback(rec.id, "liked")}
                            className="grid size-[38px] place-items-center rounded-full border border-line transition hover:border-cobalt"
                          >
                            <ThumbIcon />
                          </button>
                          <button
                            aria-label="This outfit does not work"
                            onClick={() => {
                              setSheetFor(rec.id);
                              setReasons(new Set());
                            }}
                            className={`grid size-[38px] place-items-center rounded-full border transition ${
                              sheetFor === rec.id
                                ? "border-ink bg-ink text-white"
                                : "border-line hover:border-cobalt"
                            }`}
                          >
                            <ThumbIcon down />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </motion.article>
            );
          })}
      </div>

      {/* Reason sheet: second tier of feedback after a thumbs-down */}
      <AnimatePresence>
        {sheetRec && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.4, ease: [0.2, 0.8, 0.3, 1] }}
            className="fixed inset-x-0 bottom-[64px] z-30 grid gap-3 border-t border-line bg-white px-5 py-4 shadow-[0_-8px_30px_rgba(18,22,58,0.08)] md:left-[232px] md:bottom-0 md:px-9"
          >
            <b className="text-[14.5px] font-semibold">
              What did not work about Outfit {sheetIndex}? Select all that apply.
            </b>
            <div className="flex flex-wrap gap-1.5">
              {FEEDBACK_REASONS.map((reason) => {
                const on = reasons.has(reason.value);
                return (
                  <button
                    key={reason.value}
                    type="button"
                    onClick={() => toggleReason(reason.value)}
                    className={`rounded-full border px-3 py-1.5 text-[13px] transition ${
                      on ? "border-cobalt bg-cobalt text-white" : "border-line hover:border-cobalt"
                    }`}
                  >
                    {reason.label}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-mute">Your feedback shapes future suggestions.</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSheetFor(null)}
                  className="rounded-lg border border-line px-3.5 py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={reasons.size === 0}
                  onClick={() => sendFeedback(sheetRec.id, "rejected", [...reasons])}
                  className="rounded-lg bg-cobalt px-3.5 py-2 text-sm font-medium text-white disabled:opacity-40"
                >
                  Send feedback
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ThumbIcon({ down = false }: { down?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      className={`size-[17px] ${down ? "rotate-180" : ""}`}
    >
      <path d="M7 11v9H4v-9zM7 11l4-8c1.5 0 2.5 1 2.5 2.5V10h5a2 2 0 012 2.3l-1 6.4a2 2 0 01-2 1.7H7" />
    </svg>
  );
}
