"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useMotionValue, useTransform } from "motion/react";
import { OutfitCollage } from "@/components/outfit-collage";
import { FeedbackReasons } from "@/components/feedback-reasons";
import { BookmarkIcon } from "@/components/outfit-planner";
import { FEEDBACK_REASONS, type Reason } from "@/components/planner-context";
import { useToast } from "@/components/toast";
import { markDailyShown } from "@/components/daily-auto-open";
import { CUTOUTS_UPDATED_EVENT } from "@/lib/image/cutout";
import { trackFunnel } from "@/lib/analytics";
import { saveOutfit, unsaveOutfit } from "@/lib/outfits/saved-client";
import type { DailyAction, DailyCard, DailyFeed } from "@/lib/outfits/types";

// Signed image links last an hour. Refetch on return after this long
const STALE_MS = 50 * 60 * 1000;
// How long a skip can be undone before it is written
const UNDO_MS = 5000;
// How far, in pixels, or how fast a card must be dragged to count as a swipe
const SWIPE_DISTANCE = 110;
const SWIPE_VELOCITY = 600;

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
    // New cut-outs were just made on this page: show them
    function onCutouts() {
      void fetchFeed().then((next) => {
        if (live) apply(next);
      });
    }
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener(CUTOUTS_UPDATED_EVENT, onCutouts);
    return () => {
      live = false;
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener(CUTOUTS_UPDATED_EVENT, onCutouts);
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

  // A wear counts towards today's streak straight away
  const markWornToday = useCallback(() => {
    setState((prev) => {
      if (prev.status !== "loaded" || prev.feed.streak.wornToday) return prev;
      const { days } = prev.feed.streak;
      return { ...prev, feed: { ...prev.feed, streak: { days: days + 1, wornToday: true } } };
    });
  }, []);

  return { state, reload: load, patchCard, markWornToday };
}

// Milliseconds until the given time, ticking every 30 seconds
export function useCountdown(target: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);
  return Date.parse(target) - now;
}

export function refreshLabel(ms: number) {
  if (ms <= 0) return "New outfits ready";
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 1) return `Refreshes in ${hours} ${hours === 1 ? "hr" : "hrs"}`;
  const minutes = Math.max(1, Math.ceil(ms / 60_000));
  return `Refreshes in ${minutes} min`;
}

