// Plain-language lines for the size result, built from templates. No model
// writes these, so a number on screen always matches the chart, and the
// user's measurements never leave the app.

import { MEASUREMENT_BY_KEY, formatMeasurement } from "./measurements.ts";
import { toBodyRows } from "./normalise.ts";
import type { Recommendation } from "./match.ts";
import type { MeasurementKey, SizeChart, Unit } from "./types.ts";

type Ok = Extract<Recommendation, { status: "ok" }>;

const name = (key: MeasurementKey) => MEASUREMENT_BY_KEY[key].label.toLowerCase();
// "Your hips are", "Your waist is"
const verb = (key: MeasurementKey) => (key === "hips" ? "are" : "is");

export function rangeText(range: [number, number], unit: Unit): string {
  if (range[0] === range[1]) return formatMeasurement(range[0], unit);
  const [a] = formatMeasurement(range[0], unit).split(" ");
  return `${a} to ${formatMeasurement(range[1], unit)}`;
}

export function explainRecommendation(rec: Ok, chart: SizeChart, unit: Unit) {
  const rows = toBodyRows(chart);
  const p = rec.placements.find((x) => x.key === rec.decidedBy)!;
  const value = formatMeasurement(p.valueCm, unit);
  const sized = (i: number) => {
    const r = rows[i].ranges[p.key];
    return r ? `${chart.rows[i].label} (${rangeText(r, unit)})` : chart.rows[i].label;
  };
  const brand = chart.brand;

  let reason: string;
  switch (p.position) {
    case "inside": {
      const r = rows[p.lower].ranges[p.key]!;
      reason = `Your ${name(p.key)} ${verb(p.key)} ${value}, which falls in ${brand}'s ${chart.rows[p.lower].label} range (${rangeText(r, unit)}).`;
      break;
    }
    case "edge":
    case "gap":
      reason = `Your ${name(p.key)} ${verb(p.key)} ${value}, between ${brand}'s ${sized(p.lower)} and ${sized(p.upper)}.`;
      break;
    case "below":
      reason = `Your ${name(p.key)} ${verb(p.key)} ${value}, below ${brand}'s smallest size, ${sized(p.lower)}. It may fit loosely.`;
      break;
    case "above":
      reason = `Your ${name(p.key)} ${verb(p.key)} ${value}, above ${brand}'s largest size, ${sized(p.lower)}. It may be tight.`;
      break;
  }

  const notes: string[] = [];
  if (rec.spread) {
    const parts = rec.spread.map((s) => `your ${name(s.key)} to ${s.size}`);
    const list = parts.length > 1 ? `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}` : parts[0];
    notes.push(
      `Your measurements point to different sizes: ${list}. We picked ${rec.size} so it fits at the ${name(rec.decidedBy)}.`,
    );
  }
  if (rec.lengthNote) {
    notes.push(
      rec.lengthNote.direction === "shorter"
        ? `Your ${name(rec.lengthNote.key)} ${verb(rec.lengthNote.key)} shorter than this size's, so it may need hemming.`
        : `Your ${name(rec.lengthNote.key)} ${verb(rec.lengthNote.key)} longer than this size's, so it may be short on you.`,
    );
  }
  if (chart.basis !== "body") {
    notes.push("This chart measures the garment, not the body, so we estimated the body sizes it fits.");
  }

  return { reason, notes };
}
