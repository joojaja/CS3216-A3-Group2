"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { usePlanner } from "@/components/planner-context";

// Shows the state of an outfit request while the user is on another tab:
// outfits being built, or a finished result they have not looked at yet.
// Hidden on the planner page itself, where the result is visible.
export function PlannerStatus({ variant }: { variant: "rail" | "bar" }) {
  const pathname = usePathname();
  const { status, seen, requestedFor, recs } = usePlanner();

  const working = status === "loading";
  const failed = status === "error";
  const show = pathname !== "/planner" && (working || (!seen && (status === "done" || failed)));

  const title = working ? "Building outfits" : failed ? "Couldn't build outfits" : "Outfits ready";
  // The rail is narrow, so the second line doubles as the call to action
  // there; the wider mobile bar has room for the occasion and a button
  const count = `${recs.length} outfit${recs.length === 1 ? "" : "s"}`;
  const detail = working
    ? `For “${requestedFor}”`
    : variant === "rail"
      ? failed
        ? "Open to try again"
        : "Open to see them"
      : failed
        ? `“${requestedFor}” did not work`
        : `${count} for “${requestedFor}”`;
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
              ? "mx-3 mb-3 rounded-[10px] bg-white/12 p-3"
              : "flex items-center gap-3 border-t border-white/20 bg-cobalt-deep px-4 py-2.5 text-white"
          }
        >
          <Link href="/planner" className="flex items-center gap-3">
            <span className="relative grid size-9 shrink-0 place-items-center rounded-lg bg-white/15">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                className="size-[19px] text-white"
              >
                <circle cx="12" cy="12" r="8" />
                <path d="M12 8v4l3 2" />
              </svg>
              {working && (
                <span className="absolute inset-0 grid place-items-center rounded-lg bg-cobalt-deep/50">
                  <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
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
              <b className="block truncate text-[13px] font-medium text-white">{title}</b>
              <span className="block truncate text-xs text-cobalt-faint">{detail}</span>
            </span>
            {variant === "bar" && (
              <span
                className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-medium ${
                  working ? "bg-white/15 text-white" : "bg-tangerine text-white"
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
