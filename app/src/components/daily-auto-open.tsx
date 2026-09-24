"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { singaporeDate } from "@/lib/outfits/sg-day";
import type { DailyFeed } from "@/lib/outfits/types";

// The Singapore date today's outfits were last shown on this browser
const SHOWN_KEY = "wearabouts:daily-shown";

// Pages where opening the feed would interrupt what the user is doing
const SKIP_PATHS = ["/wardrobe/today", "/wardrobe/new"];

export function dailyShownToday() {
  try {
    return localStorage.getItem(SHOWN_KEY) === singaporeDate();
  } catch {
    // Storage blocked: treat as shown rather than open the feed on every visit
    return true;
  }
}

export function markDailyShown() {
  try {
    localStorage.setItem(SHOWN_KEY, singaporeDate());
  } catch {
    // Storage blocked: nothing to remember
  }
}

function onSkippedPage(pathname: string) {
  return SKIP_PATHS.some((path) => pathname.startsWith(path));
}

// Opens today's outfits the first time the app is opened each Singapore day,
// as long as there is at least one outfit the user has not acted on yet
export function DailyAutoOpen() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (dailyShownToday() || onSkippedPage(pathname)) return;
    let live = true;
    void (async () => {
      try {
        const res = await fetch("/api/daily-outfits", { cache: "no-store" });
        if (!res.ok || !live) return;
        const feed = (await res.json()) as DailyFeed;
        if (!live || feed.status !== "ready") return;
        if (!feed.cards.some((card) => !card.action && !card.saved)) return;
        // The user may have started an upload while the feed loaded
        if (dailyShownToday() || onSkippedPage(window.location.pathname)) return;
        markDailyShown();
        router.push("/wardrobe/today?auto=1");
      } catch {
        // No feed, no auto-open. The wardrobe widget shows the error
      }
    })();
    return () => {
      live = false;
    };
    // Once per app load, not on every navigation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
