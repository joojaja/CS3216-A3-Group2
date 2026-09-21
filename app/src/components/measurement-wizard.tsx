"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { MotionConfig } from "motion/react";
import { MeasurementStep } from "@/components/measurement-step";
import { useToast } from "@/components/toast";
import { saveMeasurements } from "@/lib/actions/measurements";
import {
  MEASUREMENTS,
  MEASUREMENT_BY_KEY,
  formatMeasurement,
  fromCm,
  parseMeasurementInput,
  roundForUnit,
  toCm,
} from "@/lib/sizing/measurements";
import { checkProfile, convertTyped } from "@/lib/sizing/validate";
import { MEASUREMENT_KEYS } from "@/lib/sizing/types";
import type {
  FitPreference,
  MeasurementKey,
  MeasurementProfile,
  Measurements,
  SizeRange,
  Unit,
} from "@/lib/sizing/types";

const EMPTY: Measurements = Object.fromEntries(
  MEASUREMENT_KEYS.map((k) => [k, null]),
) as Measurements;

const primaryButton =
  "min-h-11 rounded-lg bg-cobalt px-4 py-2.5 text-sm font-medium text-white transition hover:bg-cobalt-deep disabled:opacity-50";
const secondaryButton =
  "min-h-11 rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-ink transition hover:border-cobalt";

function typedFrom(profile: MeasurementProfile | null, unit: Unit) {
  return Object.fromEntries(
    MEASUREMENT_KEYS.map((k) => {
      const cm = profile?.measurements[k];
      return [k, cm == null ? "" : String(roundForUnit(fromCm(cm, unit), unit))];
    }),
  ) as Record<MeasurementKey, string>;
}

