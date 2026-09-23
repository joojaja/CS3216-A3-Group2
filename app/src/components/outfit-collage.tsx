"use client";

import { useState } from "react";
import Link from "next/link";
import { arrangeOutfit } from "@/lib/outfits/arrange";
import type { CollageItem } from "@/lib/outfits/types";

export type { CollageItem };

export function itemLabel(item: Pick<CollageItem, "category" | "subcategory" | "primary_colour">) {
  return [item.primary_colour, item.subcategory ?? item.category].filter(Boolean).join(" ");
}

// The outfit card picture, laid out from the user's own photos. Nothing is
// generated. Every photo sits straight on the light panel with no frame, and
// multiply blends white or pale backgrounds into it so items read as cut-outs.
// A photo with a dark or busy background still shows it.
// "full" is the swipe card, "thumb" is the wardrobe strip and saved list.
export function OutfitCollage({
  items,
  size = "full",
  deletedCount = 0,
  showAddFootwear = false,
}: {
  items: CollageItem[];
  size?: "full" | "thumb";
  // Items the outfit referenced that have since been deleted
  deletedCount?: number;
  // Shows an "Add shoes" tile when the wardrobe has no footwear yet
  showAddFootwear?: boolean;
}) {
  const slots = arrangeOutfit(items);
  const thumb = size === "thumb";
  const label = items.map(itemLabel).join(", ");
  const hasFootwearSlot = Boolean(slots.footwear) || showAddFootwear;
  const hasRight = slots.extras.length > 0 || hasFootwearSlot;

  return (
    <div
      role="img"
      aria-label={label ? `Outfit: ${label}` : "Outfit"}
      className={`relative aspect-[4/5] w-full overflow-hidden bg-gradient-to-b from-white to-wash ${
        thumb ? "rounded-xl p-[6%]" : "rounded-2xl p-[6%]"
      }`}
    >
      <div
        className="grid h-full gap-[5%]"
        style={{
          // minmax(0, ...) stops a label's width from overriding the proportions
          gridTemplateColumns: !hasRight
            ? "minmax(0, 1fr)"
            : slots.extras.length
              ? "minmax(0, 3fr) minmax(0, 2fr)"
              : "minmax(0, 7fr) minmax(0, 3fr)",
        }}
      >
        {/* Left column: the body of the outfit */}
        <div className="relative min-h-0">
          {slots.onepiece ? (
            <Slot item={slots.onepiece} thumb={thumb} className="absolute inset-0" />
          ) : (
            <>
              {slots.top && (
                <Slot
                  item={slots.top}
                  thumb={thumb}
                  className={`absolute top-0 ${
                    slots.bottom ? "h-[52%]" : "h-full"
                  } ${slots.outer ? "right-0 w-[80%]" : "left-0 w-[88%]"}`}
                />
              )}
              {slots.bottom && (
                <Slot
                  item={slots.bottom}
                  thumb={thumb}
                  className={`absolute right-0 bottom-0 w-[82%] ${
                    slots.top ? "h-[54%]" : "h-full"
                  }`}
                />
              )}
            </>
          )}
          {slots.outer && (
            <Slot
              item={slots.outer}
              thumb={thumb}
              className="absolute top-[6%] left-0 z-10 h-[44%] w-[55%]"
            />
          )}
        </div>

        {/* Right column: accessories stacked from the top, shoes at the bottom */}
        {hasRight && (
          <div className="flex min-h-0 flex-col gap-[5%]">
            <div className="flex min-h-0 flex-1 flex-col gap-[6%]">
              {slots.extras.map((item) => (
                <Slot key={item.id} item={item} thumb={thumb} className="relative min-h-0 flex-1" />
              ))}
            </div>
            {slots.footwear ? (
              <Slot item={slots.footwear} thumb={thumb} className="relative h-[34%] shrink-0" />
            ) : (
              showAddFootwear && <AddFootwear thumb={thumb} />
            )}
          </div>
        )}
      </div>

      {deletedCount > 0 && (
        <span
          className={`absolute left-[6%] bottom-[4%] rounded-full border border-line bg-white/90 text-mute ${
            thumb ? "px-2 py-0.5 text-[10.5px]" : "px-2.5 py-1 text-xs"
          }`}
        >
          {deletedCount === 1 ? "1 item deleted" : `${deletedCount} items deleted`}
        </span>
      )}
    </div>
  );
}

function Slot({
  item,
  thumb,
  className,
}: {
  item: CollageItem;
  thumb: boolean;
  className: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const label = itemLabel(item);

  if (!item.signed_image_url || failed) {
    return (
      <div className={className}>
        <div className="grid size-full place-items-center rounded-xl border border-dashed border-line bg-white/60 p-1 text-center">
          {/* Thumbnails only have room for the category */}
          <span className={`max-w-full capitalize text-mute ${thumb ? "truncate text-[10px] leading-tight" : "text-xs"}`}>
            {thumb ? item.category : label || "Item"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className={`relative size-full overflow-hidden ${loaded ? "" : "shim"}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          // A cached image can finish before hydration attaches onLoad
          ref={(el) => {
            if (el?.complete && el.naturalWidth > 0 && !loaded) setLoaded(true);
          }}
          src={item.signed_image_url}
          alt={label}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`size-full object-contain mix-blend-multiply transition-opacity duration-300 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>
    </div>
  );
}

function AddFootwear({ thumb }: { thumb: boolean }) {
  const body = (
    <span className={`text-center text-mute ${thumb ? "text-[10px]" : "text-xs"}`}>
      {thumb ? "No shoes" : "Add shoes"}
    </span>
  );
  const className =
    "relative grid h-[34%] shrink-0 place-items-center rounded-xl border border-dashed border-mute/50 bg-white/50";

  // A nested link inside the thumbnail's own link would be invalid markup
  return thumb ? (
    <div className={className}>{body}</div>
  ) : (
    <Link href="/wardrobe/new" className={`${className} transition hover:border-cobalt hover:bg-white`}>
      {body}
    </Link>
  );
}
