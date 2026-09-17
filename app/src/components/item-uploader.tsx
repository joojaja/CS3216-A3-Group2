"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { GarmentIcon } from "@/components/garment-icon";
import { useToast } from "@/components/toast";
import { CHECKLIST, useAnalysis } from "@/components/analysis-context";
import { AttributeFields, inputClass, type Tag } from "@/components/attribute-fields";

// Upload -> background removal on the device -> AI analysis -> user confirms
// or corrects -> save. The AI output is a suggestion; the confirmed form is
// what gets stored. All state lives in AnalysisProvider so it survives
// switching tabs.
export function ItemUploader() {
  const router = useRouter();
  const { toast } = useToast();
  const {
    step,
    file,
    preview,
    original,
    originalPreview,
    cleaned,
    cleanedPreview,
    cropped,
    croppedPreview,
    choice,
    bg,
    crop,
    attrs,
    aiTouched,
    edited,
    notes,
    error,
    done,
    pickFile,
    chooseImage,
    skipClean,
    retryClean,
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
  const removing = bg.status === "running";
  const cropping = crop.status === "running";
  const preparing = removing || cropping;
  const busy = step === "analyzing" || step === "saving";

  // Every version of the photo the user can pick from, once there are two
  const choices = [
    originalPreview && { key: "original" as const, label: "Original", src: originalPreview },
    cropped && croppedPreview && { key: "cropped" as const, label: "Cropped to item", src: croppedPreview },
    cleaned && cleanedPreview && { key: "cleaned" as const, label: "Background removed", src: cleanedPreview },
  ].filter((c): c is { key: "original" | "cropped" | "cleaned"; label: string; src: string } => Boolean(c));

  function tagFor(key: string): Tag {
    if (!aiTouched || edited.has(key)) return null;
    return uncertain.has(key) ? "low" : "ok";
  }

  const progressLabel =
    bg.phase === "download"
      ? `Downloading the model, ${Math.round(bg.progress * 100)}%`
      : "Removing the background";

  return (
    <div className="grid gap-6 md:grid-cols-[300px_1fr] md:gap-8">
      {/* Photo tile with scan */}
      <div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
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
          {preparing && (
            <span className="absolute inset-x-0 bottom-0 z-20 bg-ink/70 px-3 py-2 text-left text-xs text-white">
              <span className="block truncate">{cropping ? "Finding the garment" : progressLabel}</span>
              <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-white/25">
                <motion.span
                  className="block h-full rounded-full bg-tangerine"
                  animate={{
                    width: removing && bg.phase === "download" ? `${Math.max(4, bg.progress * 100)}%` : "100%",
                  }}
                  transition={{ ease: "linear", duration: 0.2 }}
                />
              </span>
            </span>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
          className="sr-only"
        />

        {/* Every available version, once there is a choice to make */}
        <AnimatePresence>
          {choices.length > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mt-3 grid gap-2 ${choices.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}
              role="radiogroup"
              aria-label="Which photo to use"
            >
              {choices.map((c) => (
                <Choice
                  key={c.key}
                  label={c.label}
                  src={c.src}
                  selected={choice === c.key}
                  disabled={busy}
                  onClick={() => chooseImage(c.key)}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-2.5 text-xs leading-relaxed text-mute">
          {!original &&
            "JPEG, PNG, WebP or HEIC up to 8 MB. One item per photo. For the cleanest cutout, lay it flat on a plain surface that contrasts with its colour."}
          {original && removing && "Happens on your device. The photo does not leave your browser for this step."}
          {original && cropping && "Couldn't separate the garment from the background. Finding it in the photo to crop instead."}
          {original && !preparing && bg.status === "done" && `${file?.name}, ${((file?.size ?? 0) / 1024 / 1024).toFixed(1)} MB`}
          {original && bg.status === "skipped" && "Using the original photo."}
          {original && !preparing && (bg.status === "failed" || bg.status === "unsupported") && (
            <>
              {bg.message}
              {bg.status === "failed" && crop.status !== "done" && (
                <>
                  {" "}
                  <button type="button" onClick={retryClean} className="font-medium text-cobalt hover:underline">
                    Try again
                  </button>
                </>
              )}
            </>
          )}
        </p>
      </div>

      <div className="grid gap-4 content-start">
        {error && <p className="text-sm text-bad">{error}</p>}

        {step === "pick" && (
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={analyze}
              disabled={!file || preparing}
              className="rounded-lg bg-cobalt px-4 py-2.5 text-sm font-medium text-white transition hover:bg-cobalt-deep disabled:opacity-40"
            >
              Analyze with AI
            </button>
            {preparing && (
              <button
                type="button"
                onClick={skipClean}
                className="rounded-lg border border-line px-4 py-2.5 text-sm font-medium transition hover:bg-wash"
              >
                Skip, use original
              </button>
            )}
            {!original && <p className="text-xs text-mute">Pick a photo first.</p>}
            {preparing && (
              <p className="basis-full text-xs text-mute">
                Analysis starts once the photo is prepared, or skip to use it as shot.
              </p>
            )}
          </div>
        )}

        {step === "analyzing" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-4">
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

              <AttributeFields attrs={attrs} onChange={setField} tagFor={tagFor} disabled={step === "saving"} />

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

function Choice({
  label,
  src,
  selected,
  disabled,
  onClick,
}: {
  label: string;
  src: string;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onClick}
      className={`overflow-hidden rounded-lg border-2 text-left transition disabled:opacity-60 ${
        selected ? "border-cobalt" : "border-line hover:border-cobalt-faint"
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={label} className="aspect-square w-full bg-wash object-cover" />
      <span
        className={`block px-2 py-1.5 text-[11.5px] font-medium ${
          selected ? "bg-cobalt text-white" : "text-mute"
        }`}
      >
        {label}
      </span>
    </button>
  );
}
