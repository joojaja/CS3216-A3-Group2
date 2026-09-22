"use client";

import Link from "next/link";
import { OutfitCollage } from "@/components/outfit-collage";
import { NotEnough, useDailyFeed } from "@/components/daily-feed";
import type { DailyCard } from "@/lib/outfits/types";

function badgeFor(card: DailyCard) {
  if (card.action === "wore") return "Wearing";
  if (card.saved) return "Saved";
  if (card.action === "dismissed") return "Skipped";
  if (card.action === "rejected") return "Not for me";
  return null;
}

// Today's outfits at the top of the wardrobe: three thumbnails that open the
// full-screen view at that card
export function DailyStrip() {
  const { state, reload } = useDailyFeed();
  const ready = state.status === "loaded" && state.feed.status === "ready" ? state.feed : null;

  return (
    <section aria-labelledby="daily-strip-title" className="mb-6 rounded-2xl border border-line bg-white p-4 md:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <h2 id="daily-strip-title" className="flex items-center gap-2">
          <SparkIcon />
          Today&apos;s outfits
        </h2>
        {ready?.weather && (
          <span className="max-w-full truncate rounded-full bg-wash px-3 py-1 text-xs text-body">{ready.weather}</span>
        )}
      </div>

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
          <button type="button" onClick={() => void reload()} className="font-medium text-ink underline underline-offset-2">
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
      )}
    </section>
  );
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-[18px] text-cobalt" aria-hidden="true">
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" />
    </svg>
  );
}
