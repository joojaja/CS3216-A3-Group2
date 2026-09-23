"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { trackFunnel } from "@/lib/analytics";
import { Choice, MeasurementWizard } from "@/components/measurement-wizard";
import { PurchaseSummary } from "@/components/purchase-summary";
import { SizeResult } from "@/components/size-result";
import { inputClass } from "@/components/measurement-step";
import { useSizing } from "@/components/sizing-context";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/image/validate";
import { CATEGORY_FIELDS, CATEGORY_LABELS } from "@/lib/sizing/categories";
import { STORED_BRANDS, STORED_CHARTS, findChart, normaliseBrand } from "@/lib/sizing/charts";
import { validateChart } from "@/lib/sizing/chart-schema";
import { chartForContext } from "@/lib/sizing/extraction";
import { MEASUREMENT_BY_KEY } from "@/lib/sizing/measurements";
import { recommendSize } from "@/lib/sizing/match";
import { hasAnyMeasurement } from "@/lib/sizing/row";
import type { MeasurementKey, MeasurementProfile, PurchaseContext, SizeRange, SizingCategory } from "@/lib/sizing/types";

const CATEGORY_OPTIONS = (Object.keys(CATEGORY_LABELS) as SizingCategory[]).map((value) => ({
  value,
  label: CATEGORY_LABELS[value],
}));

function listText(items: string[]) {
  return items.length > 1 ? `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}` : items[0];
}

const rangeName = (r: string) => (r === "mens" ? "men's" : r === "womens" ? "women's" : "unisex");

// Picks the chart for a confirmed item and matches it. The product's own
// chart from a screenshot comes first, then the stored brand chart
function resolve(ctx: PurchaseContext | null, profile: MeasurementProfile | null) {
  if (!ctx?.category) return null;

  const productChart = chartForContext(ctx);
  if (productChart && validateChart(productChart).ok) {
    return { kind: "match" as const, chart: productChart, rec: recommendSize(profile, productChart, ctx.category) };
  }

  if (!ctx.brand) return { kind: "unknown_brand" as const };
  const brandCharts = STORED_CHARTS.filter((c) => c.brandKey === normaliseBrand(ctx.brand!));
  if (brandCharts.length === 0) return { kind: "unknown_brand" as const };

  const forCategory = brandCharts.filter((c) => c.category === ctx.category);
  if (forCategory.length === 0) {
    const available = [...new Set(brandCharts.map((c) => CATEGORY_LABELS[c.category].toLowerCase()))];
    return { kind: "no_category" as const, brandName: brandCharts[0].brand, available };
  }

  const range = ctx.sizeRange === "unisex" ? null : ctx.sizeRange;
  const chart = findChart(ctx.brand, ctx.category, range);
  if (!chart) {
    const ranges = [...new Set(forCategory.map((c) => c.sizeRange))];
    return range ? { kind: "no_range" as const, brandName: forCategory[0].brand, ranges } : { kind: "need_range" as const };
  }
  if (!validateChart(chart).ok) return { kind: "unusable" as const };
  return { kind: "match" as const, chart, rec: recommendSize(profile, chart, ctx.category) };
}

