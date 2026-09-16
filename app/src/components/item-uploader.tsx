"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  CLOTHING_CATEGORIES,
  FORMALITY_LEVELS,
  LAYERING_ROLES,
  WEATHER_TAGS,
  type ClothingAttributes,
} from "@/lib/schemas/ai";
import { GarmentIcon } from "@/components/garment-icon";
import { useToast } from "@/components/toast";
import { CHECKLIST, useAnalysis } from "@/components/analysis-context";

const inputClass =
  "mt-1.5 block w-full rounded-lg border px-3 py-2.5 text-sm font-normal transition focus:border-cobalt focus:outline-none focus:ring-[3px] focus:ring-cobalt-light";

type Tag = "ok" | "low" | null;

function ConfidenceTag({ tag }: { tag: Tag }) {
  if (!tag) return null;
  return (
    <span
      className={`absolute top-0 right-0 rounded-md px-2 py-0.5 text-[11px] font-medium ${
        tag === "low" ? "bg-warn-light text-warn" : "bg-cobalt-light text-cobalt-deep"
      }`}
    >
      {tag === "low" ? "Check this" : "AI drafted"}
    </span>
  );
}

function Field({
  label,
  tag,
  children,
}: {
  label: string;
  tag: Tag;
  children: React.ReactNode;
}) {
  return (
    <label className="relative block text-[13.5px] font-medium">
      {label}
      <ConfidenceTag tag={tag} />
      {children}
    </label>
  );
}

