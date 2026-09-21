"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Choice, MeasurementWizard } from "@/components/measurement-wizard";
import { SizeResult } from "@/components/size-result";
import { inputClass } from "@/components/measurement-step";
import { CATEGORY_FIELDS, CATEGORY_LABELS } from "@/lib/sizing/categories";
import { STORED_BRANDS, STORED_CHARTS, findChart, normaliseBrand } from "@/lib/sizing/charts";
import { validateChart } from "@/lib/sizing/chart-schema";
import { MEASUREMENT_BY_KEY } from "@/lib/sizing/measurements";
import { recommendSize } from "@/lib/sizing/match";
import { hasAnyMeasurement } from "@/lib/sizing/row";
import type { MeasurementKey, MeasurementProfile, SizeRange, SizingCategory } from "@/lib/sizing/types";

type Query = { brand: string; category: SizingCategory; sizeRange: SizeRange | null };

const CATEGORY_OPTIONS = (Object.keys(CATEGORY_LABELS) as SizingCategory[]).map((value) => ({
  value,
  label: CATEGORY_LABELS[value],
}));

function listText(items: string[]) {
  return items.length > 1 ? `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}` : items[0];
}

// The manual brand and category picker plus everything after it: missing
// measurements, the chart lookup and the result. Matching runs here in the
// browser on the user's own profile and the public stored charts, so the
// measurements are never sent anywhere to get a size.
export function SizingFlow({
  initialProfile,
  configured,
}: {
  initialProfile: MeasurementProfile | null;
  configured: boolean;
}) {
  const [profile, setProfile] = useState(initialProfile);
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState<SizingCategory | null>(null);
  const [sizeRange, setSizeRange] = useState<SizeRange | null>(initialProfile?.sizeRange ?? null);
  const [query, setQuery] = useState<Query | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const brandId = useId();
  const listId = useId();

  const outcome = useMemo(() => {
    if (!query) return null;
    const brandKey = normaliseBrand(query.brand);
    const brandCharts = STORED_CHARTS.filter((c) => c.brandKey === brandKey);
    if (brandCharts.length === 0) return { kind: "unknown_brand" as const };

    const forCategory = brandCharts.filter((c) => c.category === query.category);
    if (forCategory.length === 0) {
      const available = [...new Set(brandCharts.map((c) => CATEGORY_LABELS[c.category].toLowerCase()))];
      return { kind: "no_category" as const, brandName: brandCharts[0].brand, available };
    }

    const chart = findChart(query.brand, query.category, query.sizeRange);
    if (!chart) {
      const ranges = [...new Set(forCategory.map((c) => c.sizeRange))];
      return query.sizeRange
        ? { kind: "no_range" as const, brandName: forCategory[0].brand, ranges }
        : { kind: "need_range" as const };
    }
    if (!validateChart(chart).ok) return { kind: "unusable" as const };

    return { kind: "match" as const, chart, rec: recommendSize(profile, chart, query.category) };
  }, [query, profile]);

  // Move focus to the answer each time a new question is asked
  const answer = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (query) answer.current?.focus();
  }, [query]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!brand.trim()) return setFormError("Enter the brand you are buying from.");
    if (!category) return setFormError("Pick what kind of item it is.");
    setFormError(null);
    setQuery({ brand: brand.trim(), category, sizeRange });
  }

  function pickRange(next: SizeRange | null) {
    setSizeRange(next);
    if (query) setQuery({ ...query, sizeRange: next });
  }

  const unit = profile?.unit ?? "cm";
  const rangeName = (r: string) => (r === "mens" ? "men's" : r === "womens" ? "women's" : "unisex");

  return (
    <div className="grid gap-5">
      <form onSubmit={submit} noValidate className="rounded-xl border border-line bg-white p-5 md:p-6">
        <h2 className="text-lg font-semibold text-ink">Add what you&apos;re buying</h2>
        <p className="mt-1 text-sm text-body">Pick the brand and the kind of item. We match it to the brand&apos;s size chart.</p>

        <div className="mt-4 grid gap-4">
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
        </div>

        {formError && <p role="alert" className="mt-3 text-sm text-bad">{formError}</p>}

        <button type="submit" className="mt-5 min-h-11 rounded-lg bg-cobalt px-4 text-sm font-medium text-white transition hover:bg-cobalt-deep">
          Find my size
        </button>
      </form>

      <div ref={answer} tabIndex={-1} aria-live="polite" aria-label="Your size" className="focus:outline-none">
        {outcome?.kind === "unknown_brand" && (
          <Notice title={`We do not have ${query!.brand}'s size chart yet`}>
            We have charts for {listText(STORED_BRANDS)} so far. Pick one of those, or check the size chart on the product page.
          </Notice>
        )}

        {outcome?.kind === "no_category" && (
          <Notice title={`No ${CATEGORY_LABELS[query!.category].toLowerCase()} chart for ${outcome.brandName}`}>
            We have {outcome.brandName} charts for {listText(outcome.available)}.
          </Notice>
        )}

        {outcome?.kind === "no_range" && (
          <Notice title={`No ${rangeName(query!.sizeRange!)} chart for this ${outcome.brandName} item`}>
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
                onChange={pickRange}
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
            category={query!.category}
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
// resumes the same question with no retyping
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
