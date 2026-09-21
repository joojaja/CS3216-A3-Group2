// Maps between the measurement_profiles row and the app's profile type.

import { MEASUREMENT_KEYS } from "./types.ts";
import type { FitPreference, MeasurementProfile, SizeRange, Unit } from "./types.ts";

export const MEASUREMENT_COLUMNS =
  "unit, size_range, fit_preference, height_cm, chest_cm, waist_cm, hips_cm, inseam_cm, foot_length_cm";

export type MeasurementRow = {
  unit: Unit;
  size_range: SizeRange | null;
  fit_preference: FitPreference;
  height_cm: number | string | null;
  chest_cm: number | string | null;
  waist_cm: number | string | null;
  hips_cm: number | string | null;
  inseam_cm: number | string | null;
  foot_length_cm: number | string | null;
};

// PostgREST returns numeric columns as numbers or strings depending on size,
// so coerce here once
const num = (v: number | string | null) => (v == null ? null : Number(v));

export function rowToProfile(row: MeasurementRow | null): MeasurementProfile | null {
  if (!row) return null;
  return {
    unit: row.unit,
    sizeRange: row.size_range,
    fitPreference: row.fit_preference,
    measurements: Object.fromEntries(
      MEASUREMENT_KEYS.map((k) => [k, num(row[`${k}_cm`])]),
    ) as MeasurementProfile["measurements"],
  };
}

export function profileToRow(p: MeasurementProfile) {
  return {
    unit: p.unit,
    size_range: p.sizeRange,
    fit_preference: p.fitPreference,
    ...Object.fromEntries(
      MEASUREMENT_KEYS.map((k) => {
        const v = p.measurements[k];
        return [`${k}_cm`, v == null ? null : Math.round(v * 10) / 10];
      }),
    ),
  };
}

export function hasAnyMeasurement(p: MeasurementProfile | null): boolean {
  return !!p && MEASUREMENT_KEYS.some((k) => p.measurements[k] != null);
}
