"use client";

import { Analytics } from "@vercel/analytics/next";
import { redactAnalyticsUrl } from "@/lib/vercel-analytics";

export function VercelAnalytics() {
  return (
    <Analytics
      beforeSend={(event) => {
        const url = redactAnalyticsUrl(event.url);
        if (url === null) return null;
        return { ...event, url };
      }}
    />
  );
}
