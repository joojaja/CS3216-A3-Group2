"use client";

import { useState } from "react";
import { motion } from "motion/react";
import type { ClothingAttributes, PurchaseEvaluation } from "@/lib/schemas/ai";

type SimilarItem = {
  id: string;
  category: string;
  subcategory: string | null;
  primary_colour: string | null;
};

type Result = {
  attributes: ClothingAttributes;
  evaluation: PurchaseEvaluation;
  similar_items: SimilarItem[];
};

const LABEL_COPY: Record<string, string> = {
  likely_redundant: "Likely redundant",
  potentially_useful: "Potentially useful",
  fills_wardrobe_gap: "Fills a wardrobe gap",
  insufficient_information: "Insufficient information",
};

const LABEL_STYLE: Record<string, string> = {
  likely_redundant: "bg-red-50 text-red-800 border-red-200",
  potentially_useful: "bg-amber-50 text-amber-800 border-amber-200",
  fills_wardrobe_gap: "bg-emerald-50 text-emerald-800 border-emerald-200",
  insufficient_information: "bg-stone-100 text-stone-700 border-stone-300",
};

export function PurchaseEvaluator() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  function pickFile(next: File | null) {
    setFile(next);
    setResult(null);
    setError(null);
    setPreview(next ? URL.createObjectURL(next) : null);
  }

  async function evaluate() {
    if (!file) return;
    setLoading(true);
    setError(null);

    const form = new FormData();
    form.set("image", file);

    const res = await fetch("/api/purchases/evaluate", {
      method: "POST",
      body: form,
    });
    const body = await res.json();

    setLoading(false);

    if (!res.ok) {
      setError(body.error ?? "Evaluation failed");
      return;
    }

    setResult(body);
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium">
          Photo or screenshot of the item you are thinking of buying
        </label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
          className="mt-2 block w-full text-sm text-stone-600 file:mr-4 file:rounded-lg file:border-0 file:bg-stone-900 file:px-4 file:py-2 file:text-sm file:text-white"
        />
      </div>

      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt="Prospective purchase"
          className="h-56 w-56 rounded-xl border border-stone-200 object-cover"
        />
      )}

      {file && !result && (
        <button
          onClick={evaluate}
          disabled={loading}
          className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "Evaluating..." : "Check against my wardrobe"}
        </button>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 rounded-xl border border-stone-200 bg-white p-5 shadow-sm"
        >
          <span
            className={`inline-block rounded-full border px-3 py-1 text-sm font-medium ${LABEL_STYLE[result.evaluation.decision_label]}`}
          >
            {LABEL_COPY[result.evaluation.decision_label]}
          </span>

          <p className="text-sm text-stone-700">{result.evaluation.explanation}</p>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-stone-50 p-3">
              <p className="text-xs text-stone-500">Redundancy</p>
              <p className="font-medium">
                {Math.round(result.evaluation.redundancy_score * 100)}%
              </p>
            </div>
            <div className="rounded-lg bg-stone-50 p-3">
              <p className="text-xs text-stone-500">Wardrobe compatibility</p>
              <p className="font-medium">
                {Math.round(result.evaluation.compatibility_score * 100)}%
              </p>
            </div>
          </div>

          {result.similar_items.length > 0 && (
            <div className="text-sm">
              <p className="font-medium">You already own similar items:</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-stone-600">
                {result.similar_items.map((item) => (
                  <li key={item.id}>
                    {item.primary_colour ?? ""} {item.subcategory ?? item.category}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.evaluation.uncertainty_notes && (
            <p className="text-sm text-stone-500">
              Caveats: {result.evaluation.uncertainty_notes}
            </p>
          )}

          <p className="text-xs text-stone-400">
            This is an assessment, not a decision. You decide whether to buy.
          </p>
        </motion.div>
      )}
    </div>
  );
}
