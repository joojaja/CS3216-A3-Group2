"use client";

import { useEffect, useSyncExternalStore } from "react";
import { FUNNEL_EVENTS, analyticsPage, type FunnelEvent } from "@/lib/analytics";
import { usePathname } from "next/navigation";

const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const configured = Boolean(
  measurementId && /^G-[A-Z0-9]+$/.test(measurementId),
);
const key = "drape-analytics-consent";
type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
};
function snapshot() {
  try {
    return localStorage.getItem(key);
  } catch {
    return "denied";
  }
}
function subscribe(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener("drape-consent", listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener("drape-consent", listener);
  };
}

export function AnalyticsConsent() {
  const consent = useSyncExternalStore(subscribe, snapshot, () => "loading");
  const pathname = usePathname();
  const page = analyticsPage(pathname);
  useEffect(() => {
    if (!configured || consent !== "granted") return;
    const win = window as AnalyticsWindow;
    // Keep private route IDs, auth codes, form values and referrers out of analytics.
    if (!win.gtag) {
      win.dataLayer = win.dataLayer || [];
      // The Google tag consumes the arguments object from its documented queue snippet.
      win.gtag = function () {
        // eslint-disable-next-line prefer-rest-params
        win.dataLayer!.push(arguments);
      };
      win.gtag("consent", "default", {
        analytics_storage: "granted",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      });
      win.gtag("js", new Date());
      win.gtag("config", measurementId, {
        send_page_view: false,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
        page_location: window.location.origin,
        page_referrer: "",
        page_title: "Wearabouts",
      });
      const script = document.createElement("script");
      script.id = "drape-analytics";
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      document.head.appendChild(script);
    }
    const send = (name: string) =>
      win.gtag?.("event", name, {
        page_location: window.location.origin,
        page_referrer: "",
        page_title: `Wearabouts | ${page}`,
        page_group: page,
      });
    if (page !== "other") {
      send("page_view");
      if (page === "landing" || page === "onboarding") send(`${page}_view`);
    }
    const funnel = (event: Event) => {
      const name = (event as CustomEvent).detail;
      if (FUNNEL_EVENTS.includes(name as FunnelEvent)) send(name);
    };
    const click = (event: MouseEvent) => {
      const link =
        event.target instanceof Element ? event.target.closest("a") : null;
      if (
        page === "landing" &&
        link?.getAttribute("href")?.startsWith("/login?mode=signup")
      )
        send("start_wardrobe_clicked");
    };
    window.addEventListener("drape-funnel", funnel);
    document.addEventListener("click", click);
    return () => {
      window.removeEventListener("drape-funnel", funnel);
      document.removeEventListener("click", click);
    };
  }, [consent, page]);

  function choose(value: "granted" | "denied") {
    try {
      localStorage.setItem(key, value);
    } catch {
      return;
    }
    window.dispatchEvent(new Event("drape-consent"));
    if (value === "denied") {
      const win = window as AnalyticsWindow;
      win.gtag?.("consent", "update", {
        analytics_storage: "denied",
        ad_storage: "denied",
      });
      // Remove analytics cookies on withdrawal, then unload the third-party script.
      for (const cookie of document.cookie.split(";")) {
        const name = cookie.trim().split("=")[0];
        if (!name.startsWith("_ga")) continue;
        document.cookie = `${name}=; Max-Age=0; path=/`;
        const parts = window.location.hostname.split(".");
        for (let i = 0; i < parts.length - 1; i++)
          document.cookie = `${name}=; Max-Age=0; path=/; domain=.${parts.slice(i).join(".")}`;
      }
      if (win.gtag) window.location.reload();
    }
  }
  if (!configured || consent === "loading") return null;
  if (consent)
    return pathname === "/privacy" ? (
      <div className="analytics-settings">
        <p>
          Usage analytics are {consent === "granted" ? "on" : "off"} on this
          browser.
        </p>
        <button
          onClick={() => choose(consent === "granted" ? "denied" : "granted")}
        >
          {consent === "granted" ? "Turn off analytics" : "Allow analytics"}
        </button>
      </div>
    ) : null;
  return (
    <aside className="analytics-banner" aria-label="Optional usage analytics">
      <p>
        Help improve Wearabouts with optional usage analytics. We track page visits and completed
        actions, never wardrobe photos or your answers.{" "}
        <a href="/privacy">Privacy details</a>
      </p>
      <div>
        <button onClick={() => choose("denied")}>No thanks</button>
        <button onClick={() => choose("granted")}>Allow analytics</button>
      </div>
    </aside>
  );
}
