"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { mergeContexts } from "@/lib/sizing/extraction";
import type { PurchaseContext } from "@/lib/sizing/types";

// Holds what the user is buying so it survives tab changes: a screenshot
// being read, the confirm step and the result all persist until reset or a
// hard refresh. Mounted in the (app) layout next to the planner. The
// screenshot itself is never kept: the File is sent once and dropped.

export type SizingStatus = "idle" | "reading" | "review" | "ready" | "error";

type Api = {
  status: SizingStatus;
  context: PurchaseContext | null;
  error: string | null;
  // True while a second screenshot is being read into the same item
  merging: boolean;
  // merge adds a second screenshot (usually the size chart) to the item
  // being reviewed; otherwise the screenshot starts a new item
  readScreenshot: (file: File, merge?: boolean) => void;
  startManual: (context: PurchaseContext) => void;
  update: (patch: Partial<PurchaseContext>) => void;
  confirm: () => void;
  edit: () => void;
  reset: () => void;
};

const SizingContext = createContext<Api | null>(null);

export function SizingProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<SizingStatus>("idle");
  const [context, setContext] = useState<PurchaseContext | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [merging, setMerging] = useState(false);
  const abort = useRef<AbortController | null>(null);
  // Latest context for readScreenshot to merge into, without re-creating it
  const current = useRef<PurchaseContext | null>(null);
  useEffect(() => {
    current.current = context;
  }, [context]);

  const readScreenshot = useCallback((file: File, merge = false) => {
    abort.current?.abort();
    const ac = new AbortController();
    abort.current = ac;
    const base = merge ? current.current : null;
    if (!merge) setContext(null);
    setMerging(!!base);
    setError(null);
    setStatus("reading");

    const form = new FormData();
    form.set("image", file);
    fetch("/api/sizing/extract", { method: "POST", body: form, signal: ac.signal })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (ac.signal.aborted) return;
        if (!res.ok || !body.context) {
          setError(body.error ?? "We could not read that screenshot. Try again or pick the brand yourself.");
          setStatus(base ? "review" : "error");
          return;
        }
        setContext(base ? mergeContexts(base, body.context) : body.context);
        setStatus("review");
      })
      .catch(() => {
        if (ac.signal.aborted) return;
        setError("We could not reach the server. Check your connection and try again.");
        setStatus(base ? "review" : "error");
      })
      .finally(() => {
        if (!ac.signal.aborted) setMerging(false);
      });
  }, []);

  const startManual = useCallback((next: PurchaseContext) => {
    abort.current?.abort();
    setError(null);
    setMerging(false);
    setContext(next);
    setStatus("ready");
  }, []);

  const update = useCallback((patch: Partial<PurchaseContext>) => {
    setContext((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const confirm = useCallback(() => setStatus("ready"), []);
  const edit = useCallback(() => setStatus("review"), []);

  const reset = useCallback(() => {
    abort.current?.abort();
    setContext(null);
    setError(null);
    setMerging(false);
    setStatus("idle");
  }, []);

  const api = useMemo<Api>(
    () => ({ status, context, error, merging, readScreenshot, startManual, update, confirm, edit, reset }),
    [status, context, error, merging, readScreenshot, startManual, update, confirm, edit, reset],
  );

  return <SizingContext.Provider value={api}>{children}</SizingContext.Provider>;
}

export function useSizing() {
  const ctx = useContext(SizingContext);
  if (!ctx) throw new Error("useSizing must be used inside SizingProvider");
  return ctx;
}