function Choice<T extends string | null>({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset>
      <legend className="text-[13.5px] font-medium">{legend}</legend>
      <div className="mt-1.5 flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.label}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
            className={`min-h-10 rounded-lg border px-3.5 text-sm transition ${
              value === o.value
                ? "border-cobalt bg-cobalt-light font-medium text-cobalt-deep"
                : "border-line text-body hover:border-cobalt"
            }`}
          >
            {value === o.value && <span aria-hidden="true">✓ </span>}
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

type Props = {
  initial: MeasurementProfile | null;
  // Defaults to every measurement. The sizing page passes only what a
  // category needs, and a single field for "we need one more"
  fields?: MeasurementKey[];
  onSaved?: (profile: MeasurementProfile) => void;
};

export function MeasurementWizard({ initial, fields, onSaved }: Props) {
  const steps = fields ?? MEASUREMENTS.map((m) => m.key);
  const single = steps.length === 1;
  const summaryIndex = steps.length;
  const hasExisting = steps.some((k) => initial?.measurements[k] != null);

  const { toast } = useToast();
  const [unit, setUnit] = useState<Unit>(initial?.unit ?? "cm");
  const [typed, setTyped] = useState(() => typedFrom(initial, initial?.unit ?? "cm"));
  const [sizeRange, setSizeRange] = useState<SizeRange | null>(initial?.sizeRange ?? null);
  const [fit, setFit] = useState<FitPreference>(initial?.fitPreference ?? "regular");
  const [step, setStep] = useState(hasExisting && !single ? summaryIndex : 0);
  const [stepError, setStepError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const heading = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    heading.current?.focus();
  }, [step]);

  // One unit covers every field. The toggle converts all typed values. "Did
  // you mean inches?" (convert=false) keeps the current field's number as
  // typed and still converts the others, so earlier answers keep their size
  function changeUnit(next: Unit, convert: boolean) {
    if (next === unit) return;
    const current = steps[step];
    setTyped((prev) => {
      const out = { ...prev };
      for (const k of MEASUREMENT_KEYS) {
        if (!convert && k === current) continue;
        const v = parseMeasurementInput(prev[k]);
        if (v != null && !Number.isNaN(v)) out[k] = String(convertTyped(v, unit, next));
      }
      return out;
    });
    setUnit(next);
  }

  function buildProfile(): MeasurementProfile {
    const measurements = { ...(initial?.measurements ?? EMPTY) };
    for (const k of steps) {
      const v = parseMeasurementInput(typed[k]);
      measurements[k] = v == null || Number.isNaN(v) ? null : toCm(v, unit);
    }
    return { unit, sizeRange, fitPreference: fit, measurements };
  }

  function save() {
    setSaveError(null);
    const profile = buildProfile();
    startTransition(async () => {
      try {
        const result = await saveMeasurements(profile);
        if (result.error) {
          setSaveError(result.error);
          return;
        }
        toast("Measurements saved");
        onSaved?.(profile);
      } catch {
        setSaveError("We couldn't save your measurements. Your numbers are still here. Try again.");
      }
    });
  }

  function next(e: React.FormEvent) {
    e.preventDefault();
    const field = steps[step];
    const value = parseMeasurementInput(typed[field]);
    if (value != null && Number.isNaN(value)) {
      setStepError("Enter a number, like 76 or 76.5.");
      return;
    }
    setStepError(null);
    if (single) save();
    else setStep(step + 1);
  }

  const total = single ? 1 : steps.length + 1;
  const onSummary = !single && step === summaryIndex;
  const profile = buildProfile();
  const warnings = onSummary ? checkProfile(profile.measurements) : [];

  return (
    <MotionConfig reducedMotion="user">
      <div className="rounded-xl border border-line bg-white p-5 md:p-6">
        {!single && (
          <>
            <div className="flex justify-between text-xs font-medium text-mute">
              <span>
                Step {step + 1} of {total}
              </span>
              <span>{onSummary ? "Review" : MEASUREMENT_BY_KEY[steps[step]].label}</span>
            </div>
            <progress
              value={step + 1}
              max={total}
              aria-label={`Measurement step ${step + 1} of ${total}`}
              className="mt-2 mb-5 h-1.5 w-full appearance-none overflow-hidden rounded-full bg-line [&::-moz-progress-bar]:bg-cobalt [&::-webkit-progress-bar]:bg-line [&::-webkit-progress-value]:bg-cobalt [&::-webkit-progress-value]:transition-all"
            />
          </>
        )}

        {!onSummary ? (
          <form onSubmit={next} noValidate>
            <MeasurementStep
              field={steps[step]}
              value={typed[steps[step]]}
              unit={unit}
              headingRef={heading}
              error={stepError}
              onValueChange={(raw) => {
                setStepError(null);
                setTyped((prev) => ({ ...prev, [steps[step]]: raw }));
              }}
              onUnitChange={changeUnit}
            />
            {single && saveError && (
              <p role="alert" className="mt-3 text-sm text-bad">{saveError}</p>
            )}
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              {step > 0 && (
                <button type="button" className={`${secondaryButton} mr-auto`} onClick={() => setStep(step - 1)}>
                  Back
                </button>
              )}
              {!single && typed[steps[step]].trim() === "" && (
                <button
                  type="button"
                  className={secondaryButton}
                  onClick={() => {
                    setStepError(null);
                    setStep(step + 1);
                  }}
                >
                  Skip for now
                </button>
              )}
              <button type="submit" className={primaryButton} disabled={pending}>
                {single ? (pending ? "Saving..." : "Save and continue") : "Next"}
              </button>
            </div>
          </form>
        ) : (
          <div>
            <h2 ref={heading} tabIndex={-1} className="text-xl font-semibold text-ink focus:outline-none">
              Check your measurements
            </h2>
            <p className="mt-1.5 text-sm text-body">
              Skipped ones are fine. We will ask for them only when a size needs them.
            </p>

            <ul className="mt-4 divide-y divide-line rounded-lg border border-line">
              {steps.map((k, i) => {
                const cm = profile.measurements[k];
                return (
                  <li key={k} className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm">
                    <span className="font-medium text-ink">{MEASUREMENT_BY_KEY[k].label}</span>
                    <span className="ml-auto text-body">
                      {cm == null ? <span className="text-mute">Not given</span> : formatMeasurement(cm, unit)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setStep(i)}
                      className="min-h-10 px-2 font-medium text-cobalt underline-offset-2 hover:underline"
                      aria-label={`${cm == null ? "Add" : "Edit"} ${MEASUREMENT_BY_KEY[k].label.toLowerCase()}`}
                    >
                      {cm == null ? "Add" : "Edit"}
                    </button>
                  </li>
                );
              })}
            </ul>

            {warnings.length > 0 && (
              <ul className="mt-3 grid gap-1.5 rounded-lg border border-warn-line bg-warn-light px-3.5 py-2.5 text-sm text-warn-ink">
                {warnings.map((w) => (
                  <li key={w.message}>{w.message}</li>
                ))}
              </ul>
            )}

            <div className="mt-5 grid gap-4">
              <Choice<SizeRange | null>
                legend="Which size range do you usually shop?"
                value={sizeRange}
                onChange={setSizeRange}
                options={[
                  { value: "womens", label: "Women's" },
                  { value: "mens", label: "Men's" },
                  { value: null, label: "Ask me each time" },
                ]}
              />
              <Choice<FitPreference>
                legend="How do you like clothes to fit?"
                value={fit}
                onChange={setFit}
                options={[
                  { value: "snug", label: "Snug" },
                  { value: "regular", label: "Regular" },
                  { value: "relaxed", label: "Relaxed" },
                ]}
              />
            </div>

            {saveError && <p role="alert" className="mt-4 text-sm text-bad">{saveError}</p>}

            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button type="button" className={`${secondaryButton} mr-auto`} onClick={() => setStep(steps.length - 1)}>
                Back
              </button>
              <button type="button" className={primaryButton} disabled={pending} onClick={save}>
                {pending ? "Saving..." : "Save measurements"}
              </button>
            </div>
          </div>
        )}
      </div>
    </MotionConfig>
  );
}
