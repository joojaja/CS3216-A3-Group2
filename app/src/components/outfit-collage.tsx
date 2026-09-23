"use client";

import { useState } from "react";
import { arrangeOutfit } from "@/lib/outfits/arrange";
import type { CollageItem } from "@/lib/outfits/types";

export type { CollageItem };

export function itemLabel(item: Pick<CollageItem, "category" | "subcategory" | "primary_colour">) {
  return [item.primary_colour, item.subcategory ?? item.category].filter(Boolean).join(" ");
}

// Fades a photo's edges into the card, so an item without a cut-out has no
// hard rectangle around it. Applied to the image element itself, which is
// sized to the picture, so every edge fades whatever its shape
const FADED_EDGES = "radial-gradient(ellipse closest-side, #000 72%, transparent 100%)";

// The outfit card picture, laid out from the user's own photos. Nothing is
// generated. Each item is its transparent cut-out, made on the device from
// the user's photo, drawn straight onto the card. Items without one yet show
// their photo with faded edges. "full" is the swipe card, which supplies its
// own background; "thumb" is the wardrobe strip and saved list, on a tile.
export function OutfitCollage({
  items,
  size = "full",
  deletedCount = 0,
}: {
  items: CollageItem[];
  size?: "full" | "thumb";
  // Items the outfit referenced that have since been deleted
  deletedCount?: number;
}) {
  const slots = arrangeOutfit(items);
  const thumb = size === "thumb";
  const label = items.map(itemLabel).join(", ");
  const hasRight = slots.extras.length > 0 || Boolean(slots.footwear);

  return (
    <div
      role="img"
      aria-label={label ? `Outfit: ${label}` : "Outfit"}
      className={`relative aspect-[4/5] w-full overflow-hidden p-[6%] ${
        thumb ? "rounded-xl bg-wash/70" : ""
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
            {slots.footwear && (
              <Slot item={slots.footwear} thumb={thumb} className="relative h-[34%] shrink-0" />
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
  // A cut-out that fails to load falls back to the photo, then to a label
  const [cutoutFailed, setCutoutFailed] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(false);
  const label = itemLabel(item);
  const cutout = item.cutout_url && !cutoutFailed ? item.cutout_url : null;
  const src = cutout ?? (photoFailed ? null : item.signed_image_url);

  if (!src) {
    return (
      <div className={className}>
        <div className="grid size-full place-items-center p-1 text-center">
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
      <div className={`absolute inset-0 flex items-center justify-center ${loaded ? "" : "shim"}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={src}
          // A cached image can finish before hydration attaches onLoad
          ref={(el) => {
            if (el?.complete && el.naturalWidth > 0 && !loaded) setLoaded(true);
          }}
          src={src}
          alt={label}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => {
            setLoaded(false);
            if (cutout) setCutoutFailed(true);
            else setPhotoFailed(true);
          }}
          style={
            cutout
              ? undefined
              : { maskImage: FADED_EDGES, WebkitMaskImage: FADED_EDGES }
          }
          className={`max-h-full max-w-full object-contain transition-opacity duration-300 ${
            cutout
              ? thumb
                ? "drop-shadow-[0_2px_3px_rgba(26,28,25,0.14)]"
                : "drop-shadow-[0_8px_14px_rgba(26,28,25,0.16)]"
              : "mix-blend-multiply"
          } ${loaded ? "opacity-100" : "opacity-0"}`}
        />
      </div>
    </div>
  );
}
