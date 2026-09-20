"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { MotionConfig } from "motion/react";
import { AnalysisProvider } from "@/components/analysis-context";
import { ToastProvider } from "@/components/toast";
import { ItemUploader } from "@/components/item-uploader";
import { trackFunnel } from "@/lib/analytics";
import { saveOnboarding } from "@/lib/actions/onboarding";
import {
  colourOptions,
  occasionOptions,
  styleOptions,
  type OnboardingProfile,
} from "@/lib/onboarding";

function Choices({
  values,
  selected,
  onChange,
}: {
  values: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div className="onboarding-choices">
      {Array.from(new Set([...values, ...selected])).map((value) => (
        <button
          type="button"
          key={value}
          aria-pressed={selected.includes(value)}
          onClick={() =>
            onChange(
              selected.includes(value)
                ? selected.filter((v) => v !== value)
                : [...selected, value],
            )
          }
        >
          {value}
          <span aria-hidden="true">{selected.includes(value) ? "✓" : "+"}</span>
        </button>
      ))}
    </div>
  );
}

type OnboardingProps = {
  profile: OnboardingProfile;
  resumeUpload: boolean;
  configured: boolean;
};

export function OnboardingFlow(props: OnboardingProps) {
  return (
    <MotionConfig reducedMotion="user">
      <ToastProvider>
        <AnalysisProvider>
          <OnboardingSteps {...props} />
        </AnalysisProvider>
      </ToastProvider>
    </MotionConfig>
  );
}

