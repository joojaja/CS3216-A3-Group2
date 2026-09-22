"use client";

import { useId, type Ref } from "react";
import { BodyDiagram } from "@/components/body-diagram";
import { MEASUREMENT_BY_KEY, parseMeasurementInput } from "@/lib/sizing/measurements";
import { checkMeasurement } from "@/lib/sizing/validate";
import type { MeasurementKey, Unit } from "@/lib/sizing/types";

export const inputClass =
  "mt-1.5 block w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm font-normal transition focus:border-cobalt focus:outline-none focus:ring-[3px] focus:ring-cobalt-light";

type Props = {
  field: MeasurementKey;
  value: string;
  unit: Unit;
  onValueChange: (raw: string) => void;
  // convert=false keeps the typed number and only changes what it means,
  // for "Did you mean inches?"
  onUnitChange: (unit: Unit, convert: boolean) => void;
  headingRef?: Ref<HTMLHeadingElement>;
  eyebrow?: string;
  error?: string | null;
};

// One measurement: the diagram with its area highlighted, a one-line how-to,
// the input and a cm/inch toggle. Shared by the full wizard and the inline
// "we need one more measurement" prompt.
export function MeasurementStep({
  field,
  value,
  unit,
  onValueChange,
  onUnitChange,
  headingRef,
  eyebrow,
  error,
}: Props) {
  const info = MEASUREMENT_BY_KEY[field];
  const inputId = useId();
  const hintId = useId();
  const parsed = parseMeasurementInput(value);
  const warning =
    parsed != null && !Number.isNaN(parsed) ? checkMeasurement(field, parsed, unit) : null;

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start sm:gap-8">
      <BodyDiagram highlight={[field]} />
      <div className="w-full min-w-0 flex-1">
        {eyebrow && <p className="text-xs font-medium tracking-wide text-mute uppercase">{eyebrow}</p>}
        <h2 ref={headingRef} tabIndex={-1} className="mt-1 text-xl font-semibold text-ink focus:outline-none">
          {info.label}
        </h2>
        <p id={hintId} className="mt-2 text-sm leading-relaxed text-body">
          {info.instruction}
        </p>

        <div className="mt-4 flex items-end gap-3">
          <label htmlFor={inputId} className="block flex-1 text-[13.5px] font-medium">
            {info.label} in {unit === "cm" ? "centimetres" : "inches"}
            <input
              id={inputId}
              inputMode="decimal"
              autoComplete="off"
              value={value}
              onChange={(e) => onValueChange(e.target.value)}
              aria-describedby={hintId}
              aria-invalid={!!error}
              className={inputClass}
            />
          </label>
          <div role="group" aria-label="Unit" className="flex rounded-lg border border-line p-0.5">
            {(["cm", "in"] as const).map((u) => (
              <button
                key={u}
                type="button"
                aria-pressed={unit === u}
                onClick={() => onUnitChange(u, true)}
                className={`min-h-10 rounded-md px-3 text-sm font-medium transition ${
                  unit === u ? "bg-cobalt text-white" : "text-mute hover:text-ink"
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        <div aria-live="polite" className="mt-2 min-h-5 text-sm">
          {error ? (
            <p role="alert" className="text-bad">{error}</p>
          ) : warning ? (
            <p className="text-warn-ink">
              {warning.message}
              {warning.kind === "unit" && (
                <button
                  type="button"
                  onClick={() => onUnitChange(warning.suggestedUnit, false)}
                  className="ml-2 font-medium text-cobalt underline underline-offset-2"
                >
                  Use {warning.suggestedUnit === "in" ? "inches" : "cm"}
                </button>
              )}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
