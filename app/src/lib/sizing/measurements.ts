// The measurement registry. One entry per body measurement, in wizard order.
// No React and relative imports only, so the Node test runner can load it.

import type { MeasurementKey, Unit } from "./types.ts";

export type MeasurementInfo = {
  key: MeasurementKey;
  label: string;
  instruction: string;
  // Plausible adult range in cm. Values outside it get a friendly warning,
  // never a block
  plausible: [number, number];
};

export const MEASUREMENTS: MeasurementInfo[] = [
  {
    key: "height",
    label: "Height",
    instruction:
      "Stand against a wall without shoes and measure from the floor to the top of your head.",
    plausible: [130, 210],
  },
  {
    key: "chest",
    label: "Chest or bust",
    instruction:
      "Wrap the tape around the fullest part of your chest, under your arms, and keep it level.",
    plausible: [65, 150],
  },
  {
    key: "waist",
    label: "Waist",
    instruction:
      "Measure around your natural waist, the narrowest part above your belly button. Keep one finger under the tape.",
    plausible: [50, 150],
  },
  {
    key: "hips",
    label: "Hips",
    instruction:
      "Stand with your feet together and measure around the widest part of your hips.",
    plausible: [70, 160],
  },
  {
    key: "inseam",
    label: "Inseam",
    instruction:
      "Measure from the top of your inner thigh down to your ankle bone. A pair of trousers that fits you well also works.",
    plausible: [55, 95],
  },
  {
    key: "foot_length",
    label: "Foot length",
    instruction:
      "Stand on a sheet of paper, mark your heel and longest toe, then measure between the marks.",
    plausible: [20, 32],
  },
];

export const MEASUREMENT_BY_KEY = Object.fromEntries(
  MEASUREMENTS.map((m) => [m.key, m]),
) as Record<MeasurementKey, MeasurementInfo>;

export const CM_PER_INCH = 2.54;

export function toCm(value: number, unit: Unit): number {
  return unit === "in" ? value * CM_PER_INCH : value;
}

export function fromCm(cm: number, unit: Unit): number {
  return unit === "in" ? cm / CM_PER_INCH : cm;
}

// Display rounding: half a centimetre, or a quarter inch
export function roundForUnit(value: number, unit: Unit): number {
  const step = unit === "in" ? 0.25 : 0.5;
  return Math.round(value / step) * step;
}

export function formatMeasurement(cm: number, unit: Unit): string {
  return `${roundForUnit(fromCm(cm, unit), unit)} ${unit}`;
}

// Parses what the user typed. Returns null for an empty field and NaN for
// anything that is not a positive number with at most one decimal place
export function parseMeasurementInput(raw: string): number | null {
  const text = raw.trim().replace(",", ".");
  if (text === "") return null;
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(text)) return Number.NaN;
  const value = Number(text);
  return value > 0 ? value : Number.NaN;
}
