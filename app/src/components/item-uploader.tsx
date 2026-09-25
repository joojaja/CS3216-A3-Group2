"use client";

import { trackFunnel, isActivationMilestone } from "@/lib/analytics";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useToast } from "@/components/toast";
import { CHECKLIST, useAnalysis } from "@/components/analysis-context";
import { AttributeFields, inputClass, type Tag } from "@/components/attribute-fields";

// Upload -> background removal on the device -> AI analysis -> user confirms
// or corrects -> save. The AI output is a suggestion; the confirmed form is
// what gets stored. All state lives in AnalysisProvider so it survives
// switching tabs.
export function ItemUploader({ onSaved }: { onSaved?: (id: string) => void } = {}) {
  const router = useRouter();
  const { toast } = useToast();
  const {
    step,
    file,
    preview,
    accountTier,
    beautifyCreditsRemaining,
    original,
    originalPreview,
    cleaned,
    cleanedPreview,
    cutout,
    beautified,
    beautifiedPreview,
    choice,
    bg,
    beautify,
    requestBeautify,
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
  const cameraRef = useRef<HTMLInputElement>(null);
  const saveInFlight = useRef(false);

  function handlePhoto(file: File | null) {
    pickFile(file);
    if (inputRef.current) inputRef.current.value = "";
    if (cameraRef.current) cameraRef.current.value = "";
  }

  async function save() {
    if (!file || saveInFlight.current) return;
    saveInFlight.current = true;
    setStep("saving");
    setError(null);

    const form = new FormData();
    form.set("image", file);
    form.set("payload", JSON.stringify(attrs));
    form.set("user_notes", notes);
    // Recorded with the item so it is always clear whether the stored photo
    // is the shot itself, a cutout, a crop or an AI rendering
    form.set("image_source", choice);
    // The garment alone on transparency, for outfit cards
    if (cutout) form.set("cutout", cutout);

    try {
      const res = await fetch("/api/items", { method: "POST", body: form });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Could not save item");
        setStep("review");
        return;
      }
      if (typeof body.id !== "string") throw new Error("Invalid save response");
      const itemCount = typeof body.item_count === "number" ? body.item_count : undefined;
      trackFunnel("item_saved", itemCount === undefined ? undefined : { item_count: itemCount });
      if (itemCount !== undefined && isActivationMilestone(itemCount)) {
        trackFunnel("wardrobe_activated", { item_count: itemCount });
      }
      // The AI suggestion is only worth flagging as corrected once the user
      // has actually changed a field it populated, not just reviewed it.
      if (aiTouched && edited.size > 0) {
        trackFunnel("item_attributes_corrected", { field_count: edited.size });
      }
      reset();
      if (onSaved) { onSaved(body.id); return; }
      toast("Saved to your wardrobe");
      router.push("/wardrobe");
      router.refresh();
    } catch {
      setError("We couldn't confirm the save. Your edits are still here. Check your wardrobe before retrying if your connection dropped.");
      setStep("review");
    } finally {
      saveInFlight.current = false;
    }
  }

  const uncertain = new Set(attrs.uncertain_fields);
  const reviewing = step === "review" || step === "saving";
  const removing = bg.status === "running";
  const beautifying = beautify.status === "running";
  const preparing = removing || beautifying;
  const busy = step === "analyzing" || step === "saving";
  const beautifiedChosen = choice === "beautified";

  // The free edit is selected automatically. Clicking the main image cycles
  // through these versions, with the paid version added after Beautify.
  type ChoiceKey = "original" | "cleaned" | "beautified";
  const choices = [
    originalPreview && { key: "original" as const, label: "Original", src: originalPreview },
    cleaned && cleanedPreview && { key: "cleaned" as const, label: "Edited", src: cleanedPreview },
    beautified && beautifiedPreview && {
      key: "beautified" as const,
      label: "Beautified",
      src: beautifiedPreview,
    },
  ].filter((c): c is { key: ChoiceKey; label: string; src: string } => Boolean(c));
  const displayedVersion = choices.find((version) => version.key === choice) ?? choices[0];

  const editFailure = beautify.message;

  function handlePreviewClick() {
    if (preview && choices.length > 1) {
      const currentIndex = choices.findIndex((version) => version.key === displayedVersion?.key);
      const nextVersion = choices[(currentIndex + 1) % choices.length];
      chooseImage(nextVersion.key);
      return;
    }
    inputRef.current?.click();
  }

  function confirmBeautify() {
    const creditCopy =
      accountTier === "free" && beautifyCreditsRemaining !== null
        ? ` This will use 1 of your ${beautifyCreditsRemaining} remaining free edits.`
        : "";
    const confirmed = window.confirm(
      `Beautify this photo?${creditCopy} The image model may change small details.`,
    );
    if (confirmed) requestBeautify();
  }

  function tagFor(key: string): Tag {
    if (!aiTouched || edited.has(key)) return null;
    return uncertain.has(key) ? "low" : "ok";
  }

  const progressLabel =
    bg.phase === "download"
      ? `Removing background, ${Math.round(bg.progress * 100)}%`
      : "Removing the background";

  return (
    <div className="grid gap-6 md:grid-cols-[300px_1fr] md:gap-8">
      {/* Photo tile with scan */}
      <div>
        <div className="relative aspect-square w-full max-w-[170px] md:aspect-[4/5] md:max-w-none">
          <button
            type="button"
            onClick={handlePreviewClick}
            disabled={busy}
            aria-label={
              preview && displayedVersion
                ? `${displayedVersion.label} photo${choices.length > 1 ? ". Click to show the next version" : ""}`
                : "Choose a photo"
            }
            className={`grid size-full place-items-center overflow-hidden rounded-xl border text-center ${
              preview ? "border-line bg-wash" : "border-dashed border-line bg-wash hover:border-cobalt"
            }`}
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Item preview" className="size-full object-cover" />
            ) : (
              <span className="px-5 text-sm leading-relaxed text-mute">
                Choose a photo
              </span>
            )}
            {preview && displayedVersion && (
              <span className="absolute top-2 left-2 rounded-full bg-ink/80 px-2.5 py-1 text-[11px] font-semibold text-white">
                {displayedVersion.label}
              </span>
            )}
            {step === "analyzing" && (
              <>
                <span className="absolute inset-0 z-10 animate-veil bg-ink/40" />
                <span className="absolute inset-x-0 top-0 z-20 h-[3px] animate-beam bg-white shadow-[0_0_18px_4px_rgba(229,155,135,0.75)]" />
              </>
            )}
            {preparing && (
              <span className="absolute inset-x-0 bottom-0 z-20 bg-ink/70 px-3 py-2 text-left text-xs text-white">
                <span className="block truncate">
                  {beautifying ? "Beautifying photo" : progressLabel}
                </span>
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
            {preview && choices.length > 1 && !preparing && (
              <span className="absolute right-2 bottom-2 rounded-full bg-ink/75 px-2.5 py-1 text-[11px] font-medium text-white">
                Click to switch
              </span>
            )}
          </button>

          {original && bg.status !== "unsupported" && !beautified && !busy && (
            <button
              type="button"
              onClick={confirmBeautify}
              disabled={preparing}
              className="absolute top-2 right-2 z-30 inline-flex items-center gap-1.5 rounded-full bg-tangerine px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:brightness-95 disabled:opacity-50"
            >
              <WandIcon className="size-3.5" />
              {beautifying
                ? "Beautifying"
                : accountTier === "free" && beautifyCreditsRemaining !== null
                  ? `Beautify (${beautifyCreditsRemaining} left)`
                  : "Beautify"}
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          onChange={(e) => handlePhoto(e.target.files?.[0] ?? null)}
          className="sr-only"
        />
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => handlePhoto(e.target.files?.[0] ?? null)}
          className="sr-only"
        />

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-line px-3 py-2.5 text-sm font-medium text-ink transition hover:border-cobalt hover:text-cobalt disabled:opacity-40"
          >
            <CameraIcon className="size-4" />
            Take Photo
          </button>
          <button
            type="button"
            onClick={analyze}
            disabled={step !== "pick" || !file || preparing}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-cobalt px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-cobalt-deep disabled:opacity-40"
          >
            <AnalyseIcon className="size-4" />
            Analyse
          </button>
        </div>

        <p className="mt-2.5 text-xs leading-relaxed text-mute">
          {!original &&
            ""}
          {original && removing && "Happens on your device. The photo does not leave your browser for this step."}
          {original && beautifying && "Rendering the garment like a catalogue photo."}
          {original && !preparing && beautifiedChosen && (
            <span className="text-warn-ink">
              Beautified with AI. Small details such as text or logos could be inaccurate, so compare
              it with the original before saving
            </span>
          )}
          {original && !preparing && !beautifiedChosen && bg.status === "skipped" && "Using the original photo."}
          {original && !preparing && !beautifiedChosen && (bg.status === "failed" || bg.status === "unsupported") && (
            <>
              {bg.message}
              {bg.status === "failed" && (
                <>
                  {" "}
                  <button type="button" onClick={retryClean} className="font-medium text-cobalt hover:underline">
                    Try again
                  </button>
                </>
              )}
            </>
          )}
          {original && !preparing && editFailure && !beautifiedChosen && (
            <span className="block text-bad">{editFailure}</span>
          )}
        </p>
      </div>

      <div className="grid gap-4 content-start">
        {error && <p role="alert" className="text-sm text-bad">{error}</p>}

        {step === "pick" && (
          <div className="flex flex-wrap items-center gap-2.5">
            {removing && (
              <button
                type="button"
                onClick={skipClean}
                className="rounded-lg border border-line px-4 py-2.5 text-sm font-medium transition hover:bg-wash"
              >
                Skip, use original
              </button>
            )}
            {!original && <p className="text-xs text-mute">Upload a photo of your item</p>}
            {removing && (
              <p className="basis-full text-xs text-mute">
                Removing background...
              </p>
            )}
          </div>
        )}

        {step === "analyzing" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-4">
            <p role="status" className="flex items-center gap-3 text-sm text-mute">
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
                <br /><br />
                {attrs.confidence_notes && `AI notes: ${attrs.confidence_notes}`}
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
                  type="button"
                  onClick={save}
                  disabled={step === "saving"}
                  className="rounded-lg bg-cobalt px-5 py-3 text-sm font-semibold text-white transition hover:bg-cobalt-deep disabled:opacity-50"
                >
                  {step === "saving" ? "Adding..." : "Add to wardrobe"}
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

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.9">
      <path d="M4 8h3l1.5-2h7L17 8h3v10H4z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

function AnalyseIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.9">
      <circle cx="10.5" cy="10.5" r="5.5" />
      <path d="M14.5 14.5L20 20M18 4v4M16 6h4" />
    </svg>
  );
}

function WandIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.9">
      <path d="M5 19L17 7M14.5 4.5l5 5M6 4v4M4 6h4M17 15v4M15 17h4" />
    </svg>
  );
}
