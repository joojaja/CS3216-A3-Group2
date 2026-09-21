"use client";

import { useState } from "react";
import { BodyDiagram } from "@/components/body-diagram";
import { CATEGORY_LABELS } from "@/lib/sizing/categories";
import { explainRecommendation, rangeText } from "@/lib/sizing/explain";
import { MEASUREMENTS } from "@/lib/sizing/measurements";
import { toBodyRows } from "@/lib/sizing/normalise";
import type { Confidence, Recommendation } from "@/lib/sizing/match";
import type { SizeChart, Unit } from "@/lib/sizing/types";

type Ok = Extract<Recommendation, { status: "ok" }>;

const CONFIDENCE: Record<Confidence, { label: string; hint: string; className: string }> = {
  high: {
    label: "High confidence",
    hint: "The chart covers your measurements well.",
    className: "border-ok bg-ok-light text-ok",
  },
  medium: {
    label: "Medium confidence",
    hint: "Check the chart before you buy.",
    className: "border-warn-line bg-warn-light text-warn-ink",
  },
  low: {
    label: "Low confidence",
    hint: "Treat this as a rough guide and check the chart yourself.",
    className: "border-bad-line bg-bad-light text-bad",
  },
};

const FLAG_REASONS = [
  { value: "wrong_brand", label: "Wrong brand" },
  { value: "wrong_product", label: "Not this product's chart" },
  { value: "wrong_numbers", label: "Numbers look wrong" },
  { value: "other", label: "Something else" },
] as const;

type FlagReason = (typeof FLAG_REASONS)[number]["value"];

function sourceText(chart: SizeChart) {
  if (chart.source.type === "product") return "From this product's size chart";
  if (chart.source.type === "web") return "Found online";
  return `${chart.brand} size guide`;
}