// Upload -> AI analysis -> user confirms or corrects -> save.
// The AI output is a suggestion; the confirmed form is what gets stored.
// All state lives in AnalysisProvider so it survives switching tabs.
export function ItemUploader() {
  const router = useRouter();
  const { toast } = useToast();
  const {
    step,
    file,
    preview,
    attrs,
    aiTouched,
    edited,
    notes,
    error,
    done,
    pickFile,
    analyze,
    setField,
    setNotes,
    setStep,
    setError,
    reset,
  } = useAnalysis();
  const inputRef = useRef<HTMLInputElement>(null);

  async function save() {
    if (!file) return;
    setStep("saving");
    setError(null);

    const form = new FormData();
    form.set("image", file);
    form.set("payload", JSON.stringify(attrs));
    form.set("user_notes", notes);

    const res = await fetch("/api/items", { method: "POST", body: form });
    const body = await res.json();

    if (!res.ok) {
      setError(body.error ?? "Could not save item");
      setStep("review");
      return;
    }

    reset();
    toast("Saved to your wardrobe");
    router.push("/wardrobe");
    router.refresh();
  }

  const uncertain = new Set(attrs.uncertain_fields);
  const reviewing = step === "review" || step === "saving";

  function tagFor(key: string): Tag {
    if (!aiTouched || edited.has(key)) return null;
    return uncertain.has(key) ? "low" : "ok";
  }

  function fieldClass(name: string) {
    return `${inputClass} ${
      tagFor(name) === "low" ? "border-warn-line bg-[#FFFBEF]" : "border-line bg-white"
    }`;
  }

  return (
    <div className="grid gap-6 md:grid-cols-[300px_1fr] md:gap-8">
      {/* Photo tile with scan */}
      <div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={step === "analyzing" || step === "saving"}
          className={`relative grid aspect-square w-full max-w-[170px] place-items-center overflow-hidden rounded-xl border text-center md:aspect-[4/5] md:max-w-none ${
            preview ? "border-line bg-wash" : "border-dashed border-line bg-wash hover:border-cobalt"
          }`}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Item preview" className="size-full object-cover" />
          ) : (
            <span className="px-5 text-sm leading-relaxed text-mute">
              <GarmentIcon kind="shirt" className="mx-auto mb-3 w-12 text-cobalt" />
              Choose a photo
            </span>
          )}
          {step === "analyzing" && (
            <>
              <span className="absolute inset-0 z-10 animate-veil bg-ink/40" />
              <span className="absolute inset-x-0 top-0 z-20 h-[3px] animate-beam bg-white shadow-[0_0_18px_4px_rgba(37,73,232,0.55)]" />
            </>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
          className="sr-only"
        />
        <p className="mt-2.5 text-xs leading-relaxed text-mute">
          {file
            ? `${file.name}, ${(file.size / 1024 / 1024).toFixed(1)} MB`
            : "JPEG, PNG, WebP or HEIC up to 8 MB. One item per photo works best."}
        </p>
      </div>

      <div className="grid gap-4 content-start">
        {error && <p className="text-sm text-bad">{error}</p>}

        {step === "pick" && (
          <div>
            <button
              onClick={analyze}
              disabled={!file}
              className="rounded-lg bg-cobalt px-4 py-2.5 text-sm font-medium text-white transition hover:bg-cobalt-deep disabled:opacity-40"
            >
              Analyze with AI
            </button>
            {!file && (
              <p className="mt-2 text-xs text-mute">Pick a photo first.</p>
            )}
          </div>
        )}

        {step === "analyzing" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid gap-4"
          >
            <p className="flex items-center gap-3 text-sm text-mute">
              <span className="size-[18px] animate-spin rounded-full border-[2.5px] border-line border-t-cobalt" />
              Extracting attributes. This takes a few seconds.
            </p>
            <ul className="grid gap-2.5">
              {CHECKLIST.map((label, i) => {
                const isDone = i < done;
                return (
                  <li
                    key={label}
                    className={`flex items-center gap-3 text-sm transition-colors ${isDone ? "text-ink" : "text-mute"}`}
                  >
                    <span
                      className={`grid size-[18px] shrink-0 place-items-center rounded-full border-2 transition-colors ${
                        isDone ? "border-cobalt bg-cobalt" : "border-line"
                      }`}
                    >
                      <span
                        className={`size-1.5 rounded-full bg-white transition-transform ${isDone ? "scale-100" : "scale-0"}`}
                      />
                    </span>
                    {label}
                  </li>
                );
              })}
            </ul>
            {/* Skeleton of the review form to come */}
            <div className="grid gap-3.5 opacity-80">
              <div className="shim h-[52px]" />
              <div className="grid grid-cols-2 gap-3.5">
                <div className="shim h-[58px]" />
                <div className="shim h-[58px]" />
                <div className="shim h-[58px]" />
                <div className="shim h-[58px]" />
              </div>
              <div className="shim h-9 w-3/5" />
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {reviewing && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid gap-4"
            >
              <div className="rounded-[10px] border border-warn-line bg-warn-light px-4 py-3 text-[13.5px] leading-relaxed text-warn-ink">
                These details were generated by AI and can be wrong. Check and
                correct them before saving.
                {attrs.confidence_notes && ` AI notes: ${attrs.confidence_notes}`}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-mute">
                <span className="flex items-center gap-1.5">
                  <i className="inline-block size-2.5 rounded-[3px] bg-cobalt-light" />
                  AI drafted, confident
                </span>
                <span className="flex items-center gap-1.5">
                  <i className="inline-block size-2.5 rounded-[3px] bg-warn-light" />
                  AI drafted, check this
                </span>
              </div>

              <div className="grid gap-3.5 sm:grid-cols-2">
                <Field label="Category" tag={tagFor("category")}>
                  <select
                    value={attrs.category}
                    onChange={(e) => {
                      setField("category", e.target.value as ClothingAttributes["category"]);
                    }}
                    className={fieldClass("category")}
                  >
                    {CLOTHING_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Subcategory" tag={tagFor("subcategory")}>
                  <input
                    value={attrs.subcategory}
                    onChange={(e) => { setField("subcategory", e.target.value); }}
                    placeholder="e.g. t-shirt, chinos, sundress"
                    className={fieldClass("subcategory")}
                  />
                </Field>

                <Field label="Primary colour" tag={tagFor("primary_colour")}>
                  <input
                    value={attrs.primary_colour}
                    onChange={(e) => { setField("primary_colour", e.target.value); }}
                    className={fieldClass("primary_colour")}
                  />
                </Field>

                <Field label="Secondary colours (comma separated)" tag={tagFor("secondary_colours")}>
                  <input
                    value={attrs.secondary_colours.join(", ")}
                    onChange={(e) => {
                      setField(
                        "secondary_colours",
                        e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                      );
                    }}
                    className={fieldClass("secondary_colours")}
                  />
                </Field>

                <Field label="Pattern" tag={tagFor("pattern")}>
                  <input
                    value={attrs.pattern}
                    onChange={(e) => { setField("pattern", e.target.value); }}
                    className={fieldClass("pattern")}
                  />
                </Field>

                <Field label="Material cues" tag={tagFor("material_cues")}>
                  <input
                    value={attrs.material_cues}
                    onChange={(e) => { setField("material_cues", e.target.value); }}
                    className={fieldClass("material_cues")}
                  />
                </Field>

                <Field label="Formality" tag={tagFor("formality")}>
                  <select
                    value={attrs.formality}
                    onChange={(e) => {
                      setField("formality", e.target.value as ClothingAttributes["formality"]);
                    }}
                    className={fieldClass("formality")}
                  >
                    {FORMALITY_LEVELS.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Layering role" tag={tagFor("layering_role")}>
                  <select
                    value={attrs.layering_role}
                    onChange={(e) => {
                      setField("layering_role", e.target.value as ClothingAttributes["layering_role"]);
                    }}
                    className={fieldClass("layering_role")}
                  >
                    {LAYERING_ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <fieldset>
                <legend className="relative block w-full text-[13.5px] font-medium">
                  Suitable weather
                  <ConfidenceTag tag={tagFor("weather_tags")} />
                </legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {WEATHER_TAGS.map((tag) => {
                    const on = attrs.weather_tags.includes(tag);
                    return (
                      <label
                        key={tag}
                        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[13px] transition ${
                          on ? "border-cobalt bg-cobalt-light text-cobalt-deep" : "border-line"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={(e) => {
                            setField(
                              "weather_tags",
                              e.target.checked
                                ? [...attrs.weather_tags, tag]
                                : attrs.weather_tags.filter((t) => t !== tag),
                            );
                          }}
                          className="accent-cobalt"
                        />
                        {tag}
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <label className="block text-[13.5px] font-medium">
                Your notes (optional)
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Anything the photo does not show"
                  className={`${inputClass} border-line bg-white`}
                />
              </label>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={save}
                  disabled={step === "saving"}
                  className="rounded-lg bg-cobalt px-4 py-2.5 text-sm font-medium text-white transition hover:bg-cobalt-deep disabled:opacity-50"
                >
                  {step === "saving" ? "Saving..." : "Confirm and save to wardrobe"}
                </button>
                <button
                  type="button"
                  onClick={() => pickFile(null)}
                  disabled={step === "saving"}
                  className="rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-wash disabled:opacity-50"
                >
                  Discard
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
