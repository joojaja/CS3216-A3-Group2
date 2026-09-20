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

export type TurnStatus = "loading" | "done" | "declined" | "error";

// One exchange in the thread: what the user asked, and what came back
export type Turn = {
  id: string;
  message: string;
  status: TurnStatus;
  error: string | null;
  // The real cause of a failure. The server only sends it in development
  errorDetail: string | null;
  weather: string | null;
  items: Record<string, RecommendedItem>;
  recs: Recommendation[];
  declineMessage: string | null;
};

type State = {
  draft: string;
  turns: Turn[];
  sentFeedback: Record<string, FeedbackAction>;
  // Whether the latest reply has been shown on the planner page. The status
  // card on other tabs hides once it has
  seen: boolean;
};

const initial: State = { draft: "", turns: [], sentFeedback: {}, seen: true };

// Oldest first, capped so the prompt stays small
const CONTEXT_MESSAGES = 6;

type Api = State & {
  latest: Turn | null;
  busy: boolean;
  setDraft: (draft: string) => void;
  send: (message?: string) => Promise<void>;
  stop: () => void;
  retry: () => Promise<void>;
  clear: () => void;
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

// Owns the outfit thread so requests keep running when the planner page
// unmounts. Mounted in the app layout, which Next.js keeps alive across tab
// changes, so the draft, the in-flight request and every reply survive
// navigation. Nothing here survives a hard refresh by design.
export function PlannerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(initial);
  const controller = useRef<AbortController | null>(null);

  const setDraft = useCallback((draft: string) => setState((prev) => ({ ...prev, draft })), []);
  const markSeen = useCallback(() => {
    setState((prev) => (prev.seen ? prev : { ...prev, seen: true }));
  }, []);

  const patchTurn = useCallback((id: string, patch: Partial<Turn>) => {
    setState((prev) => ({
      ...prev,
      turns: prev.turns.map((turn) => (turn.id === id ? { ...turn, ...patch } : turn)),
    }));
  }, []);

  const run = useCallback(
    async (turn: Turn, history: Turn[]) => {
      controller.current?.abort();
      const ac = new AbortController();
      controller.current = ac;

      // Earlier successful requests give a short follow-up its context
      const answered = history.filter((t) => t.status === "done");
      const last = answered[answered.length - 1];
      const previous = answered.length
        ? {
            messages: answered.slice(-CONTEXT_MESSAGES).map((t) => t.message),
            outfits: (last?.recs ?? []).map((rec) => ({
              item_ids: rec.item_ids,
              explanation: rec.explanation,
            })),
          }
        : undefined;

      try {
        const res = await fetch("/api/outfits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ occasion_text: turn.message, previous }),
          signal: ac.signal,
        });
        const body = await res.json();
        if (ac.signal.aborted) return;

        if (!res.ok) {
          patchTurn(turn.id, {
            status: "error",
            error: body.error ?? "Recommendation failed",
            errorDetail: typeof body.debug === "string" ? body.debug : null,
          });
        } else if (body.declined) {
          patchTurn(turn.id, { status: "declined", declineMessage: body.message });
        } else {
          patchTurn(turn.id, {
            status: "done",
            recs: body.recommendations,
            items: body.items,
            weather: body.weather,
          });
        }
      } catch (err) {
        if (ac.signal.aborted) return;
        patchTurn(turn.id, {
          status: "error",
          error: err instanceof Error ? err.message : "Recommendation failed",
          errorDetail: null,
        });
      }
    },
    [patchTurn],
  );

  const send = useCallback(
    async (message?: string) => {
      const text = (message ?? state.draft).trim();
      if (text.length < 2 || state.turns.some((t) => t.status === "loading")) return;

      const turn: Turn = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        message: text,
        status: "loading",
        error: null,
        errorDetail: null,
        weather: null,
        items: {},
        recs: [],
        declineMessage: null,
      };
      setState((prev) => ({
        ...prev,
        draft: message === undefined ? "" : prev.draft,
        turns: [...prev.turns, turn],
        seen: false,
      }));
      await run(turn, state.turns);
    },
    [state.draft, state.turns, run],
  );

  const stop = useCallback(() => {
    controller.current?.abort();
    setState((prev) => ({
      ...prev,
      turns: prev.turns.map((turn) =>
        turn.status === "loading"
          ? { ...turn, status: "error", error: "Stopped before it finished.", errorDetail: null }
          : turn,
      ),
    }));
  }, []);

  // Re-runs the latest turn when it failed
  const retry = useCallback(async () => {
    const last = state.turns[state.turns.length - 1];
    if (!last || last.status !== "error") return;
    patchTurn(last.id, { status: "loading", error: null, errorDetail: null });
    setState((prev) => ({ ...prev, seen: false }));
    await run(last, state.turns.slice(0, -1));
  }, [state.turns, run, patchTurn]);

  const clear = useCallback(() => {
    controller.current?.abort();
    setState((prev) => ({ ...initial, sentFeedback: prev.sentFeedback }));
  }, []);

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

  const api = useMemo<Api>(() => {
    const latest = state.turns[state.turns.length - 1] ?? null;
    return {
      ...state,
      latest,
      busy: latest?.status === "loading",
      setDraft,
      send,
      stop,
      retry,
      clear,
      sendFeedback,
      markSeen,
    };
  }, [state, setDraft, send, stop, retry, clear, sendFeedback, markSeen]);

  return <PlannerContext.Provider value={api}>{children}</PlannerContext.Provider>;
}
