"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import type { WardrobeItem } from "@/lib/types";

export function WardrobeGrid({ items }: { items: WardrobeItem[] }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    router.refresh();
  }

  return (
    <>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm"
          >
            {item.signed_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.signed_image_url}
                alt={item.subcategory ?? item.category}
                className="aspect-square w-full object-cover"
              />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center bg-stone-100 text-xs text-stone-400">
                No image
              </div>
            )}
            <div className="p-3">
              <p className="text-sm font-medium">
                {item.primary_colour ?? ""} {item.subcategory ?? item.category}
              </p>
              <p className="mt-0.5 text-xs text-stone-500">
                {item.formality ?? "unrated"}
                {item.weather_tags.length > 0 &&
                  ` · ${item.weather_tags.join(", ")}`}
              </p>
              <button
                onClick={() => remove(item.id)}
                disabled={deleting === item.id}
                className="mt-2 text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
              >
                {deleting === item.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </>
  );
}