// "Add what you're buying": a screenshot (read by the vision model into a
// PurchaseContext the user confirms) or the manual brand picker. Both feed
// the same resolve and match. Matching runs here in the browser on the
// user's own profile, so measurements are never sent anywhere to get a size.
export function SizingFlow({
  initialProfile,
  configured,
}: {
  initialProfile: MeasurementProfile | null;
  configured: boolean;
}) {
  const sizing = useSizing();
  const [profile, setProfile] = useState(initialProfile);
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState<SizingCategory | null>(null);
  const [sizeRange, setSizeRange] = useState<SizeRange | null>(initialProfile?.sizeRange ?? null);
  const [formError, setFormError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const mergeNext = useRef(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const uploadButton = useRef<HTMLButtonElement>(null);
  const brandId = useId();
  const listId = useId();

  const ready = sizing.status === "ready" ? sizing.context : null;
  const outcome = useMemo(() => resolve(ready, profile), [ready, profile]);
  const unit = profile?.unit ?? "cm";
  const reviewing =
    !!sizing.context && (sizing.status === "review" || (sizing.status === "reading" && sizing.merging));

  // Move focus to the answer once an item is confirmed
  const answer = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (sizing.status === "ready") answer.current?.focus();
  }, [sizing.status, sizing.context]);

  // Records the result of a completed lookup once, when a match or a known
  // gap (no chart, no brand, and so on) is reached
  useEffect(() => {
    if (ready && outcome) trackFunnel("sizing_result", { result: outcome.kind });
  }, [ready, outcome]);

  function pickFile(file: File | null | undefined, merge: boolean) {
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.has(file.type) || file.size > MAX_IMAGE_BYTES) {
      setFileError("Use a JPEG, PNG, WebP or HEIC image under 8 MB.");
      return;
    }
    setFileError(null);
    // Adding a size-chart screenshot to an item already picked is part of
    // the same lookup, not a new one
    if (!merge) trackFunnel("sizing_requested", { source: "screenshot" });
    sizing.readScreenshot(file, merge);
  }

  function chooseFile(merge: boolean) {
    mergeNext.current = merge;
    fileInput.current?.click();
  }

  // Clears the answer and returns to the input. The manual form keeps its
  // values so the user can adjust one and ask again
  function closeResult() {
    sizing.reset();
    uploadButton.current?.focus();
  }

  function submitManual(e: React.FormEvent) {
    e.preventDefault();
    if (!brand.trim()) return setFormError("Enter the brand you are buying from.");
    if (!category) return setFormError("Pick what kind of item it is.");
    setFormError(null);
    trackFunnel("sizing_requested", { source: "manual" });
    sizing.startManual({
      source: "manual",
      brand: brand.trim(),
      productName: null,
      category,
      sizeRange,
      chart: null,
      extraction: null,
    });
  }

  return (
    <div className="grid gap-5">
      <section aria-labelledby="add-heading" className="rounded-xl border border-line bg-white p-5 md:p-6">
        <h2 id="add-heading" className="text-lg font-semibold text-ink">Add what you&apos;re buying</h2>
        <p className="mt-1 text-sm text-body">
          Screenshot the product page in Shopee, Zara or any shop app. We read the brand and any size chart on it.
        </p>

        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            pickFile(e.target.files?.[0], mergeNext.current);
            e.target.value = "";
          }}
        />
        <button
          ref={uploadButton}
          type="button"
          onClick={() => chooseFile(false)}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            pickFile(e.dataTransfer.files?.[0], false);
          }}
          disabled={sizing.status === "reading"}
          className={`mt-4 grid min-h-28 w-full place-items-center rounded-xl border-2 border-dashed px-4 py-5 text-center transition ${
            dragging ? "border-cobalt bg-cobalt-light/50" : "border-line hover:border-cobalt"
          } disabled:cursor-progress`}
        >
          {sizing.status === "reading" && !sizing.merging ? (
            <span role="status" className="text-sm font-medium text-cobalt">
              Reading your screenshot...
            </span>
          ) : (
            <span className="text-sm text-body">
              <span className="block font-medium text-cobalt">Upload a screenshot</span>
              <span className="mt-0.5 block text-xs text-mute">or drop it here. JPEG, PNG, WebP or HEIC up to 8 MB.</span>
            </span>
          )}
        </button>
        <p className="mt-2 text-xs text-mute">
          We send the screenshot to Google Gemini to read the product. Wearabouts never saves it.
        </p>
        {(fileError || (sizing.status === "error" && sizing.error)) && (
          <p role="alert" className="mt-2 text-sm text-bad">{fileError ?? sizing.error}</p>
        )}

        <details className="mt-4 border-t border-line pt-3" open={!configured || undefined}>
          <summary className="min-h-10 cursor-pointer py-2 text-sm font-medium text-ink">Or pick the brand yourself</summary>
          <form onSubmit={submitManual} noValidate className="mt-2 grid gap-4">
            <label htmlFor={brandId} className="block text-[13.5px] font-medium">
              Brand
              <input
                id={brandId}
                list={listId}
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                autoComplete="off"
                placeholder="For example H&M"
                maxLength={80}
                className={inputClass}
              />
              <datalist id={listId}>
                {STORED_BRANDS.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </label>
            <Choice<SizingCategory | null> legend="What is it?" value={category} onChange={setCategory} options={CATEGORY_OPTIONS} />
            <Choice<SizeRange | null>
              legend="Size range"
              value={sizeRange}
              onChange={setSizeRange}
              options={[
                { value: "womens", label: "Women's" },
                { value: "mens", label: "Men's" },
                { value: null, label: "Not sure" },
              ]}
            />
            {formError && <p role="alert" className="text-sm text-bad">{formError}</p>}
            <div>
              <button type="submit" className="min-h-11 rounded-lg bg-cobalt px-4 text-sm font-medium text-white transition hover:bg-cobalt-deep">
                Find my size
              </button>
            </div>
          </form>
        </details>
      </section>

      {reviewing && sizing.context && (
        <PurchaseSummary
          context={sizing.context}
          unit={unit}
          merging={sizing.merging}
          error={sizing.error}
          onChange={sizing.update}
          onConfirm={sizing.confirm}
          onAddScreenshot={() => chooseFile(true)}
          onStartOver={sizing.reset}
        />
      )}

      <div ref={answer} tabIndex={-1} aria-live="polite" aria-label="Your size" className="grid gap-3 focus:outline-none">
        {ready && (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-body">
              {[ready.brand, ready.productName, ready.category && CATEGORY_LABELS[ready.category]].filter(Boolean).join(", ")}.
              {ready.source === "screenshot" && (
                <>
                  {" "}
                  <button type="button" onClick={sizing.edit} className="font-medium text-cobalt underline underline-offset-2">
                    Change
                  </button>
                </>
              )}
            </p>
            <button
              type="button"
              onClick={closeResult}
              aria-label="Close your size result"
              className="grid size-9 shrink-0 place-items-center rounded-full border border-line bg-white transition hover:border-cobalt"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        )}

        {outcome?.kind === "unknown_brand" && (
          <Notice title={ready?.brand ? `We do not have ${ready.brand}'s size chart yet` : "We need the brand or a size chart"}>
            Screenshot the size chart on the product page and we will use that. We have stored charts for {listText(STORED_BRANDS)}.
            {ready?.source === "screenshot" && (
              <>
                {" "}
                <button
                  type="button"
                  onClick={() => {
                    sizing.edit();
                    chooseFile(true);
                  }}
                  className="font-medium text-cobalt underline underline-offset-2"
                >
                  Add a size chart screenshot
                </button>
              </>
            )}
          </Notice>
        )}

        {outcome?.kind === "no_category" && (
          <Notice title={`No ${CATEGORY_LABELS[ready!.category!].toLowerCase()} chart for ${outcome.brandName}`}>
            We have {outcome.brandName} charts for {listText(outcome.available)}. A screenshot of this item&apos;s size chart also works.
          </Notice>
        )}

        {outcome?.kind === "no_range" && (
          <Notice title={`No ${rangeName(ready!.sizeRange!)} chart for this ${outcome.brandName} item`}>
            We only have the {listText(outcome.ranges.map(rangeName))} chart for this item.
          </Notice>
        )}

        {outcome?.kind === "need_range" && (
          <section className="rounded-xl border border-line bg-white p-5">
            <h2 className="text-base font-semibold text-ink">Which size range?</h2>
            <p className="mt-1 text-sm text-body">This brand sizes men&apos;s and women&apos;s clothes differently.</p>
            <div className="mt-3">
              <Choice<SizeRange | null>
                legend="Size range"
                value={null}
                onChange={(next) => sizing.update({ sizeRange: next })}
                options={[
                  { value: "womens", label: "Women's" },
                  { value: "mens", label: "Men's" },
                ]}
              />
            </div>
          </section>
        )}

        {outcome?.kind === "unusable" && (
          <Notice title="We could not use this chart">
            Something in the stored chart looks wrong, so we will not guess a size from it. Check the size chart on the product page.
          </Notice>
        )}

        {outcome?.kind === "match" && outcome.rec.status === "needs_measurements" && (
          <MissingMeasurements
            profile={profile}
            category={ready!.category!}
            fields={outcome.rec.fields}
            configured={configured}
            onSaved={setProfile}
          />
        )}

        {outcome?.kind === "match" && outcome.rec.status === "chart_unusable" && (
          <Notice title="This chart does not cover your measurements">
            The {outcome.chart.brand} chart does not list any measurement you have saved for this item.{" "}
            <Link href="/profile/measurements" className="font-medium text-cobalt underline underline-offset-2">
              Add more measurements
            </Link>
          </Notice>
        )}

        {outcome?.kind === "match" && outcome.rec.status === "ok" && (
          <SizeResult key={`${outcome.chart.key}-${outcome.rec.size}`} rec={outcome.rec} chart={outcome.chart} unit={unit} />
        )}
      </div>
    </div>
  );
}

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-white p-5">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      <p className="mt-1 text-sm text-body">{children}</p>
    </section>
  );
}

