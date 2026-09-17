"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ClothingAttributes, EditableAttributes } from "@/lib/schemas/ai";
import {
  cleanGarmentPhoto,
  cropGarmentPhoto,
  NothingDetectedError,
  UnsupportedImageError,
  type CleanProgress,
  type NormalizedBox,
} from "@/lib/image/clean";

// The add-item flow lives here rather than in the page component so it
// survives navigation. The (app) layout stays mounted while the user moves
// between tabs, so a picked photo, a running background removal, an in-flight
// analysis and an unsaved review all persist until saved, discarded, or the
// page is hard-refreshed.

export type Step = "pick" | "analyzing" | "review" | "saving";

export type BgStatus = "idle" | "running" | "done" | "failed" | "unsupported" | "skipped";
export type CropStatus = "idle" | "running" | "done" | "failed";
export type ImageChoice = "original" | "cropped" | "cleaned";

export const CHECKLIST = [
  "Image accepted",
  "Garment identified",
  "Colour and pattern sampled",
  "Rated for Singapore weather",
];

export const emptyAttrs: ClothingAttributes = {
  category: "top",
  subcategory: "",
  primary_colour: "",
  secondary_colours: [],
  pattern: "",
  material_cues: "",
  formality: "casual",
  layering_role: "base",
  weather_tags: [],
  confidence_notes: "",
  uncertain_fields: [],
};

type State = {
  step: Step;
  // The photo exactly as picked, and its object URL
  original: File | null;
  originalPreview: string | null;
  // Output of background removal, once available
  cleaned: File | null;
  cleanedPreview: string | null;
  // Fallback crop to the garment when removal fails, once available
  cropped: File | null;
  croppedPreview: string | null;
  // Which version the user wants to analyse and save
  choice: ImageChoice;
  crop: { status: CropStatus };
  bg: {
    status: BgStatus;
    phase: "download" | "process";
    // 0..1 while downloading the model
    progress: number;
    message: string | null;
  };
  attrs: ClothingAttributes;
  // Fields the AI filled in. Empty until an analysis has returned
  aiTouched: boolean;
  // Fields the user has since edited, so their AI tag disappears
  edited: Set<string>;
  notes: string;
  error: string | null;
  // Checklist progress shown while analyzing
  done: number;
};

type Api = State & {
  // The file and preview that analysis and saving will use
  file: File | null;
  preview: string | null;
  pickFile: (file: File | null) => void;
  chooseImage: (which: ImageChoice) => void;
  skipClean: () => void;
  retryClean: () => void;
  analyze: () => Promise<void>;
  setField: <K extends keyof EditableAttributes>(key: K, value: EditableAttributes[K]) => void;
  setNotes: (notes: string) => void;
  setStep: (step: Step) => void;
  setError: (error: string | null) => void;
  reset: () => void;
};

const idleBg: State["bg"] = { status: "idle", phase: "download", progress: 0, message: null };

const initial: State = {
  step: "pick",
  original: null,
  originalPreview: null,
  cleaned: null,
  cleanedPreview: null,
  cropped: null,
  croppedPreview: null,
  choice: "cleaned",
  crop: { status: "idle" },
  bg: idleBg,
  attrs: emptyAttrs,
  aiTouched: false,
  edited: new Set(),
  notes: "",
  error: null,
  done: 0,
};

const AnalysisContext = createContext<Api | null>(null);

export function useAnalysis() {
  const ctx = useContext(AnalysisContext);
  if (!ctx) throw new Error("useAnalysis must be used inside AnalysisProvider");
  return ctx;
}

function revoke(state: State) {
  if (state.originalPreview) URL.revokeObjectURL(state.originalPreview);
  if (state.cleanedPreview) URL.revokeObjectURL(state.cleanedPreview);
  if (state.croppedPreview) URL.revokeObjectURL(state.croppedPreview);
}

