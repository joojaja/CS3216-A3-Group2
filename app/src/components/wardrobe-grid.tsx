"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import type { WardrobeItem } from "@/lib/types";

const FILTERS: { key: string; label: string }[] = [
  { key: "all", label: "Everything" },
  { key: "top", label: "Tops" },
  { key: "bottom", label: "Bottoms" },
  { key: "footwear", label: "Footwear" },
  { key: "outerwear", label: "Outerwear" },
  { key: "dress", label: "Dresses" },
  { key: "accessory", label: "Accessories" },
];

// Each card opens the item's own page, where it can be edited or deleted.
export function WardrobeGrid({ items }: { items: WardrobeItem[] }) {
  const [filter, setFilter] = useState("all");

  const present = useMemo(() => new Set(items.map((item) => item.category)), [items]);
  const filters = FILTERS.filter((f) => f.key === "all" || present.has(f.key));
  const visible = filter === "all" ? items : items.filter((item) => item.category === filter);

  return (
    <>
      {filters.length > 1 && (
        <div className="mb-5 flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              aria-pressed={filter === f.key}
              onClick={() => setFilter(f.key)}
              className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] transition ${
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

      <motion.div layout className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {visible.map((item, index) => {
            const name = [item.primary_colour, item.subcategory ?? item.category]
              .filter(Boolean)
              .join(" ");
            return (
              <motion.article
                layout
                key={item.id}
                initial={{ opacity: 0, y: 12, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ delay: index * 0.04, duration: 0.38, ease: [0.2, 0.8, 0.3, 1] }}
                whileHover={{ y: -3 }}
                className="overflow-hidden rounded-xl border border-line bg-card shadow-[0_10px_28px_#24282308] transition-colors hover:border-cobalt"
              >
                <Link href={`/wardrobe/${item.id}`} className="block focus:outline-none focus-visible:ring-[3px] focus-visible:ring-cobalt-light">
                  {item.signed_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.signed_image_url}
                      alt={name}
                      className="aspect-square w-full bg-white object-cover"
                    />
                  ) : (
                    <div className="grid aspect-square w-full place-items-center bg-wash px-4 text-center text-sm text-mute">
                      Photo unavailable
                    </div>
                  )}
                  <div className="p-3">
                    <p className="text-sm font-medium capitalize">{name}</p>
                    <p className="mt-0.5 text-[13px] text-mute">
                      {item.formality?.replace("_", " ") ?? "unrated"}
                    </p>
                    {item.weather_tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {item.weather_tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-soft px-2.5 py-0.5 text-[11.5px] text-body"
                          >
                            {tag.replace("_", " ")}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              </motion.article>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