// Asks only for what this size needs. With nothing saved yet, that is every
// measurement the category uses; otherwise just the missing ones. Saving
// resumes the same question with no retyping and no second screenshot read
function MissingMeasurements({
  profile,
  category,
  fields,
  configured,
  onSaved,
}: {
  profile: MeasurementProfile | null;
  category: SizingCategory;
  fields: MeasurementKey[];
  configured: boolean;
  onSaved: (p: MeasurementProfile) => void;
}) {
  const first = !hasAnyMeasurement(profile);
  const { required, optional } = CATEGORY_FIELDS[category];
  const ask = first ? [...required, ...optional] : fields;
  const names = listText(ask.map((k) => MEASUREMENT_BY_KEY[k].label.toLowerCase()));

  return (
    <section aria-labelledby="missing-heading" className="grid gap-3">
      <div className="rounded-xl border border-cobalt-faint bg-cobalt-light/40 px-5 py-4">
        <h2 id="missing-heading" className="text-base font-semibold text-ink">
          {first ? "Add your measurements first" : `We need your ${names}`}
        </h2>
        <p className="mt-1 text-sm text-body">
          {first
            ? `For ${CATEGORY_LABELS[category].toLowerCase()} we use your ${names}. You only do this once, and you can skip the optional ones.`
            : "Measure once and we will show your size straight after."}
          {!configured && " This is a preview, so the numbers are used for this visit only."}
        </p>
      </div>
      <MeasurementWizard key={ask.join(",")} initial={profile} fields={ask} onSaved={onSaved} persist={configured} />
    </section>
  );
}