export function AnalysisProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(initial);
  const controller = useRef<AbortController | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  // The removal library cannot be aborted, so results are tagged with the
  // generation they belong to and stale ones are ignored
  const generation = useRef(0);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  // Second line of defence: ask the server where the garment is and crop to
  // it. The tile then frames the item even though the background stays.
  const runCrop = useCallback(async (file: File, gen: number) => {
    setState((prev) => ({ ...prev, crop: { status: "running" } }));
    try {
      const form = new FormData();
      form.set("image", file);
      const res = await fetch("/api/items/locate", { method: "POST", body: form });
      const body: { found?: boolean; box?: NormalizedBox; error?: string } = await res.json();
      if (gen !== generation.current) return;
      if (!res.ok || !body.found || !body.box) throw new Error(body.error ?? "not found");

      const cropped = await cropGarmentPhoto(file, body.box);
      if (gen !== generation.current) return;
      setState((prev) => {
        if (prev.croppedPreview) URL.revokeObjectURL(prev.croppedPreview);
        return {
          ...prev,
          cropped,
          croppedPreview: URL.createObjectURL(cropped),
          choice: "cropped",
          crop: { status: "done" },
          bg: {
            ...prev.bg,
            message:
              "Couldn't separate the garment from the background, so the photo was cropped to it instead.",
          },
        };
      });
    } catch {
      if (gen !== generation.current) return;
      setState((prev) => ({ ...prev, crop: { status: "failed" } }));
    }
  }, []);

  const runClean = useCallback((file: File) => {
    const gen = ++generation.current;
    setState((prev) => ({
      ...prev,
      crop: { status: "idle" },
      bg: { status: "running", phase: "download", progress: 0, message: null },
    }));

    cleanGarmentPhoto(file, (p: CleanProgress) => {
      if (gen !== generation.current) return;
      setState((prev) => ({
        ...prev,
        bg:
          p.phase === "download"
            ? { ...prev.bg, phase: "download", progress: p.total ? p.loaded / p.total : 0 }
            : { ...prev.bg, phase: "process", progress: 1 },
      }));
    })
      .then((cleaned) => {
        if (gen !== generation.current) return;
        setState((prev) => {
          if (prev.cleanedPreview) URL.revokeObjectURL(prev.cleanedPreview);
          return {
            ...prev,
            cleaned,
            cleanedPreview: URL.createObjectURL(cleaned),
            choice: "cleaned",
            bg: { status: "done", phase: "process", progress: 1, message: null },
          };
        });
      })
      .catch((err: unknown) => {
        if (gen !== generation.current) return;
        const unsupported = err instanceof UnsupportedImageError;
        const message = unsupported
          ? "This browser cannot decode HEIC photos, so the original will be used."
          : err instanceof NothingDetectedError
            ? "Couldn't separate the garment from the background. Try a plain surface that contrasts with the item."
            : "Background removal did not work for this photo. Using the original.";
        setState((prev) => ({
          ...prev,
          choice: "original",
          bg: { status: unsupported ? "unsupported" : "failed", phase: "process", progress: 0, message },
        }));
        // HEIC cannot be cropped in the browser either, so only fall back
        // to a crop when decoding is possible
        if (!unsupported) void runCrop(file, gen);
      });
  }, [runCrop]);

  const reset = useCallback(() => {
    controller.current?.abort();
    controller.current = null;
    generation.current++;
    clearTimers();
    setState((prev) => {
      revoke(prev);
      return initial;
    });
  }, []);

  const pickFile = useCallback(
    (file: File | null) => {
      controller.current?.abort();
      controller.current = null;
      generation.current++;
      clearTimers();
      setState((prev) => {
        revoke(prev);
        return {
          ...initial,
          original: file,
          originalPreview: file ? URL.createObjectURL(file) : null,
        };
      });
      if (file) runClean(file);
    },
    [runClean],
  );

  const chooseImage = useCallback((which: ImageChoice) => {
    setState((prev) => {
      const available =
        (which === "cleaned" && prev.cleaned) || (which === "cropped" && prev.cropped) || which === "original";
      return available ? { ...prev, choice: which } : prev;
    });
  }, []);

  const skipClean = useCallback(() => {
    generation.current++;
    setState((prev) => ({
      ...prev,
      choice: "original",
      crop: { status: "idle" },
      bg: { status: "skipped", phase: "process", progress: 0, message: null },
    }));
  }, []);

  const retryClean = useCallback(() => {
    if (state.original) runClean(state.original);
  }, [state.original, runClean]);

  const file =
    state.choice === "cleaned" && state.cleaned
      ? state.cleaned
      : state.choice === "cropped" && state.cropped
        ? state.cropped
        : state.original;
  const preview =
    state.choice === "cleaned" && state.cleanedPreview
      ? state.cleanedPreview
      : state.choice === "cropped" && state.croppedPreview
        ? state.croppedPreview
        : state.originalPreview;

  const analyze = useCallback(async () => {
    if (!file) return;

    controller.current?.abort();
    const ac = new AbortController();
    controller.current = ac;

    clearTimers();
    setState((prev) => ({ ...prev, step: "analyzing", error: null, done: 0 }));
    timers.current = CHECKLIST.map((_, i) =>
      setTimeout(() => setState((prev) => ({ ...prev, done: i + 1 })), 500 + i * 900),
    );

    const form = new FormData();
    form.set("image", file);

    try {
      const res = await fetch("/api/items/analyze", {
        method: "POST",
        body: form,
        signal: ac.signal,
      });
      const body = await res.json();
      if (ac.signal.aborted) return;
      clearTimers();

      if (!res.ok) {
        setState((prev) => ({ ...prev, step: "pick", error: body.error ?? "Analysis failed" }));
        return;
      }

      setState((prev) => ({
        ...prev,
        step: "review",
        attrs: { ...emptyAttrs, ...body.attributes },
        aiTouched: true,
        edited: new Set(),
        done: CHECKLIST.length,
      }));
    } catch (err) {
      if (ac.signal.aborted) return;
      clearTimers();
      setState((prev) => ({
        ...prev,
        step: "pick",
        error: err instanceof Error ? err.message : "Analysis failed",
      }));
    }
  }, [file]);

  const setField = useCallback(
    <K extends keyof EditableAttributes>(key: K, value: EditableAttributes[K]) => {
      setState((prev) => ({
        ...prev,
        attrs: { ...prev.attrs, [key]: value },
        edited: new Set(prev.edited).add(key),
      }));
    },
    [],
  );

  const setNotes = useCallback((notes: string) => setState((prev) => ({ ...prev, notes })), []);
  const setStep = useCallback((step: Step) => setState((prev) => ({ ...prev, step })), []);
  const setError = useCallback((error: string | null) => setState((prev) => ({ ...prev, error })), []);

  const api = useMemo<Api>(
    () => ({
      ...state,
      file,
      preview,
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
    }),
    [state, file, preview, pickFile, chooseImage, skipClean, retryClean, analyze, setField, setNotes, setStep, setError, reset],
  );

  return <AnalysisContext.Provider value={api}>{children}</AnalysisContext.Provider>;
}