function OnboardingSteps({
  profile,
  resumeUpload,
  configured,
}: OnboardingProps) {
  const [step, setStep] = useState(resumeUpload ? 3 : 0);
  const [draft, setDraft] = useState(profile);
  const [savedItem, setSavedItem] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const heading = useRef<HTMLHeadingElement>(null);
  const initial = useRef(true);
  useEffect(() => {
    if (initial.current) {
      initial.current = false;
      return;
    }
    heading.current?.focus();
  }, [step, savedItem]);
  const update = <K extends keyof OnboardingProfile>(
    key: K,
    value: OnboardingProfile[K],
  ) => setDraft((prev) => ({ ...prev, [key]: value }));

  function continueToUpload() {
    setError(null);
    if (!configured) {
      setStep(3);
      return;
    }
    const form = new FormData();
    for (const key of ["display_name", "preference_notes"] as const)
      form.set(key, draft[key] ?? "");
    for (const key of [
      "preferred_styles",
      "preferred_colours",
      "disliked_colours",
      "common_occasions",
    ] as const)
      form.set(key, draft[key].join(","));
    for (const key of ["top", "bottom", "shoes"] as const)
      form.set(`size_${key}`, draft.sizes?.[key] ?? "");
    startTransition(async () => {
      try {
        const result = await saveOnboarding(form);
        if (result.error) {
          setError(result.error);
          return;
        }
        trackFunnel("preferences_saved");
        setStep(3);
      } catch {
        setError(
          "We couldn't save your preferences. Your choices are still here. Please try again.",
        );
      }
    });
  }

  if (savedItem)
    return (
      <section className="onboarding-card onboarding-success">
        <p className="onboarding-eyebrow">Your first piece, remembered</p>
        <h1 ref={heading} tabIndex={-1}>
          Your wardrobe starts here.
        </h1>
        <p>
          You reviewed the details and saved your first item. Add a few more
          pieces to give Wearabouts enough clothes to build an outfit.
        </p>
        <Link className="onboarding-primary" href={`/wardrobe/${savedItem}`}>
          See your saved item <span aria-hidden="true">↗</span>
        </Link>
        <Link className="onboarding-secondary" href="/wardrobe">
          Go to my wardrobe
        </Link>
      </section>
    );
  const titles = [
    "What feels like you?",
    "Make room for your colours.",
    "Dress for your everyday.",
    "Start with one piece.",
  ];
  const descriptions = [
    "A few preferences help Wearabouts suggest outfits you'll want to wear. Every answer is optional, and you can change it later.",
    "Pick the colours you reach for. Leave these blank if you're open to anything.",
    "Tell us where your clothes take you, and anything a photo can't tell us.",
    "Photograph one item you already own. You'll review and correct the suggested details before saving it.",
  ];
  return (
    <div
      className={`onboarding-layout ${step === 3 ? "onboarding-upload-layout" : ""}`}
    >
      <aside className="onboarding-aside">
        <p className="onboarding-eyebrow">A wardrobe that knows you</p>
        <h2>
          Good outfits start
          <br />
          with <em>your clothes.</em>
        </h2>
        <p>Keep the pieces you love in view. Leave the guesswork behind.</p>
        <div
          className="onboarding-aside-photo"
          role="img"
          aria-label="A considered wardrobe of everyday clothing"
        />
        <p className="onboarding-privacy">
          Private to your account. You choose what to upload and which details
          to keep.
        </p>
      </aside>
      <section className="onboarding-card">
        <div className="onboarding-progress-label">
          <span>Step {step + 1} of 4</span>
          <span>
            {
              ["Your style", "Your colours", "Your day", "Your first item"][
                step
              ]
            }
          </span>
        </div>
        <progress
          value={step + 1}
          max={4}
          aria-label={`Onboarding step ${step + 1} of 4`}
        />
        <h1 ref={heading} tabIndex={-1}>
          {titles[step]}
        </h1>
        <p className="onboarding-description">{descriptions[step]}</p>
        {!configured && (
          <p className="onboarding-notice" role="status">
            Preview mode. You can explore these steps, but an account connection
            is needed to save preferences or clothes.
          </p>
        )}
        {step < 3 ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (step === 2) continueToUpload();
              else setStep(step + 1);
            }}
          >
            <fieldset disabled={pending} className="onboarding-fields">
              {step === 0 && (
                <>
                  <label className="onboarding-label">
                    What should we call you? <span>Optional</span>
                    <input
                      autoComplete="given-name"
                      value={draft.display_name ?? ""}
                      maxLength={120}
                      onChange={(e) => update("display_name", e.target.value)}
                      placeholder="Your name"
                    />
                  </label>
                  <fieldset>
                    <legend>
                      Styles you enjoy <span>Choose any</span>
                    </legend>
                    <Choices
                      values={styleOptions}
                      selected={draft.preferred_styles}
                      onChange={(v) => update("preferred_styles", v)}
                    />
                  </fieldset>
                </>
              )}
              {step === 1 && (
                <>
                  <fieldset>
                    <legend>
                      Colours you like <span>Choose any</span>
                    </legend>
                    <div className="onboarding-colours">
                      {colourOptions.map(([name, hex]) => (
                        <button
                          type="button"
                          key={name}
                          aria-pressed={draft.preferred_colours.includes(name)}
                          onClick={() => {
                            update(
                              "preferred_colours",
                              draft.preferred_colours.includes(name)
                                ? draft.preferred_colours.filter(
                                    (v) => v !== name,
                                  )
                                : [...draft.preferred_colours, name],
                            );
                            update(
                              "disliked_colours",
                              draft.disliked_colours.filter((v) => v !== name),
                            );
                          }}
                        >
                          <i style={{ background: hex }} />
                          <span>{name}</span>
                          {draft.preferred_colours.includes(name) && (
                            <b aria-hidden="true">✓</b>
                          )}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                  <fieldset>
                    <legend>
                      Colours you would rather avoid <span>Optional</span>
                    </legend>
                    <Choices
                      values={colourOptions.map(([name]) => name)}
                      selected={draft.disliked_colours}
                      onChange={(v) => {
                        update("disliked_colours", v);
                        update(
                          "preferred_colours",
                          draft.preferred_colours.filter((c) => !v.includes(c)),
                        );
                      }}
                    />
                  </fieldset>
                </>
              )}
              {step === 2 && (
                <>
                  <fieldset>
                    <legend>
                      Your usual occasions <span>Choose any</span>
                    </legend>
                    <Choices
                      values={occasionOptions}
                      selected={draft.common_occasions}
                      onChange={(v) => update("common_occasions", v)}
                    />
                  </fieldset>
                  <label className="onboarding-label">
                    Anything else to keep in mind? <span>Optional</span>
                    <textarea
                      rows={3}
                      maxLength={2000}
                      value={draft.preference_notes ?? ""}
                      onChange={(e) =>
                        update("preference_notes", e.target.value)
                      }
                      placeholder="For example, covered shoulders, no wool, or a layer for cold lecture halls."
                    />
                  </label>
                  <details>
                    <summary>
                      Add clothing sizes <span>Optional</span>
                    </summary>
                    <p>
                      Use the sizing system you know, such as EU 38 or UK 8. A
                      photo cannot tell us your fit.
                    </p>
                    <div className="onboarding-sizes">
                      {(["top", "bottom", "shoes"] as const).map((key) => (
                        <label key={key}>
                          {key === "shoes"
                            ? "Shoes"
                            : key === "top"
                              ? "Top"
                              : "Bottom"}
                          <input
                            maxLength={20}
                            value={draft.sizes?.[key] ?? ""}
                            onChange={(e) =>
                              update("sizes", {
                                ...draft.sizes,
                                [key]: e.target.value,
                              })
                            }
                          />
                        </label>
                      ))}
                    </div>
                  </details>
                </>
              )}
            </fieldset>
            {error && (
              <p role="alert" className="onboarding-error">
                {error}
              </p>
            )}
            <div className="onboarding-actions">
              <button
                type="button"
                className="onboarding-secondary"
                disabled={pending || step === 0}
                onClick={() => setStep(step - 1)}
              >
                Back
              </button>
              <button
                className="onboarding-primary"
                type="submit"
                disabled={pending}
              >
                {pending
                  ? "Saving your preferences..."
                  : step === 2
                    ? "Continue to my first item"
                    : "Continue"}
                <span aria-hidden="true">→</span>
              </button>
            </div>
            <p className="onboarding-optional">
              No preference yet? Continue without selecting anything.
            </p>
          </form>
        ) : (
          <>
            <button className="onboarding-back" onClick={() => setStep(2)}>
              ← Edit my preferences
            </button>
            {configured ? (
              <div className="onboarding-uploader">
                <ItemUploader
                  onSaved={(id) => {
                    trackFunnel("first_item_saved");
                    setSavedItem(id);
                  }}
                />
              </div>
            ) : (
              <div className="onboarding-notice">
                <p>
                  Photo upload, AI review and saving are available once
                  Wearabouts is connected to its services.
                </p>
                <Link href="/wardrobe">Explore the wardrobe preview →</Link>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
