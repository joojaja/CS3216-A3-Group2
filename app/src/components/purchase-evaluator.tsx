"use client";

import { useRef, useState } from "react";
import { motion } from "motion/react";
import type { ClothingAttributes, PurchaseEvaluation } from "@/lib/schemas/ai";
import { GarmentIcon, tintFor } from "@/components/garment-icon";

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
  likely_redundant: "bg-bad-light text-bad border-bad-line",
  potentially_useful: "bg-warn-light text-warn border-warn-line",
  fills_wardrobe_gap: "bg-ok-light text-ok border-[#c5cfba]",
  insufficient_information: "bg-wash text-mute border-line",
};

export function PurchaseEvaluator() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

    const res = await fetch("/api/purchases/evaluate", { method: "POST", body: form });
    const body = await res.json();

    setLoading(false);

    if (!res.ok) {
      setError(body.error ?? "Evaluation failed");
      return;
    }

    setResult(body);
  }

  const uncertain = new Set(result?.attributes.uncertain_fields ?? []);

  return (
    <div className="grid gap-6 md:grid-cols-[300px_1fr] md:gap-8">
      <div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className={`relative grid aspect-square w-full max-w-[170px] place-items-center overflow-hidden rounded-xl border text-center md:aspect-[4/5] md:max-w-none ${
            preview ? "border-line bg-wash" : "border-dashed border-line bg-wash hover:border-cobalt"
          }`}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Prospective purchase" className="size-full object-cover" />
          ) : (
            <span className="px-5 text-sm leading-relaxed text-mute">
              <GarmentIcon kind="shirt" className="mx-auto mb-3 w-12 text-tangerine" />
              Choose a photo or screenshot
            </span>
          )}
          {loading && (
            <>
              <span className="absolute inset-0 z-10 animate-veil bg-ink/40" />
              <span className="absolute inset-x-0 top-0 z-20 h-[3px] animate-beam bg-white shadow-[0_0_18px_4px_rgba(229,155,135,0.75)]" />
            </>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
          className="sr-only"
        />
        <p className="mt-2.5 text-xs leading-relaxed text-mute">
          {file
            ? `${file.name}, ${(file.size / 1024 / 1024).toFixed(1)} MB`
            : "A product page screenshot works well. JPEG, PNG, WebP or HEIC up to 8 MB."}
        </p>
      </div>

      <div className="grid content-start gap-4">
        {error && <p className="text-sm text-bad">{error}</p>}

        {!result && !loading && (
          <div>
            <button
              onClick={evaluate}
              disabled={!file}
              className="rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-ink transition hover:bg-accent-deep disabled:opacity-40"
            >
              Check against my wardrobe
            </button>
            {!file && <p className="mt-2 text-xs text-mute">Pick a photo first.</p>}
          </div>
        )}

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-3.5">
            <p className="flex items-center gap-3 text-sm text-mute">
              <span className="size-[18px] animate-spin rounded-full border-[2.5px] border-line border-t-cobalt" />
              Reading the item and comparing it against everything you own.
            </p>
            <div className="shim h-9 w-2/5" />
            <div className="shim h-[60px]" />
            <div className="grid grid-cols-2 gap-3">
              <div className="shim h-[84px]" />
              <div className="shim h-[84px]" />
            </div>
          </motion.div>
        )}

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-4"
          >
            <div>
              <span
                className={`inline-block rounded-full border px-3.5 py-1.5 text-sm font-semibold ${LABEL_STYLE[result.evaluation.decision_label]}`}
              >
                {LABEL_COPY[result.evaluation.decision_label]}
              </span>
            </div>

            <p className="text-[14.5px] leading-relaxed">{result.evaluation.explanation}</p>

            <div className="grid grid-cols-2 gap-3">
              <Score
                label="Redundancy"
                value={result.evaluation.redundancy_score}
                colour="bg-cobalt"
              />
              <Score
                label="Wardrobe compatibility"
                value={result.evaluation.compatibility_score}
                colour="bg-tangerine"
              />
            </div>

            {/* What the model read, so the verdict can be checked */}
            <div className="overflow-hidden rounded-xl border border-line bg-card text-sm">
              <Row
                label="What Wearabouts read"
                value={[result.attributes.primary_colour, result.attributes.subcategory]
                  .filter(Boolean)
                  .join(" ")}
                uncertain={uncertain.has("subcategory")}
              />
              <Row label="Category" value={result.attributes.category} uncertain={uncertain.has("category")} />
              <Row
                label="Formality"
                value={result.attributes.formality.replace("_", " ")}
                uncertain={uncertain.has("formality")}
              />
              <Row
                label="Material cues"
                value={result.attributes.material_cues || "Not visible"}
                uncertain
                last
              />
            </div>

            {result.similar_items.length > 0 && (
              <div>
                <b className="mb-2 block text-sm font-semibold">You already own similar items</b>
                <div className="grid gap-2">
                  {result.similar_items.map((item, i) => {
                    const tint = tintFor(item.primary_colour);
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + i * 0.08 }}
                        className="flex items-center gap-3 rounded-[10px] border border-line bg-card px-3 py-2 text-sm capitalize"
                      >
                        <span
                          className="grid size-10 shrink-0 place-items-center rounded-lg"
                          style={{ background: tint.bg, color: tint.fg }}
                        >
                          <GarmentIcon kind={item.category} className="w-[56%]" />
                        </span>
                        {[item.primary_colour, item.subcategory ?? item.category]
                          .filter(Boolean)
                          .join(" ")}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {result.evaluation.uncertainty_notes && (
              <p className="text-xs leading-relaxed text-mute">
                Caveats: {result.evaluation.uncertainty_notes}
              </p>
            )}

            <p className="text-xs text-mute">
              This is an assessment, not a decision. You decide whether to buy.
            </p>

            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => pickFile(null)}
                className="rounded-lg border border-line px-5 py-3 text-sm font-medium transition hover:bg-soft"
              >
                Check another item
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function Score({ label, value, colour }: { label: string; value: number; colour: string }) {
  const pct = Math.round(value * 100);
  return (
    <div className="rounded-[10px] bg-wash px-4 py-3.5">
      <small className="block text-xs text-mute">{label}</small>
      <b className="mt-1 block text-2xl font-semibold tracking-tight">{pct}%</b>
      <div className="mt-2 h-[5px] overflow-hidden rounded-full bg-line">
        <motion.div
          className={`h-full rounded-full ${colour}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.1, delay: 0.12, ease: [0.3, 0.8, 0.3, 1] }}
        />
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  uncertain,
  last,
}: {
  label: string;
  value: string;
  uncertain?: boolean;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 px-3.5 py-2.5 ${last ? "" : "border-b border-line"}`}
    >
      <span className="text-mute">{label}</span>
      <b className={`text-right font-medium capitalize ${uncertain ? "text-warn" : ""}`}>
        {value}
        {uncertain && <span className="ml-1.5 text-xs font-normal">unverified from a photo</span>}
      </b>
    </div>
  );
}