export function StreakBadge({ days, wornToday }: { days: number; wornToday: boolean }) {
  const label =
    days === 0
      ? "No wear streak yet. Mark an outfit as worn to start one."
      : `${days}-day wear streak${wornToday ? "" : ". Wear something today to keep it going."}`;
  return (
    <span
      title={label}
      aria-label={label}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums ${
        days > 0 && wornToday ? "bg-tangerine-light text-ink" : "bg-wash text-mute"
      }`}
    >
      <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor" aria-hidden="true">
        <path d="M12 2c1 3.2-.6 5-2 6.6C8.6 10.2 7 12 7 14.6A5 5 0 0 0 12 20a5 5 0 0 0 5-5.2c0-2.3-1.2-3.8-2.3-5 .2 1.6-.3 2.8-1.4 3.4.3-3.8-.4-8.3-1.3-11.2z" />
      </svg>
      {days}
    </span>
  );
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
// Opened automatically on the first visit of the day (auto), closing goes
// back to the page the user came to; otherwise it returns to the wardrobe
export function DailyFeedView({ start, auto = false }: { start: number | null; auto?: boolean }) {
  const router = useRouter();
  const { state, reload, patchCard, markWornToday } = useDailyFeed();

  useEffect(() => {
    markDailyShown();
    trackFunnel("daily_feed_opened", { trigger: auto ? "auto" : "manual" });
  }, [auto]);

  const close = useCallback(() => {
    if (auto && window.history.length > 1) router.back();
    else router.push("/wardrobe");
  }, [auto, router]);

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
        <ReadyFeed
          feed={state.feed}
          start={start}
          onClose={close}
          onReload={() => void reload()}
          patchCard={patchCard}
          onWorn={markWornToday}
        />
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
  onReload,
  patchCard,
  onWorn,
}: {
  feed: Extract<DailyFeed, { status: "ready" }>;
  start: number | null;
  onClose: () => void;
  onReload: () => void;
  patchCard: (id: string, patch: Partial<DailyCard>) => void;
  onWorn: () => void;
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
  // Which way the current card leaves: -1 to the left (skip), 1 to the right (save)
  const [exitDirection, setExitDirection] = useState<-1 | 1>(-1);
  const [reasonsOpen, setReasonsOpen] = useState(false);
  const pendingSkips = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const remaining = useCountdown(feed.nextRefreshAt);
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

  function goTo(next: number, direction: -1 | 1 = -1) {
    setExitDirection(direction);
    setReasonsOpen(false);
    setIndex(next);
    if (next >= cards.length) trackFunnel("daily_feed_finished");
  }

  // Left and right arrows move between cards without recording anything
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target;
      if (reasonsOpen || (target instanceof Element && target.closest("input, textarea, select"))) return;
      if (event.key === "ArrowRight" && index < cards.length) goTo(index + 1, -1);
      if (event.key === "ArrowLeft" && index > 0) goTo(index - 1, 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function skip(target: DailyCard, at: number) {
    goTo(at + 1, -1);
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
        goTo(at, 1);
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
    goTo(at + 1, 1);
    toast("Saved to your outfits", {
      label: "Undo",
      onClick: async () => {
        patchCard(target.id, { saved: false });
        if (!feed.demo && !(await unsaveOutfit(target.id))) {
          patchCard(target.id, { saved: true });
          toast("Could not undo the save");
          return;
        }
        goTo(at, -1);
      },
    });
  }

  // A swipe right saves, or just moves on when the card is already saved
  function swipeRight(target: DailyCard, at: number) {
    if (target.saved) goTo(at + 1, 1);
    else void toggleSave(target, at);
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
    onWorn();
    toast("Marked as worn today");
    goTo(cards.length, 1);
  }

  async function reject(target: DailyCard, at: number, picked: Reason[]) {
    patchCard(target.id, { action: "rejected" });
    const ok = feed.demo || (await postFeedback(target.id, "rejected", picked));
    if (!ok) {
      patchCard(target.id, { action: target.action });
      toast("Could not save feedback");
      return;
    }
    trackFunnel("daily_outfit_rejected", picked[0] ? { reason: picked[0] } : undefined);
    toast("Feedback recorded. Future picks will avoid this.");
    goTo(at + 1, -1);
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
      {remaining <= 0 && (
        <div className="mx-auto mb-3 flex w-full max-w-[440px] items-center justify-between gap-3 px-4">
          <p className="text-sm text-white/85">A new day, new outfits.</p>
          <button
            type="button"
            onClick={onReload}
            className="rounded-full bg-white px-4 py-2 text-sm font-medium text-ink"
          >
            New outfits ready
          </button>
        </div>
      )}

      <div className="mx-auto w-full max-w-[440px] flex-1 px-4">
        {!feed.hasFootwear && !done && <ShoeTip />}
        <div className="relative">
          {/* The next card peeks out behind the current one */}
          {next && (
            <div
              aria-hidden="true"
              className="absolute inset-0 translate-x-3 scale-[0.96] rounded-3xl bg-white/70"
            />
          )}
          <AnimatePresence mode="wait" initial={false} custom={exitDirection}>
            {card ? (
              <SwipeCard
                key={card.id}
                direction={exitDirection}
                draggable={!reasonsOpen}
                label={`Outfit ${index + 1} of ${cards.length}`}
                onSwipeLeft={() => skip(card, index)}
                onSwipeRight={() => swipeRight(card, index)}
              >
                <OutfitCollage items={card.itemIds.map((id) => feed.items[id]).filter(Boolean)} />
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
              </SwipeCard>
            ) : (
              <EndCard key="end" feed={feed} remaining={remaining} onRestart={() => goTo(0, 1)} />
            )}
          </AnimatePresence>
        </div>
        {card && (
          <p className="mt-3 text-center text-xs text-white/55">
            Swipe left to skip, right to save. Arrow keys move between outfits.
          </p>
        )}
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

// A dismissed shoe tip stays away for a week, then returns if the wardrobe
// still has no shoes
const SHOE_TIP_KEY = "wearabouts:shoe-tip-dismissed";
const SHOE_TIP_EVENT = "wearabouts:shoe-tip-toggle";
const SHOE_TIP_QUIET_MS = 7 * 24 * 60 * 60 * 1000;

function shoeTipDismissed() {
  try {
    const at = Number(localStorage.getItem(SHOE_TIP_KEY));
    return Number.isFinite(at) && at > 0 && Date.now() - at < SHOE_TIP_QUIET_MS;
  } catch {
    return false;
  }
}

function subscribeShoeTip(onChange: () => void) {
  window.addEventListener(SHOE_TIP_EVENT, onChange);
  return () => window.removeEventListener(SHOE_TIP_EVENT, onChange);
}

// Suggests adding shoes without taking a slot in the outfit itself
function ShoeTip() {
  // Hidden on the server and until storage has been read
  const dismissed = useSyncExternalStore(subscribeShoeTip, shoeTipDismissed, () => true);
  if (dismissed) return null;

  function dismiss() {
    try {
      localStorage.setItem(SHOE_TIP_KEY, String(Date.now()));
    } catch {
      // Storage blocked: hidden until the page reloads
    }
    window.dispatchEvent(new Event(SHOE_TIP_EVENT));
  }

  return (
    <div className="mb-3 flex items-center gap-2 rounded-full bg-white/10 py-1.5 pr-1.5 pl-4 text-[13px] text-white/90">
      <span className="min-w-0 flex-1">
        Outfits look finished with shoes.{" "}
        <Link href="/wardrobe/new" className="font-semibold text-white underline underline-offset-2">
          Add a pair
        </Link>
      </span>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss the shoes tip"
        className="grid size-8 shrink-0 place-items-center rounded-full transition hover:bg-white/10"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="size-4" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  );
}

const cardMotion = {
  enter: { opacity: 0, x: 40, rotate: 0 },
  center: { opacity: 1, x: 0, rotate: 0 },
  exit: (direction: -1 | 1) => ({ opacity: 0, x: direction * 320, rotate: direction * 10 }),
};

// One outfit card that can be dragged sideways. Past the threshold it
// counts as a swipe; otherwise it springs back. Every swipe has a button too
function SwipeCard({
  direction,
  draggable,
  label,
  onSwipeLeft,
  onSwipeRight,
  children,
}: {
  direction: -1 | 1;
  draggable: boolean;
  label: string;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  children: React.ReactNode;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-240, 240], [-9, 9]);
  const skipHint = useTransform(x, [-SWIPE_DISTANCE, -30], [1, 0]);
  const saveHint = useTransform(x, [30, SWIPE_DISTANCE], [0, 1]);

  return (
    <motion.article
      custom={direction}
      variants={cardMotion}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.28, ease: [0.2, 0.8, 0.3, 1] }}
      drag={draggable ? "x" : false}
      dragSnapToOrigin
      dragElastic={0.7}
      style={{ x, rotate, touchAction: "pan-y" }}
      onDragEnd={(_, info) => {
        if (info.offset.x < -SWIPE_DISTANCE || info.velocity.x < -SWIPE_VELOCITY) onSwipeLeft();
        else if (info.offset.x > SWIPE_DISTANCE || info.velocity.x > SWIPE_VELOCITY) onSwipeRight();
      }}
      aria-label={label}
      className="relative cursor-grab rounded-3xl bg-white p-3 text-ink shadow-[0_18px_50px_#0006] active:cursor-grabbing"
    >
      <motion.span
        aria-hidden="true"
        style={{ opacity: skipHint }}
        className="pointer-events-none absolute top-6 right-6 z-20 rotate-6 rounded-lg border-2 border-bad bg-white/90 px-3 py-1 text-sm font-bold tracking-wide text-bad uppercase"
      >
        Skip
      </motion.span>
      <motion.span
        aria-hidden="true"
        style={{ opacity: saveHint }}
        className="pointer-events-none absolute top-6 left-6 z-20 -rotate-6 rounded-lg border-2 border-ok bg-white/90 px-3 py-1 text-sm font-bold tracking-wide text-ok uppercase"
      >
        Save
      </motion.span>
      {children}
    </motion.article>
  );
}

function EndCard({
  feed,
  remaining,
  onRestart,
}: {
  feed: Extract<DailyFeed, { status: "ready" }>;
  remaining: number;
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
        {refreshLabel(remaining)}. For something specific, plan it for an occasion.
      </p>
      {feed.streak.days > 0 && (
        <p className="mt-3">
          <StreakBadge days={feed.streak.days} wornToday={feed.streak.wornToday} />
        </p>
      )}

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
