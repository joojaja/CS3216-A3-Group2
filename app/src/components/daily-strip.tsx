"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { OutfitCollage } from "@/components/outfit-collage";
import {
  NotEnough,
  refreshLabel,
  StreakBadge,
  useCountdown,
  useDailyFeed,
} from "@/components/daily-feed";
import type { DailyCard, DailyFeed } from "@/lib/outfits/types";

// Whether the strip is expanded, remembered on this browser. Collapsed by
// default so the wardrobe itself stays in view
const OPEN_KEY = "wearabouts:daily-strip-open";
const OPEN_EVENT = "wearabouts:daily-strip-toggle";

function readOpen() {
  try {
    return localStorage.getItem(OPEN_KEY) === "1";
  } catch {
    return false;
  }
}

function writeOpen(open: boolean) {
  try {
    localStorage.setItem(OPEN_KEY, open ? "1" : "0");
  } catch {
    // Storage blocked: the choice is not remembered
  }
  window.dispatchEvent(new Event(OPEN_EVENT));
}

function subscribeOpen(onChange: () => void) {
  window.addEventListener(OPEN_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(OPEN_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function badgeFor(card: DailyCard) {
  if (card.action === "wore") return "Wearing";
  if (card.saved) return "Saved";
  if (card.action === "dismissed") return "Skipped";
  if (card.action === "rejected") return "Not for me";
  return null;
}

type ReadyFeed = Extract<DailyFeed, { status: "ready" }>;

// Today's outfits at the top of the wardrobe. Collapsed, it is one row with
// small previews and a link into the swipe view. Expanded, it shows three
// thumbnails that open the full-screen view at that card
export function DailyStrip() {
  const { state, reload } = useDailyFeed();
  const ready = state.status === "loaded" && state.feed.status === "ready" ? state.feed : null;
  const hasCards = Boolean(ready && ready.cards.length > 0);
  const open = useSyncExternalStore(subscribeOpen, readOpen, () => false);

  return (
    <section
      aria-labelledby="daily-strip-title"
      className="mb-5 rounded-2xl border border-line bg-white px-3 py-2 md:px-4"
    >
      <div className="flex min-h-11 items-center gap-3">
        <h2 id="daily-strip-title" className="flex shrink-0 items-center gap-2">
          <SparkIcon />
          Today&apos;s outfits
        </h2>

        {!open && ready && hasCards && (
          <Link
            href="/wardrobe/today"
            tabIndex={-1}
            aria-hidden="true"
            className="hidden -space-x-2.5 sm:flex"
          >
            {ready.cards.map((card) => (
              <span key={card.id} className="w-9 shrink-0 rounded-xl bg-white ring-2 ring-white">
                <OutfitCollage size="thumb" items={card.itemIds.map((id) => ready.items[id]).filter(Boolean)} />
              </span>
            ))}
          </Link>
        )}
        {!open && state.status === "loading" && (
          <div className="shim hidden h-4 w-28 sm:block" aria-busy="true" aria-label="Loading today's outfits" />
        )}
        {!open && state.status === "error" && (
          <button
            type="button"
            onClick={() => void reload()}
            className="min-w-0 truncate text-sm text-mute underline underline-offset-2"
          >
            Could not load. Try again
          </button>
        )}
        {!open && state.status === "loaded" && state.feed.status === "insufficient" && (
          <Link href="/wardrobe/new" className="min-w-0 truncate text-sm text-mute underline underline-offset-2">
            Add a few pieces to start
          </Link>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          {/* Phones have room for the streak only when expanded */}
          {state.status === "loaded" && (
            <span className={open ? "inline-flex" : "hidden sm:inline-flex"}>
              <StreakBadge days={state.feed.streak.days} wornToday={state.feed.streak.wornToday} />
            </span>
          )}
          {open && state.status === "loaded" && (
            <span className="hidden sm:inline">
              <RefreshPill target={state.feed.nextRefreshAt} onReady={() => void reload()} />
            </span>
          )}
          {hasCards && (
            <Link
              href="/wardrobe/today"
              className="rounded-full bg-ink px-3.5 py-1.5 text-xs font-medium whitespace-nowrap text-white transition hover:bg-ink/85"
            >
              Swipe through
            </Link>
          )}
          <button
            type="button"
            onClick={() => writeOpen(!open)}
            aria-expanded={open}
            aria-controls="daily-strip-body"
            aria-label={open ? "Collapse today's outfits" : "Expand today's outfits"}
            className="grid size-9 place-items-center rounded-full text-mute transition hover:bg-wash hover:text-ink"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`size-5 transition-transform ${open ? "rotate-180" : ""}`}
              aria-hidden="true"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </div>
      </div>

      <div id="daily-strip-body" hidden={!open} className="pt-2 pb-2">
        {open && <StripBody state={state} ready={ready} onReload={() => void reload()} />}
      </div>
    </section>
  );
}

function StripBody({
  state,
  ready,
  onReload,
}: {
  state: ReturnType<typeof useDailyFeed>["state"];
  ready: ReadyFeed | null;
  onReload: () => void;
}) {
  return (
    <>
      {state.status === "loading" && (
        <div className="grid grid-cols-3 gap-2.5 md:max-w-[520px]" aria-busy="true" aria-label="Loading today's outfits">
          {[0, 1, 2].map((i) => (
            <div key={i} className="shim aspect-[4/5] !rounded-xl" />
          ))}
        </div>
      )}

      {state.status === "error" && (
        <div className="flex flex-wrap items-center gap-3 text-sm text-mute">
          <span>{state.message}</span>
          <button type="button" onClick={onReload} className="font-medium text-ink underline underline-offset-2">
            Try again
          </button>
        </div>
      )}

      {state.status === "loaded" && state.feed.status === "insufficient" && (
        <div className="py-2">
          <NotEnough feed={state.feed} />
        </div>
      )}

      {ready && ready.cards.length === 0 && (
        <p className="text-sm text-mute">
          Today&apos;s outfits used items that have since been removed. New outfits arrive at midnight.
        </p>
      )}

      {ready && ready.cards.length > 0 && (
        <>
          <ul className="grid grid-cols-3 gap-2.5 md:max-w-[520px]">
            {ready.cards.map((card, index) => {
              const badge = badgeFor(card);
              return (
                <li key={card.id} className="relative">
                  <Link
                    href={`/wardrobe/today?start=${index}`}
                    aria-label={`Open outfit ${index + 1} of today's outfits${badge ? `, ${badge.toLowerCase()}` : ""}`}
                    className="block rounded-xl ring-cobalt-light transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-[3px]"
                  >
                    <OutfitCollage
                      size="thumb"
                      items={card.itemIds.map((id) => ready.items[id]).filter(Boolean)}
                    />
                  </Link>
                  {badge && (
                    <span className="pointer-events-none absolute top-1.5 right-1.5 rounded-full bg-ink/80 px-2 py-0.5 text-[10.5px] font-medium text-white">
                      {badge}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs text-mute">
            {ready.weather
              ? `Planned for ${ready.weather}`
              : "Forecast unavailable, planned for typical hot and humid weather."}
          </p>
        </>
      )}
    </>
  );
}

function RefreshPill({ target, onReady }: { target: string; onReady: () => void }) {
  const remaining = useCountdown(target);
  if (remaining <= 0) {
    return (
      <button
        type="button"
        onClick={onReady}
        className="rounded-full bg-ink px-3 py-1 text-xs font-medium text-white"
      >
        New outfits ready
      </button>
    );
  }
  return (
    <span className="rounded-full bg-wash px-3 py-1 text-xs whitespace-nowrap text-body">
      {refreshLabel(remaining)}
    </span>
  );
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-[18px] text-cobalt" aria-hidden="true">
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" />
    </svg>
  );
}
