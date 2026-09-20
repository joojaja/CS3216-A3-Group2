"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

export type RecommendedItem = {
  id: string;
  category: string;
  subcategory: string | null;
  primary_colour: string | null;
};

export type Recommendation = {
  id: string | null;
  item_ids: string[];
  explanation: string;
  warnings: string[];
};

export const FEEDBACK_REASONS = [
  { value: "too_warm", label: "Too warm" },
  { value: "too_formal", label: "Too formal" },
  { value: "too_casual", label: "Too casual" },
  { value: "uncomfortable", label: "Uncomfortable" },
  { value: "disliked_colour_combination", label: "Bad colour combo" },
  { value: "other", label: "Other" },
] as const;

export type Reason = (typeof FEEDBACK_REASONS)[number]["value"];
export type FeedbackAction = "wore" | "liked" | "rejected";

export type PlannerStatus = "idle" | "loading" | "done" | "error";

type State = {
  occasion: string;
  date: string;
  status: PlannerStatus;
  error: string | null;
  weather: string | null;
  items: Record<string, RecommendedItem>;
  recs: Recommendation[];
  sentFeedback: Record<string, FeedbackAction>;
  // The occasion the running request or the current results are for. Shown
  // in the status card while the user is on another tab
  requestedFor: string;
  // Whether the finished result has been shown on the planner page. The
  // status card on other tabs hides once it has
  seen: boolean;
};

const initial: State = {
  occasion: "",
  date: "",
  status: "idle",
  error: null,
  weather: null,
  items: {},
  recs: [],
  sentFeedback: {},
  requestedFor: "",
  seen: true,
};

type Api = State & {
  setOccasion: (occasion: string) => void;
  setDate: (date: string) => void;
  recommend: () => Promise<void>;
  sendFeedback: (
    recommendationId: string,
    action: FeedbackAction,
    picked?: Reason[],
  ) => Promise<boolean>;
  markSeen: () => void;
};

const PlannerContext = createContext<Api | null>(null);

export function usePlanner() {
  const ctx = useContext(PlannerContext);
  if (!ctx) throw new Error("usePlanner must be used inside PlannerProvider");
  return ctx;
}

// Owns the outfit request so it keeps running when the planner page unmounts.
// Mounted in the app layout, which Next.js keeps alive across tab changes, so
// the prompt, the in-flight request and the results all survive navigation.
// Nothing here survives a hard refresh by design.
export function PlannerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(initial);
  const controller = useRef<AbortController | null>(null);

  const setOccasion = useCallback(
    (occasion: string) => setState((prev) => ({ ...prev, occasion })),
    [],
  );
  const setDate = useCallback((date: string) => setState((prev) => ({ ...prev, date })), []);
  const markSeen = useCallback(() => {
    setState((prev) => (prev.seen ? prev : { ...prev, seen: true }));
  }, []);

  const recommend = useCallback(async () => {
    const occasion = state.occasion.trim();
    if (occasion.length < 3) return;

    // A newer request always wins; the older response is dropped
    controller.current?.abort();
    const ac = new AbortController();
    controller.current = ac;

    setState((prev) => ({
      ...prev,
      status: "loading",
      error: null,
      requestedFor: occasion,
      seen: false,
    }));

    try {
      const res = await fetch("/api/outfits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          occasion_text: occasion,
          requested_date: state.date || undefined,
        }),
        signal: ac.signal,
      });
      const body = await res.json();
      if (ac.signal.aborted) return;

      if (!res.ok) {
        setState((prev) => ({
          ...prev,
          status: "error",
          error: body.error ?? "Recommendation failed",
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        status: "done",
        recs: body.recommendations,
        items: body.items,
        weather: body.weather,
        sentFeedback: {},
      }));
    } catch (err) {
      if (ac.signal.aborted) return;
      setState((prev) => ({
        ...prev,
        status: "error",
        error: err instanceof Error ? err.message : "Recommendation failed",
      }));
    }
  }, [state.occasion, state.date]);

  const sendFeedback = useCallback(
    async (recommendationId: string, action: FeedbackAction, picked?: Reason[]) => {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recommendation_id: recommendationId,
          action,
          reason: picked?.[0],
          free_text:
            picked && picked.length > 1
              ? FEEDBACK_REASONS.filter((r) => picked.includes(r.value))
                  .map((r) => r.label)
                  .join(", ")
              : undefined,
        }),
      });
      if (!res.ok) return false;
      setState((prev) => ({
        ...prev,
        sentFeedback: { ...prev.sentFeedback, [recommendationId]: action },
      }));
      return true;
    },
    [],
  );

  const api = useMemo<Api>(
    () => ({ ...state, setOccasion, setDate, recommend, sendFeedback, markSeen }),
    [state, setOccasion, setDate, recommend, sendFeedback, markSeen],
  );

  return <PlannerContext.Provider value={api}>{children}</PlannerContext.Provider>;
}
