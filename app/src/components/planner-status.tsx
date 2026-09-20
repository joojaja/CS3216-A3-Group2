"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { usePlanner } from "@/components/planner-context";

// Shows the state of the latest outfit request while the user is on another
// tab: outfits being built, or a reply they have not looked at yet. Hidden on
// the planner page itself, where the thread is visible.
export function PlannerStatus({ variant }: { variant: "rail" | "bar" }) {
  const pathname = usePathname();
  const { latest, seen } = usePlanner();

  const working = latest?.status === "loading";
  const failed = latest?.status === "error";
  const declined = latest?.status === "declined";
  const show = pathname !== "/planner" && latest !== null && (working || !seen);

  const title = working
    ? "Building outfits"
    : failed
      ? "Couldn't build outfits"
      : declined
        ? "Reply ready"
        : "Outfits ready";
  // The rail is narrow, so the second line doubles as the call to action
  // there; the wider mobile bar has room for the occasion and a button
  const message = latest?.message ?? "";
  const count = `${latest?.recs.length ?? 0} outfit${latest?.recs.length === 1 ? "" : "s"}`;
  const detail = working
    ? `For “${message}”`
    : variant === "rail"
      ? failed
        ? "Open to try again"
        : "Open to see it"
      : failed
        ? `“${message}” did not work`
        : declined
          ? `Reply to “${message}”`
          : `${count} for “${message}”`;
  const action = working ? "View" : failed ? "Retry" : "Open";

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key={variant}
          initial={{ opacity: 0, y: variant === "bar" ? 12 : -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: variant === "bar" ? 12 : -6 }}
          transition={{ duration: 0.3, ease: [0.2, 0.8, 0.3, 1] }}
          className={
            variant === "rail"
              ? "mx-3 mb-3 rounded-[10px] border border-line bg-card p-3"
              : "flex items-center gap-3 border-t border-line bg-card px-4 py-2.5 text-ink"
          }
        >
          <Link href="/planner" className="flex items-center gap-3">
            <span className="relative grid size-9 shrink-0 place-items-center rounded-lg bg-soft">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                className="size-[19px] text-ink"
              >
                <circle cx="12" cy="12" r="8" />
                <path d="M12 8v4l3 2" />
              </svg>
              {working && (
                <span className="absolute inset-0 grid place-items-center rounded-lg bg-paper/70">
                  <span className="size-4 animate-spin rounded-full border-2 border-line border-t-ink" />
                </span>
              )}
              {!working && (
                <span
                  className={`absolute -right-0.5 -bottom-0.5 grid size-4 place-items-center rounded-full ${
                    failed ? "bg-bad" : "bg-ok"
                  }`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" className="size-2.5">
                    {failed ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M5 12l5 5L20 7" />}
                  </svg>
                </span>
              )}
            </span>
            <span className="min-w-0 flex-1">
              <b className="block truncate text-[13px] font-medium text-ink">{title}</b>
              <span className="block truncate text-xs text-mute">{detail}</span>
            </span>
            {variant === "bar" && (
              <span
                className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-medium ${
                  working ? "bg-soft text-ink" : "bg-accent text-ink"
                }`}
              >
                {action}
              </span>
            )}
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
