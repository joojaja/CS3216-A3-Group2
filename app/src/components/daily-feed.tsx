"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { OutfitCollage } from "@/components/outfit-collage";
import { FeedbackReasons } from "@/components/feedback-reasons";
import { BookmarkIcon } from "@/components/outfit-planner";
import { FEEDBACK_REASONS, type Reason } from "@/components/planner-context";
import { useToast } from "@/components/toast";
import { trackFunnel } from "@/lib/analytics";
import { saveOutfit, unsaveOutfit } from "@/lib/outfits/saved-client";
import type { DailyAction, DailyCard, DailyFeed } from "@/lib/outfits/types";

// Signed image links last an hour. Refetch on return after this long
const STALE_MS = 50 * 60 * 1000;
// How long a skip can be undone before it is written
const UNDO_MS = 5000;

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "loaded"; feed: DailyFeed };

async function fetchFeed(): Promise<LoadState> {
  try {
    const res = await fetch("/api/daily-outfits", { cache: "no-store" });
    const body = await res.json();
    if (!res.ok) {
      return { status: "error", message: body.error ?? "Could not load today's outfits." };
    }
    return { status: "loaded", feed: body as DailyFeed };
  } catch {
    return { status: "error", message: "Could not reach Wearabouts. Check your connection." };
  }
}

