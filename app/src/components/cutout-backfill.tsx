"use client";

import { useEffect, useState } from "react";
import { cutoutFromImage, NothingDetectedError } from "@/lib/image/clean";
import { CUTOUTS_UPDATED_EVENT } from "@/lib/image/cutout";

export type BackfillItem = { id: string; needsCutout: boolean };

function whenIdle(signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    const run = () => {
      if (document.visibilityState === "visible") {
        if ("requestIdleCallback" in window) window.requestIdleCallback(() => resolve(), { timeout: 2000 });
        else setTimeout(resolve, 300);
        return;
      }
      // Paused while the tab is in the background
      const onVisible = () => {
        if (document.visibilityState !== "visible") return;
        document.removeEventListener("visibilitychange", onVisible);
        run();
      };
      document.addEventListener("visibilitychange", onVisible);
      signal.addEventListener("abort", () => document.removeEventListener("visibilitychange", onVisible), {
        once: true,
      });
    };
    run();
  });
}

// Makes transparent cut-outs for items saved before cut-outs existed, one at
// a time while the browser is idle. The photo is read from our own server,
// the background is removed on this device, and only the resulting PNG is
// stored. Nothing goes to an AI provider.
export function CutoutBackfill({ items }: { items: BackfillItem[] }) {
  const [left, setLeft] = useState(() => items.filter((item) => item.needsCutout).length);

  useEffect(() => {
    const queue = items.filter((item) => item.needsCutout).map((item) => item.id);
    if (queue.length === 0) return;
    const controller = new AbortController();
    const { signal } = controller;

    void (async () => {
      let made = 0;
      for (const id of queue) {
        await whenIdle(signal);
        if (signal.aborted) return;
        try {
          const res = await fetch(`/api/items/cutout?id=${encodeURIComponent(id)}`, { signal });
          if (!res.ok) break;
          const form = new FormData();
          form.set("id", id);
          try {
            form.set("cutout", await cutoutFromImage(await res.blob(), signal));
          } catch (error) {
            if (!(error instanceof NothingDetectedError)) throw error;
            // No garment found: record it so this photo is not tried again
            form.set("failed", "1");
          }
          if (signal.aborted) return;
          const saved = await fetch("/api/items/cutout", { method: "POST", body: form, signal });
          // Signed out, rate limited, or the migration has not run: try another day
          if (!saved.ok) break;
          if (form.get("failed") !== "1") made++;
          setLeft((count) => Math.max(0, count - 1));
        } catch {
          // Offline, cancelled, or the model could not load: stop quietly
          break;
        }
      }
      if (signal.aborted) return;
      setLeft(0);
      if (made > 0) window.dispatchEvent(new Event(CUTOUTS_UPDATED_EVENT));
    })();

    return () => controller.abort();
    // Runs once per page load for the items it was given
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (left === 0) return null;
  return (
    <p className="mb-3 flex items-center gap-2 text-xs text-mute" role="status">
      <span className="size-3 animate-spin rounded-full border-2 border-line border-t-cobalt" aria-hidden="true" />
      Preparing photos for outfit cards, {left} left. This runs on your device.
    </p>
  );
}
