"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import type { WardrobeItem } from "@/lib/types";
import { GarmentIcon, tintFor } from "@/components/garment-icon";
import { useToast } from "@/components/toast";

const FILTERS: { key: string; label: string; icon: string }[] = [
  { key: "all", label: "Everything", icon: "all" },
  { key: "top", label: "Tops", icon: "top" },
  { key: "bottom", label: "Bottoms", icon: "bottom" },
  { key: "footwear", label: "Footwear", icon: "footwear" },
  { key: "outerwear", label: "Outerwear", icon: "outerwear" },
  { key: "dress", label: "Dresses", icon: "dress" },
  { key: "accessory", label: "Accessories", icon: "accessory" },
];

export function WardrobeGrid({ items }: { items: WardrobeItem[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [filter, setFilter] = useState("all");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const present = useMemo(() => new Set(items.map((item) => item.category)), [items]);
  const filters = FILTERS.filter((f) => f.key === "all" || present.has(f.key));
  const visible = filter === "all" ? items : items.filter((item) => item.category === filter);

  async function remove(id: string) {
    if (!confirm("Delete this item and its photo?")) return;
    setDeleting(id);
    setError(null);

    const res = await fetch(`/api/items?id=${id}`, { method: "DELETE" });
    setDeleting(null);

    if (!res.ok) {
      setError("Could not delete the item. Try again.");
      return;
    }
    toast("Item removed");
    router.refresh();
  }

  return (
    <>
      {error && <p className="mb-4 text-sm text-bad">{error}</p>}

      {filters.length > 1 && (
        <div className="mb-5 flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[13px] transition ${
                filter === f.key
                  ? "border-ink bg-ink text-white"
                  : "border-line text-mute hover:border-cobalt hover:text-ink"
              }`}
            >
              <GarmentIcon kind={f.icon} className="size-[15px]" strokeWidth={4} />
              {f.label}
            </button>
          ))}
        </div>
      )}

      <motion.div layout className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {visible.map((item, index) => {
            const tint = tintFor(item.primary_colour);
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
                className="group overflow-hidden rounded-xl border border-line bg-white transition-colors hover:border-cobalt"
              >
                {item.signed_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.signed_image_url}
                    alt={name}
                    className="aspect-square w-full object-cover"
                  />
                ) : (
                  <div
                    className="grid aspect-square w-full place-items-center"
                    style={{ background: tint.bg, color: tint.fg }}
                  >
                    <GarmentIcon kind={item.category} className="w-[48%]" />
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
                          className="rounded-md bg-wash px-2 py-0.5 text-[11.5px] text-body"
                        >
                          {tag.replace("_", " ")}
                        </span>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => remove(item.id)}
                    disabled={deleting === item.id}
                    className="mt-2.5 text-xs text-bad opacity-70 transition hover:opacity-100 disabled:opacity-40"
                  >
                    {deleting === item.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </motion.article>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
