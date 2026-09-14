"use client";

import { useState } from "react";
import { motion } from "motion/react";

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
];

export function OutfitPlanner() {
  const [occasion, setOccasion] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weather, setWeather] = useState<string | null>(null);
  const [items, setItems] = useState<Record<string, RecommendedItem>>({});
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [sentFeedback, setSentFeedback] = useState<Record<string, string>>({});

  async function recommend() {
    setLoading(true);
    setError(null);

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
    reason?: string,
  ) {
    if (!recommendationId) return;

    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recommendation_id: recommendationId,
        action,
        reason,
      }),
    });

    if (res.ok) {
      setSentFeedback((prev) => ({
        ...prev,
        [recommendationId]: reason ? `${action}:${reason}` : action,
      }));
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <label className="block text-sm font-medium">
          Describe the occasion
          <textarea
            value={occasion}
            onChange={(e) => setOccasion(e.target.value)}
            rows={3}
            placeholder="Casual outdoor birthday lunch tomorrow afternoon"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm font-medium">
          Date (optional)
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 block rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <button
          onClick={recommend}
          disabled={loading || occasion.trim().length < 3}
          className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "Thinking..." : "Suggest outfits"}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {weather && (
        <p className="text-sm text-stone-500">
          Singapore forecast used: {weather}
        </p>
      )}

      <div className="space-y-4">
        {recs.map((rec, index) => (
          <motion.div
            key={rec.id ?? index}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm"
          >
            <h3 className="text-sm font-semibold">Outfit {index + 1}</h3>
            <ul className="mt-2 space-y-1 text-sm text-stone-700">
              {rec.item_ids.map((id) => {
                const item = items[id];
                return (
                  <li key={id}>
                    {item
                      ? `${item.primary_colour ?? ""} ${item.subcategory ?? item.category}`
                      : id}
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 text-sm text-stone-600">{rec.explanation}</p>
            {rec.warnings.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm text-amber-700">
                {rec.warnings.map((warning) => (
                  <li key={warning}>Note: {warning}</li>
                ))}
              </ul>
            )}

            {rec.id && (
              <div className="mt-4 border-t border-stone-100 pt-3">
                {sentFeedback[rec.id] ? (
                  <p className="text-sm text-emerald-700">Feedback recorded.</p>
                ) : (
                  <div className="flex flex-wrap gap-2 text-xs">
                    <button
                      onClick={() => sendFeedback(rec.id, "wore")}
                      className="rounded-full border border-stone-300 px-3 py-1 hover:bg-stone-100"
                    >
                      Wore this
                    </button>
                    <button
                      onClick={() => sendFeedback(rec.id, "liked")}
                      className="rounded-full border border-stone-300 px-3 py-1 hover:bg-stone-100"
                    >
                      Like it
                    </button>
                    {FEEDBACK_REASONS.map((reason) => (
                      <button
                        key={reason.value}
                        onClick={() =>
                          sendFeedback(rec.id, "rejected", reason.value)
                        }
                        className="rounded-full border border-stone-300 px-3 py-1 text-stone-500 hover:bg-stone-100"
                      >
                        {reason.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