function ChartTable({ chart, unit, highlight }: { chart: SizeChart; unit: Unit; highlight?: number }) {
  const rows = toBodyRows(chart);
  const keys = MEASUREMENTS.map((m) => m.key).filter((k) => rows.some((r) => r.ranges[k]));
  return (
    <div className="mt-3 overflow-x-auto rounded-lg border border-line">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">
          {chart.brand} {CATEGORY_LABELS[chart.category].toLowerCase()} size chart, body measurements in {unit}
        </caption>
        <thead className="bg-wash text-xs text-mute">
          <tr>
            <th scope="col" className="px-3 py-2 font-medium">Size</th>
            {keys.map((k) => (
              <th key={k} scope="col" className="px-3 py-2 font-medium">
                {MEASUREMENTS.find((m) => m.key === k)!.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((row, i) => (
            <tr key={row.label} className={i === highlight ? "bg-cobalt-light font-medium text-cobalt-deep" : "text-body"}>
              <th scope="row" className="px-3 py-2 font-medium whitespace-nowrap">
                {chart.rows[i].label}
                {i === highlight && <span className="sr-only"> (your size)</span>}
              </th>
              {keys.map((k) => (
                <td key={k} className="px-3 py-2 whitespace-nowrap">
                  {row.ranges[k] ? rangeText(row.ranges[k]!, unit) : "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FlagControls({ chart, open, onOpen }: { chart: SizeChart; open: boolean; onOpen: () => void }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function flag(reason: FlagReason) {
    setState("sending");
    try {
      const res = await fetch("/api/sizing/flag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chart_key: chart.source.type === "stored" ? chart.key : chart.source.type,
          brand: chart.brand,
          category: chart.category,
          source_type: chart.source.type,
          reason,
        }),
      });
      setState(res.ok ? "sent" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "sent") return <p role="status" className="text-sm text-ok">Thanks. We will check this chart.</p>;
  if (!open) {
    return (
      <button type="button" onClick={onOpen} className="min-h-10 text-sm text-mute underline underline-offset-2 hover:text-ink">
        Wrong chart?
      </button>
    );
  }
  return (
    <fieldset disabled={state === "sending"} className="text-sm">
      <legend className="py-1 font-medium text-ink">What looks wrong?</legend>
      <div className="mt-1 flex flex-wrap gap-2">
        {FLAG_REASONS.map((r) => (
          <button
            key={r.value}
            type="button"
            onClick={() => flag(r.value)}
            className="min-h-10 rounded-lg border border-line px-3 text-body hover:border-cobalt disabled:opacity-50"
          >
            {r.label}
          </button>
        ))}
      </div>
      {state === "error" && (
        <p role="alert" className="mt-2 text-bad">We could not send that. Try again in a moment.</p>
      )}
    </fieldset>
  );
}

export function SizeResult({ rec, chart, unit }: { rec: Ok; chart: SizeChart; unit: Unit }) {
  const [confirmed, setConfirmed] = useState(rec.confidence !== "low");
  const [flagOpen, setFlagOpen] = useState(false);
  const { reason, notes } = explainRecommendation(rec, chart, unit);
  const confidence = CONFIDENCE[rec.confidence];

  // A shaky result shows the chart first and asks before it shows a size
  if (!confirmed) {
    return (
      <section aria-labelledby="size-confirm" className="rounded-xl border border-line bg-white p-5 md:p-6">
        <h2 id="size-confirm" className="text-lg font-semibold text-ink">
          Does this chart look right?
        </h2>
        <p className="mt-1.5 text-sm text-body">
          We are not sure this chart fits your item well. Compare it with the one you saw, then continue.
        </p>
        <ChartTable chart={chart} unit={unit} />
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setConfirmed(true)}
            className="min-h-11 rounded-lg bg-cobalt px-4 text-sm font-medium text-white hover:bg-cobalt-deep"
          >
            Yes, show my size
          </button>
          {!flagOpen && (
            <button
              type="button"
              onClick={() => setFlagOpen(true)}
              className="min-h-11 rounded-lg border border-line px-4 text-sm font-medium text-ink hover:border-cobalt"
            >
              No, this looks wrong
            </button>
          )}
        </div>
        {flagOpen && (
          <div className="mt-3">
            <FlagControls chart={chart} open onOpen={() => setFlagOpen(true)} />
          </div>
        )}
      </section>
    );
  }

  return (
    <section aria-labelledby="size-result" className="rounded-xl border border-line bg-white p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-wide text-mute uppercase">
            {chart.brand}, {CATEGORY_LABELS[chart.category].toLowerCase()}
          </p>
          <h2 id="size-result" className="mt-1 text-sm font-medium text-body">
            Suggested size
          </h2>
          <p className="text-4xl font-semibold tracking-tight text-ink">{rec.size}</p>
          {rec.alternative && rec.fitNote && <p className="mt-1 text-sm text-body">{rec.fitNote}</p>}
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-medium ${confidence.className}`}>
          {confidence.label}
        </span>
      </div>

      <div className="mt-4 flex items-start gap-4 rounded-lg bg-wash p-3.5">
        <BodyDiagram highlight={[rec.decidedBy]} size="sm" />
        <div className="grid gap-1.5 text-sm text-body">
          <p className="text-ink">{reason}</p>
          {notes.map((n) => (
            <p key={n}>{n}</p>
          ))}
          <p className="text-mute">{confidence.hint}</p>
        </div>
      </div>

      <p className="mt-4 text-sm text-body">
        Chart:{" "}
        {chart.source.url ? (
          <a href={chart.source.url} target="_blank" rel="noopener noreferrer" className="font-medium text-cobalt underline-offset-2 hover:underline">
            {sourceText(chart)}
          </a>
        ) : (
          <span className="font-medium">{sourceText(chart)}</span>
        )}
        {chart.scope === "brand" && ". A general chart, so some items may fit differently."}
      </p>

      <details className="mt-3 text-sm">
        <summary className="min-h-10 cursor-pointer py-2 font-medium text-cobalt">View the chart</summary>
        <ChartTable chart={chart} unit={unit} highlight={rec.sizeIndex} />
      </details>

      <p className="mt-4 border-t border-line pt-3 text-xs text-mute">
        Sizing is guidance, not a guarantee. Check the brand&apos;s fit notes before you buy.
      </p>

      <div className="mt-2">
        <FlagControls chart={chart} open={flagOpen} onOpen={() => setFlagOpen(true)} />
      </div>
    </section>
  );
}
