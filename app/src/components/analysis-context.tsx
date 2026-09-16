"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ClothingAttributes } from "@/lib/schemas/ai";

// The add-item flow lives here rather than in the page component so it
// survives navigation. The (app) layout stays mounted while the user moves
// between tabs, so a picked photo, an in-flight analysis and an unsaved
// review all persist until saved, discarded, or the page is hard-refreshed.

export type Step = "pick" | "analyzing" | "review" | "saving";

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
  file: File | null;
  preview: string | null;
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
  pickFile: (file: File | null) => void;
  analyze: () => Promise<void>;
  setField: <K extends keyof ClothingAttributes>(key: K, value: ClothingAttributes[K]) => void;
  setNotes: (notes: string) => void;
  setStep: (step: Step) => void;
  setError: (error: string | null) => void;
  reset: () => void;
};

const initial: State = {
  step: "pick",
  file: null,
  preview: null,
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

export function AnalysisProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(initial);
  const controller = useRef<AbortController | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const reset = useCallback(() => {
    controller.current?.abort();
    controller.current = null;
    clearTimers();
    setState((prev) => {
      if (prev.preview) URL.revokeObjectURL(prev.preview);
      return initial;
    });
  }, []);

  const pickFile = useCallback((file: File | null) => {
    controller.current?.abort();
    controller.current = null;
    clearTimers();
    setState((prev) => {
      if (prev.preview) URL.revokeObjectURL(prev.preview);
      return {
        ...initial,
        file,
        preview: file ? URL.createObjectURL(file) : null,
      };
    });
  }, []);

  const analyze = useCallback(async () => {
    const file = state.file;
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
  }, [state.file]);

  const setField = useCallback(
    <K extends keyof ClothingAttributes>(key: K, value: ClothingAttributes[K]) => {
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
    () => ({ ...state, pickFile, analyze, setField, setNotes, setStep, setError, reset }),
    [state, pickFile, analyze, setField, setNotes, setStep, setError, reset],
  );

  return <AnalysisContext.Provider value={api}>{children}</AnalysisContext.Provider>;
}
