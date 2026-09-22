// Sanity checks for measurements the user types. Every check returns a
// friendly warning and never blocks saving: people really do fall outside
// averages, and the warning only asks them to look again.

import { MEASUREMENT_BY_KEY, toCm, roundForUnit, CM_PER_INCH } from "./measurements.ts";
import type { MeasurementKey, Measurements, Unit } from "./types.ts";

export type MeasurementWarning =
  | { kind: "unit"; key: MeasurementKey; message: string; suggestedUnit: Unit }
  | { kind: "range"; key: MeasurementKey; message: string }
  | { kind: "combination"; keys: MeasurementKey[]; message: string };

function inRange(cm: number, [min, max]: [number, number]) {
  return cm >= min && cm <= max;
}

// Checks one value as typed, in the unit the user picked
export function checkMeasurement(
  key: MeasurementKey,
  value: number,
  unit: Unit,
): MeasurementWarning | null {
  const { plausible } = MEASUREMENT_BY_KEY[key];
  if (inRange(toCm(value, unit), plausible)) return null;

  // Read the same number in the other unit. If that is plausible, the
  // likelier story is a unit mixup, so offer a one-tap switch
  const other: Unit = unit === "cm" ? "in" : "cm";
  if (inRange(toCm(value, other), plausible)) {
    return {
      kind: "unit",
      key,
      suggestedUnit: other,
      message: `Did you mean ${value} ${other === "in" ? "inches" : "cm"}?`,
    };
  }

  return {
    kind: "range",
    key,
    message: "That looks unusual. Double-check the number or the unit.",
  };
}

// Cross-field checks on a whole profile, all values in cm
export function checkProfile(m: Measurements): MeasurementWarning[] {
  const warnings: MeasurementWarning[] = [];
  const { waist, hips, chest, inseam, height } = m;

  if (waist != null && hips != null) {
    if (waist > hips * 1.25 || hips < waist * 0.75) {
      warnings.push({
        kind: "combination",
        keys: ["waist", "hips"],
        message:
          "Your waist is much larger than your hips. Check that hips was measured at the widest point.",
      });
    }
  }

  if (chest != null && waist != null && chest < waist - 30) {
    warnings.push({
      kind: "combination",
      keys: ["chest", "waist"],
      message: "Your chest is much smaller than your waist. Check both numbers.",
    });
  }

  if (inseam != null && height != null) {
    const ratio = inseam / height;
    if (ratio < 0.38 || ratio > 0.55) {
      warnings.push({
        kind: "combination",
        keys: ["inseam", "height"],
        message:
          "Your inseam looks unusual for your height. Inseam runs from the inner thigh to the ankle bone.",
      });
    }
  }

  return warnings;
}

// Converts a value typed in one unit to the other, for the unit toggle.
// Rounded so a toggle back and forth does not drift
export function convertTyped(value: number, from: Unit, to: Unit): number {
  if (from === to) return value;
  const converted = from === "cm" ? value / CM_PER_INCH : value * CM_PER_INCH;
  return roundForUnit(converted, to);
}