// Loads today's feed and keeps it fresh when the tab comes back after the
// image links have expired
export function useDailyFeed() {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const loadedAt = useRef(0);

  const apply = useCallback((next: LoadState) => {
    if (next.status === "loaded") loadedAt.current = Date.now();
    setState(next);
  }, []);

  const load = useCallback(async () => {
    setState({ status: "loading" });
    apply(await fetchFeed());
  }, [apply]);

  useEffect(() => {
    let live = true;
    void fetchFeed().then((next) => {
      if (live) apply(next);
    });
    function onVisible() {
      if (document.visibilityState === "visible" && Date.now() - loadedAt.current > STALE_MS) {
        void fetchFeed().then((next) => {
          if (live) apply(next);
        });
      }
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      live = false;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [apply]);

  const patchCard = useCallback((id: string, patch: Partial<DailyCard>) => {
    setState((prev) => {
      if (prev.status !== "loaded" || prev.feed.status !== "ready") return prev;
      return {
        ...prev,
        feed: {
          ...prev.feed,
          cards: prev.feed.cards.map((card) => (card.id === id ? { ...card, ...patch } : card)),
        },
      };
    });
  }, []);

  return { state, reload: load, patchCard };
}

async function postFeedback(id: string, action: DailyAction, picked?: Reason[]) {
  try {
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recommendation_id: id,
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
    return res.ok;
  } catch {
    return false;
  }
}

// Full-screen view of today's outfits, one card at a time
export function DailyFeedView({ start }: { start: number | null }) {
  const router = useRouter();
  const { state, reload, patchCard } = useDailyFeed();

  useEffect(() => {
    trackFunnel("daily_feed_opened");
  }, []);

  const close = useCallback(() => router.push("/wardrobe"), [router]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  return (
    <div className="fixed inset-0 z-40 flex flex-col overflow-y-auto bg-ink text-white">
      {state.status === "loaded" && state.feed.status === "ready" ? (
        <ReadyFeed feed={state.feed} start={start} onClose={close} patchCard={patchCard} />
      ) : (
        <>
          <TopBar onClose={close} counter={null} />
          <div className="mx-auto grid w-full max-w-[440px] flex-1 place-items-center px-4 pb-10">
            {state.status === "loading" && <LoadingCard />}
            {state.status === "error" && (
              <div className="w-full rounded-3xl bg-white p-6 text-center text-ink">
                <p className="font-medium">{state.message}</p>
                <button
                  type="button"
                  onClick={() => void reload()}
                  className="mt-4 rounded-lg bg-cobalt px-4 py-2.5 text-sm font-medium text-white"
                >
                  Try again
                </button>
              </div>
            )}
            {state.status === "loaded" && state.feed.status === "insufficient" && (
              <div className="w-full rounded-3xl bg-white p-6 text-ink">
                <NotEnough feed={state.feed} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function TopBar({ onClose, counter }: { onClose: () => void; counter: string | null }) {
  return (
    <div className="mx-auto grid w-full max-w-[440px] grid-cols-[44px_1fr_44px] items-center px-4 pt-[max(16px,env(safe-area-inset-top))] pb-3">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close today's outfits"
        className="grid size-11 place-items-center rounded-full transition hover:bg-white/10"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="size-6" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
      <h1 className="text-center text-[17px] font-semibold tracking-tight">Today&apos;s outfits</h1>
      <span className="text-right text-sm tabular-nums text-white/80" aria-live="polite">
        {counter}
      </span>
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="w-full rounded-3xl bg-white p-3" aria-busy="true" aria-label="Building today's outfits">
      <div className="shim aspect-[4/5] w-full !rounded-2xl" />
      <div className="mt-3 grid gap-2 px-1 pb-1">
        <div className="shim h-3.5 w-2/3" />
        <div className="shim h-3.5 w-1/2" />
      </div>
    </div>
  );
}

// No outfit could be built yet. Says exactly what is missing
export function NotEnough({ feed }: { feed: Extract<DailyFeed, { status: "insufficient" }> }) {
  let title: string;
  let body: string;
  if (feed.confirmedCount === 0 && feed.unconfirmedCount > 0) {
    title = `You have ${feed.unconfirmedCount} ${feed.unconfirmedCount === 1 ? "item" : "items"} waiting for review`;
    body = "Outfits are built from confirmed items. Check their details to get your first daily outfits.";
  } else if (feed.missing.length === 2) {
    title = "Your daily outfits start with a few pieces";
    body = "Add a top and a bottom, or a dress, and today's outfits appear here.";
  } else if (feed.missing[0] === "bottom") {
    title = "Add a bottom or a dress";
    body = "You have tops but nothing to pair them with yet.";
  } else if (feed.missing[0] === "top") {
    title = "Add a top or a dress";
    body = "You have bottoms but nothing to pair them with yet.";
  } else {
    title = "None of your pieces pair up yet";
    body = "Your tops and bottoms are far apart in formality or both patterned. Adding a plain piece helps.";
  }
  return (
    <div className="text-center">
      <p className="font-semibold">{title}</p>
      <p className="mx-auto mt-1 max-w-[40ch] text-sm text-mute">{body}</p>
      <Link
        href="/wardrobe/new"
        className="mt-4 inline-block rounded-lg bg-cobalt px-4 py-2.5 text-sm font-medium text-white"
      >
        Add an item
      </Link>
    </div>
  );
}

function ReadyFeed({
  feed,
  start,
  onClose,
  patchCard,
}: {
  feed: Extract<DailyFeed, { status: "ready" }>;
  start: number | null;
  onClose: () => void;
  patchCard: (id: string, patch: Partial<DailyCard>) => void;
}) {
  const { toast } = useToast();
  const { cards } = feed;
  const firstOpen = useMemo(() => {
    if (start !== null && start >= 0 && start < cards.length) return start;
    const index = cards.findIndex((card) => !card.action && !card.saved);
    return index === -1 ? cards.length : index;
    // Only on first render: later changes come from the user moving through
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [index, setIndex] = useState(firstOpen);
  const [reasonsOpen, setReasonsOpen] = useState(false);
  const pendingSkips = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const done = index >= cards.length;
  const card = done ? null : cards[index];

  // Write any skips still waiting on their undo window when leaving
  useEffect(() => {
    const pending = pendingSkips.current;
    return () => {
      for (const [id, timer] of pending) {
        clearTimeout(timer);
        if (!feed.demo) void postFeedback(id, "dismissed");
      }
      pending.clear();
    };
  }, [feed.demo]);

  function goTo(next: number) {
    setReasonsOpen(false);
    setIndex(next);
    if (next >= cards.length) trackFunnel("daily_feed_finished");
  }

  function skip(target: DailyCard, at: number) {
    goTo(at + 1);
    trackFunnel("daily_outfit_skipped");
    const timer = setTimeout(() => {
      pendingSkips.current.delete(target.id);
      if (!feed.demo) void postFeedback(target.id, "dismissed");
      patchCard(target.id, { action: "dismissed" });
    }, UNDO_MS);
    pendingSkips.current.set(target.id, timer);
    toast("Skipped", {
      label: "Undo",
      onClick: () => {
        clearTimeout(pendingSkips.current.get(target.id));
        pendingSkips.current.delete(target.id);
        goTo(at);
      },
    });
  }

  async function toggleSave(target: DailyCard, at: number) {
    const wasSaved = target.saved;
    patchCard(target.id, { saved: !wasSaved });
    const ok = feed.demo || (wasSaved ? await unsaveOutfit(target.id) : await saveOutfit(target.id));
    if (!ok) {
      patchCard(target.id, { saved: wasSaved });
      toast("Could not update saved outfits");
      return;
    }
    if (wasSaved) {
      toast("Removed from saved outfits");
      return;
    }
    trackFunnel("daily_outfit_saved");
    goTo(at + 1);
    toast("Saved to your outfits", {
      label: "Undo",
      onClick: async () => {
        patchCard(target.id, { saved: false });
        if (!feed.demo && !(await unsaveOutfit(target.id))) {
          patchCard(target.id, { saved: true });
          toast("Could not undo the save");
          return;
        }
        goTo(at);
      },
    });
  }

  async function wear(target: DailyCard) {
    patchCard(target.id, { action: "wore" });
    const ok = feed.demo || (await postFeedback(target.id, "wore"));
    if (!ok) {
      patchCard(target.id, { action: target.action });
      toast("Could not save that");
      return;
    }
    trackFunnel("daily_outfit_worn");
    toast("Marked as worn today");
    goTo(cards.length);
  }

  async function reject(target: DailyCard, at: number, picked: Reason[]) {
    patchCard(target.id, { action: "rejected" });
    const ok = feed.demo || (await postFeedback(target.id, "rejected", picked));
    if (!ok) {
      patchCard(target.id, { action: target.action });
      toast("Could not save feedback");
      return;
    }
    trackFunnel("daily_outfit_rejected");
    toast("Feedback recorded. Future picks will avoid this.");
    goTo(at + 1);
  }

  const next = !done && index + 1 < cards.length ? cards[index + 1] : null;

  return (
    <>
      <TopBar onClose={onClose} counter={done ? null : `${index + 1} of ${cards.length}`} />
      {feed.demo && (
        <p className="mx-auto mb-2 max-w-[440px] px-4 text-center text-xs text-white/70">
          Demo outfits from example items. Nothing you do here is saved.
        </p>
      )}

      <div className="mx-auto w-full max-w-[440px] flex-1 px-4">
        <div className="relative">
          {/* The next card peeks out behind the current one */}
          {next && (
            <div
              aria-hidden="true"
              className="absolute inset-0 translate-x-3 scale-[0.96] rounded-3xl bg-white/70"
            />
          )}
          <AnimatePresence mode="wait" initial={false}>
            {card ? (
              <motion.article
                key={card.id}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.28, ease: [0.2, 0.8, 0.3, 1] }}
                aria-label={`Outfit ${index + 1} of ${cards.length}`}
                className="relative rounded-3xl bg-white p-3 text-ink shadow-[0_18px_50px_#0006]"
              >
                <OutfitCollage
                  items={card.itemIds.map((id) => feed.items[id]).filter(Boolean)}
                  showAddFootwear={!feed.hasFootwear}
                />
                <div className="grid gap-2 px-1.5 pt-3 pb-1.5">
                  <p className="text-[14.5px] leading-relaxed text-body">
                    <b className="font-semibold text-ink">Why this: </b>
                    {card.explanation}
                  </p>
                  {card.warnings.map((warning) => (
                    <p key={warning} className="rounded-lg bg-warn-light px-3 py-2 text-[13px] text-warn">
                      {warning}
                    </p>
                  ))}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-mute">
                      {feed.weather
                        ? `Forecast used: ${feed.weather}`
                        : "Forecast unavailable, planned for typical hot and humid weather."}
                    </p>
                    {!reasonsOpen && card.action !== "rejected" && (
                      <button
                        type="button"
                        onClick={() => setReasonsOpen(true)}
                        className="text-[13px] font-medium text-mute underline underline-offset-2 hover:text-ink"
                      >
                        Not for me
                      </button>
                    )}
                  </div>
                  {card.action && (
                    <p className="text-xs text-ok">
                      {card.action === "wore"
                        ? "You wore this today."
                        : card.action === "rejected"
                          ? "You told us this did not work."
                          : "You skipped this earlier."}
                    </p>
                  )}
                  <AnimatePresence initial={false}>
                    {reasonsOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <FeedbackReasons
                          onCancel={() => setReasonsOpen(false)}
                          onSubmit={(picked) => void reject(card, index, picked)}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.article>
            ) : (
              <EndCard key="end" feed={feed} onRestart={() => goTo(0)} />
            )}
          </AnimatePresence>
        </div>
      </div>

      {card && (
        <div className="sticky bottom-0 mx-auto flex w-full max-w-[440px] items-center justify-center gap-5 bg-gradient-to-t from-ink via-ink/90 to-transparent px-4 pt-5 pb-[max(20px,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => skip(card, index)}
            aria-label="Skip this outfit"
            className="grid size-16 place-items-center rounded-full border-2 border-white/80 transition hover:bg-white/10"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="size-7" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => void wear(card)}
            disabled={card.action === "wore"}
            className="rounded-full bg-tangerine px-6 py-4 text-[15px] font-semibold text-ink transition hover:brightness-95 disabled:opacity-60"
          >
            {card.action === "wore" ? "Wearing today" : "Wear today"}
          </button>
          <button
            type="button"
            onClick={() => void toggleSave(card, index)}
            aria-pressed={card.saved}
            aria-label={card.saved ? "Remove from saved outfits" : "Save this outfit"}
            className="grid size-16 place-items-center rounded-full bg-white text-ink transition hover:bg-white/90"
          >
            <BookmarkIcon filled={card.saved} className="size-7" />
          </button>
        </div>
      )}
    </>
  );
}

function EndCard({
  feed,
  onRestart,
}: {
  feed: Extract<DailyFeed, { status: "ready" }>;
  onRestart: () => void;
}) {
  const saved = feed.cards.filter((card) => card.saved);
  const worn = feed.cards.find((card) => card.action === "wore");

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="relative rounded-3xl bg-white p-6 text-center text-ink"
    >
      <h2 className="text-lg font-semibold tracking-tight">
        {worn ? "Enjoy today's outfit" : "That's today's outfits"}
      </h2>
      <p className="mx-auto mt-1 max-w-[36ch] text-sm text-mute">
        New outfits arrive at midnight. For something specific, plan it for an occasion.
      </p>

      {saved.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-mute">Saved today</p>
          <div className="mx-auto mt-2 grid max-w-[300px] grid-cols-3 gap-2">
            {saved.map((card) => (
              <OutfitCollage
                key={card.id}
                size="thumb"
                items={card.itemIds.map((id) => feed.items[id]).filter(Boolean)}
              />
            ))}
          </div>
        </div>
      )}

      {feed.addedSinceBatch > 0 && (
        <p className="mt-4 text-[13px] text-body">
          You added {feed.addedSinceBatch} {feed.addedSinceBatch === 1 ? "item" : "items"} today.
          {feed.addedSinceBatch === 1 ? " It" : " They"} will show up in tomorrow&apos;s outfits.
        </p>
      )}

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link
          href="/wardrobe/outfits"
          className="rounded-lg bg-cobalt px-4 py-2.5 text-sm font-medium text-white"
        >
          Saved outfits
        </Link>
        <Link href="/planner" className="rounded-lg border border-line px-4 py-2.5 text-sm font-medium">
          Plan for an occasion
        </Link>
      </div>
      <button
        type="button"
        onClick={onRestart}
        className="mt-4 text-[13px] font-medium text-mute underline underline-offset-2 hover:text-ink"
      >
        Look through today&apos;s outfits again
      </button>
    </motion.section>
  );
}
