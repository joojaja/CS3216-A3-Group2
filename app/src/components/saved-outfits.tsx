"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { OutfitCollage, itemLabel } from "@/components/outfit-collage";
import { useToast } from "@/components/toast";
import { trackFunnel } from "@/lib/analytics";
import { markOutfitWorn, saveOutfit, unsaveOutfit } from "@/lib/outfits/saved-client";
import type { OutfitSource, SavedOutfitView } from "@/lib/outfits/types";

// The filter row only earns its place once the list is long
const FILTER_THRESHOLD = 12;

const dayFormat = new Intl.DateTimeFormat("en-SG", {
  day: "numeric",
  month: "short",
  timeZone: "Asia/Singapore",
});

function shortDate(value: string) {
  // Plain YYYY-MM-DD dates are Singapore days already, so pin them to midday
  // there to stop the time zone shifting them
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00+08:00`) : new Date(value);
  return dayFormat.format(date);
}

function sourceLabel(outfit: SavedOutfitView) {
  if (outfit.source === "daily") {
    return `Daily outfit · ${shortDate(outfit.feedDate ?? outfit.savedAt)}`;
  }
  return outfit.occasion ? `Planner · "${outfit.occasion}"` : "Planner";
}

export function SavedOutfits({ outfits: initial }: { outfits: SavedOutfitView[] }) {
  const { toast } = useToast();
  const [outfits, setOutfits] = useState(initial);
  const [filter, setFilter] = useState<"all" | OutfitSource>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [wornToday, setWornToday] = useState<Record<string, boolean>>({});

  const open = outfits.find((outfit) => outfit.recommendationId === openId) ?? null;
  const visible = filter === "all" ? outfits : outfits.filter((outfit) => outfit.source === filter);

  async function remove(outfit: SavedOutfitView) {
    const index = outfits.findIndex((o) => o.recommendationId === outfit.recommendationId);
    setOutfits((prev) => prev.filter((o) => o.recommendationId !== outfit.recommendationId));
    setOpenId(null);

    const ok = await unsaveOutfit(outfit.recommendationId);
    if (!ok) {
      setOutfits((prev) => insertAt(prev, index, outfit));
      toast("Could not remove the outfit");
      return;
    }
    trackFunnel("outfit_unsaved");
    toast("Removed from saved outfits", {
      label: "Undo",
      onClick: async () => {
        if (await saveOutfit(outfit.recommendationId)) {
          setOutfits((prev) => insertAt(prev, index, outfit));
          trackFunnel("outfit_saved");
        } else {
          toast("Could not restore the outfit");
        }
      },
    });
  }

  async function wear(outfit: SavedOutfitView) {
    setWornToday((prev) => ({ ...prev, [outfit.recommendationId]: true }));
    if (await markOutfitWorn(outfit.recommendationId)) {
      trackFunnel("saved_outfit_worn");
      toast("Marked as worn today");
    } else {
      setWornToday((prev) => ({ ...prev, [outfit.recommendationId]: false }));
      toast("Could not save that");
    }
  }

  if (outfits.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-wash/60 p-8 text-center md:p-12">
        <p className="font-medium">No saved outfits yet</p>
        <p className="mx-auto mt-1 max-w-[46ch] text-sm text-mute">
          Save outfits from your daily picks or the planner and they&apos;ll collect here.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Link
            href="/planner"
            className="inline-block rounded-lg bg-cobalt px-4 py-2.5 text-sm font-medium text-white"
          >
            Plan an outfit
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {outfits.length > FILTER_THRESHOLD && (
        <div className="mb-5 flex flex-wrap gap-2">
          {(
            [
              { key: "all", label: "All" },
              { key: "daily", label: "Daily" },
              { key: "planner", label: "Planner" },
            ] as const
          ).map((f) => (
            <button
              key={f.key}
              type="button"
              aria-pressed={filter === f.key}
              onClick={() => setFilter(f.key)}
              className={`min-h-[38px] rounded-full border px-3.5 py-1.5 text-[13px] transition ${
                filter === f.key
                  ? "border-ink bg-ink text-white"
                  : "border-line text-mute hover:border-cobalt hover:text-ink"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      <motion.ul layout className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {visible.map((outfit, index) => (
            <motion.li
              layout
              key={outfit.recommendationId}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ delay: Math.min(index, 8) * 0.04, duration: 0.35, ease: [0.2, 0.8, 0.3, 1] }}
            >
              <button
                type="button"
                onClick={() => setOpenId(outfit.recommendationId)}
                className="block w-full overflow-hidden rounded-2xl border border-line bg-white p-3 text-left transition hover:border-cobalt focus:outline-none focus-visible:ring-[3px] focus-visible:ring-cobalt-light"
              >
                <OutfitCollage items={outfit.items} size="thumb" deletedCount={outfit.deletedCount} />
                <p className="mt-3 truncate text-[12.5px] font-medium text-mute">{sourceLabel(outfit)}</p>
                {outfit.explanation && (
                  <p className="mt-1 line-clamp-2 text-[13.5px] leading-snug text-body">
                    {outfit.explanation}
                  </p>
                )}
                {(wornToday[outfit.recommendationId] || outfit.lastWornAt) && (
                  <p className="mt-1.5 text-xs text-ok">
                    {wornToday[outfit.recommendationId]
                      ? "Worn today"
                      : `Last worn ${shortDate(outfit.lastWornAt!)}`}
                  </p>
                )}
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>

      <AnimatePresence>
        {open && (
          <OutfitDetail
            key={open.recommendationId}
            outfit={open}
            worn={Boolean(wornToday[open.recommendationId])}
            onClose={() => setOpenId(null)}
            onRemove={() => void remove(open)}
            onWear={() => void wear(open)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function insertAt<T>(list: T[], index: number, value: T) {
  const next = [...list];
  next.splice(Math.max(0, Math.min(index, next.length)), 0, value);
  return next;
}

// A sheet from the bottom on phones and a side panel on wider screens
function OutfitDetail({
  outfit,
  worn,
  onClose,
  onRemove,
  onWear,
}: {
  outfit: SavedOutfitView;
  worn: boolean;
  onClose: () => void;
  onRemove: () => void;
  onWear: () => void;
}) {
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButton.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40">
      <motion.div
        className="absolute inset-0 bg-ink/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.section
        role="dialog"
        aria-modal="true"
        aria-labelledby="saved-outfit-title"
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 28 }}
        transition={{ duration: 0.3, ease: [0.2, 0.8, 0.3, 1] }}
        className="absolute inset-x-0 bottom-0 max-h-[92dvh] overflow-y-auto rounded-t-2xl bg-white p-5 md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:w-[440px] md:rounded-none md:rounded-l-2xl md:p-6"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id="saved-outfit-title" className="text-lg font-semibold tracking-tight">
              Saved outfit
            </h2>
            <p className="mt-0.5 text-[13px] text-mute">{sourceLabel(outfit)}</p>
          </div>
          <button
            ref={closeButton}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-9 shrink-0 place-items-center rounded-full border border-line transition hover:border-cobalt"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="mx-auto max-w-[340px]">
          <OutfitCollage items={outfit.items} deletedCount={outfit.deletedCount} />
        </div>

        {outfit.items.length === 0 ? (
          <p className="mt-4 rounded-lg bg-wash px-3.5 py-3 text-sm text-body">
            All items in this outfit have been removed from your wardrobe.
          </p>
        ) : (
          <>
            {outfit.explanation && (
              <div className="mt-4 rounded-xl bg-wash px-4 py-3.5 text-[14.5px] leading-relaxed text-body">
                <b className="block font-semibold text-ink">Why this</b>
                {outfit.explanation}
              </div>
            )}
            {outfit.warnings.map((warning) => (
              <p key={warning} className="mt-2 rounded-lg bg-warn-light px-3 py-2 text-[13.5px] text-warn">
                {warning}
              </p>
            ))}
            {outfit.weather && (
              <p className="mt-2 text-xs text-mute">Planned for {outfit.weather}</p>
            )}

            <h3 className="mt-5 text-xs font-semibold uppercase tracking-widest text-mute">
              In this outfit
            </h3>
            <ul className="mt-2 grid gap-1">
              {outfit.items.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/wardrobe/${item.id}`}
                    className="flex items-center justify-between rounded-lg px-2 py-2 text-sm capitalize transition hover:bg-wash"
                  >
                    {itemLabel(item)}
                    <span aria-hidden="true" className="text-mute">→</span>
                  </Link>
                </li>
              ))}
            </ul>
            {outfit.deletedCount > 0 && (
              <p className="mt-1 px-2 text-xs text-mute">
                {outfit.deletedCount === 1
                  ? "1 item was deleted from your wardrobe."
                  : `${outfit.deletedCount} items were deleted from your wardrobe.`}
              </p>
            )}
          </>
        )}

        <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-4">
          {outfit.items.length > 0 &&
            (worn ? (
              <p className="flex-1 self-center text-sm text-ok">Marked as worn today.</p>
            ) : (
              <button
                type="button"
                onClick={onWear}
                className="rounded-lg bg-tangerine px-4 py-2.5 text-sm font-medium text-white transition hover:brightness-95"
              >
                Wearing this today
              </button>
            ))}
          <button
            type="button"
            onClick={onRemove}
            className="rounded-lg border border-line px-4 py-2.5 text-sm font-medium transition hover:border-bad hover:text-bad"
          >
            Remove from saved
          </button>
        </div>
      </motion.section>
    </div>
  );
}
