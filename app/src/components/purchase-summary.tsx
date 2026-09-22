"use client";

import { useEffect, useId, useRef, useState } from "react";
import { inputClass } from "@/components/measurement-step";
import { ChartTable } from "@/components/size-result";
import { CATEGORY_LABELS } from "@/lib/sizing/categories";
import { STORED_BRANDS } from "@/lib/sizing/charts";
import type { PurchaseContext, SizingCategory, Unit } from "@/lib/sizing/types";

type Field = "brand" | "productName" | "category" | "sizeRange";

const RANGE_LABELS: Record<string, string> = { womens: "Women's", mens: "Men's", unisex: "Unisex" };

function CheckBadge() {
  return (
    <span className="ml-1.5 rounded-md bg-warn-light px-1.5 py-0.5 text-[11px] font-medium text-warn-ink">Check this</span>
  );
}

// "Here's what we found": one line of tappable chips the user can correct in
// place, the chart read from the screenshot, and the nudge to add a chart
// screenshot when there was none. Nothing is matched until they confirm.
export function PurchaseSummary({
  context,
  unit,
  merging,
  error,
  onChange,
  onConfirm,
  onAddScreenshot,
  onStartOver,
}: {
  context: PurchaseContext;
  unit: Unit;
  merging: boolean;
  error: string | null;
  onChange: (patch: Partial<PurchaseContext>) => void;
  onConfirm: () => void;
  onAddScreenshot: () => void;
  onStartOver: () => void;
}) {
  const [editing, setEditing] = useState<Field | null>(null);
  const [chartChecked, setChartChecked] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const listId = useId();
  const extraction = context.extraction;
  const uncertain = new Set(extraction?.uncertainFields ?? []);
  const lowConfidence = extraction?.confidence === "low";

  useEffect(() => {
    heading.current?.focus();
  }, []);

  if (extraction && !extraction.isProductPage && !context.brand && !context.category) {
    return (
      <section className="rounded-xl border border-line bg-white p-5">
        <h2 ref={heading} tabIndex={-1} className="text-base font-semibold text-ink focus:outline-none">
          This does not look like a clothing product
        </h2>
        <p className="mt-1 text-sm text-body">Try a screenshot of the product page, or pick the brand yourself below.</p>
        <button type="button" onClick={onStartOver} className="mt-3 min-h-10 text-sm font-medium text-cobalt underline underline-offset-2">
          Start over
        </button>
      </section>
    );
  }

  const chip = (field: Field, text: string | null, placeholder: string, fieldKey: string) => (
    <button
      type="button"
      onClick={() => setEditing(field)}
      aria-label={`${placeholder}: ${text ?? "not found"}. Change`}
      className={`min-h-10 rounded-lg border px-3 text-sm transition hover:border-cobalt ${
        text ? "border-line bg-white text-ink" : "border-dashed border-warn-line bg-warn-light/40 text-warn-ink"
      }`}
    >
      {text ?? `Add ${placeholder.toLowerCase()}`}
      {text && uncertain.has(fieldKey) && <CheckBadge />}
    </button>
  );

  const canConfirm = !!context.category && (!!context.brand || !!context.chart) && editing === null;
  const chartNeedsCheck = !!context.chart && (lowConfidence || uncertain.has("size_chart")) && !chartChecked;

  return (
    <section aria-labelledby="summary-heading" className="rounded-xl border border-line bg-white p-5 md:p-6">
      <h2 ref={heading} id="summary-heading" tabIndex={-1} className="text-lg font-semibold text-ink focus:outline-none">
        {lowConfidence ? "Check what we found" : "Here's what we found"}
      </h2>
      <p className="mt-1 text-sm text-body">Tap anything that is wrong to fix it.</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {chip("brand", context.brand, "Brand", "brand")}
        {chip("productName", context.productName, "Product", "product_name")}
        {chip("category", context.category ? CATEGORY_LABELS[context.category] : null, "Type", "category")}
        {chip("sizeRange", context.sizeRange ? RANGE_LABELS[context.sizeRange] : null, "Size range", "size_range")}
      </div>

      {editing && (
        <div className="mt-3 rounded-lg border border-line bg-wash p-3">
          {editing === "brand" && (
            <label className="block text-[13.5px] font-medium">
              Brand
              <input
                autoFocus
                list={listId}
                maxLength={80}
                defaultValue={context.brand ?? ""}
                onBlur={(e) => onChange({ brand: e.target.value.trim() || null })}
                onKeyDown={(e) => e.key === "Enter" && (e.currentTarget.blur(), setEditing(null))}
                className={inputClass}
              />
              <datalist id={listId}>
                {STORED_BRANDS.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </label>
          )}
          {editing === "productName" && (
            <label className="block text-[13.5px] font-medium">
              Product
              <input
                autoFocus
                maxLength={120}
                defaultValue={context.productName ?? ""}
                onBlur={(e) => onChange({ productName: e.target.value.trim() || null })}
                onKeyDown={(e) => e.key === "Enter" && (e.currentTarget.blur(), setEditing(null))}
                className={inputClass}
              />
            </label>
          )}
          {editing === "category" && (
            <label className="block text-[13.5px] font-medium">
              Type of item
              <select
                autoFocus
                value={context.category ?? ""}
                onChange={(e) => onChange({ category: (e.target.value || null) as SizingCategory | null })}
                className={inputClass}
              >
                <option value="">Choose one</option>
                {(Object.keys(CATEGORY_LABELS) as SizingCategory[]).map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </label>
          )}
          {editing === "sizeRange" && (
            <label className="block text-[13.5px] font-medium">
              Size range
              <select
                autoFocus
                value={context.sizeRange ?? ""}
                onChange={(e) => onChange({ sizeRange: (e.target.value || null) as PurchaseContext["sizeRange"] })}
                className={inputClass}
              >
                <option value="">Not sure</option>
                <option value="womens">Women&apos;s</option>
                <option value="mens">Men&apos;s</option>
                <option value="unisex">Unisex</option>
              </select>
            </label>
          )}
          <button
            type="button"
            onClick={() => setEditing(null)}
            className="mt-2 min-h-10 rounded-lg bg-cobalt px-3.5 text-sm font-medium text-white hover:bg-cobalt-deep"
          >
            Done
          </button>
        </div>
      )}

      <div className="mt-4 rounded-lg border border-line px-3.5 py-3 text-sm">
        {context.chart ? (
          chartNeedsCheck ? (
            <div>
              <p className="font-medium text-ink">Does this match the chart in your screenshot?</p>
              <ChartTable chart={{ ...context.chart, brand: context.brand ?? context.chart.brand }} unit={unit} />
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setChartChecked(true)}
                  className="min-h-10 rounded-lg border border-cobalt px-3.5 font-medium text-cobalt hover:bg-cobalt-light"
                >
                  Yes, it matches
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ chart: null })}
                  className="min-h-10 rounded-lg border border-line px-3.5 font-medium text-ink hover:border-cobalt"
                >
                  No, ignore this chart
                </button>
              </div>
            </div>
          ) : (
            <details>
              <summary className="min-h-10 cursor-pointer py-1 font-medium text-ink">
                Size chart found in your screenshot, {context.chart.rows.length} sizes
              </summary>
              <ChartTable chart={{ ...context.chart, brand: context.brand ?? context.chart.brand }} unit={unit} />
              <button
                type="button"
                onClick={() => onChange({ chart: null })}
                className="mt-2 min-h-10 text-mute underline underline-offset-2 hover:text-ink"
              >
                Ignore this chart
              </button>
            </details>
          )
        ) : (
          <div>
            {extraction?.chartDropped ? (
              <p className="text-body">
                We saw a size chart but could not read it reliably, so we will not use it.
              </p>
            ) : (
              <p className="text-body">Got the size chart? Screenshot that too for a more accurate result.</p>
            )}
            <button
              type="button"
              onClick={onAddScreenshot}
              disabled={merging}
              className="mt-2 min-h-10 rounded-lg border border-line px-3.5 font-medium text-cobalt hover:border-cobalt disabled:opacity-50"
            >
              {merging ? "Reading the chart..." : "Add a size chart screenshot"}
            </button>
          </div>
        )}
      </div>

      {error && <p role="alert" className="mt-3 text-sm text-bad">{error}</p>}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onConfirm}
          disabled={!canConfirm || merging || chartNeedsCheck}
          className="min-h-11 rounded-lg bg-cobalt px-4 text-sm font-medium text-white transition hover:bg-cobalt-deep disabled:opacity-40"
        >
          Looks right, find my size
        </button>
        <button type="button" onClick={onStartOver} className="min-h-10 text-sm text-mute underline underline-offset-2 hover:text-ink">
          Start over
        </button>
      </div>
      {!canConfirm && editing === null && (
        <p className="mt-2 text-xs text-mute">
          {context.category ? "Add the brand to continue." : "Choose the type of item to continue."}
        </p>
      )}
    </section>
  );
}
