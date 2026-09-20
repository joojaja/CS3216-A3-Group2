"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useAnalysis } from "@/components/analysis-context";

// Shows the state of the add-item flow while the user is on another tab:
// a photo being analysed, or a finished analysis waiting to be reviewed.
// Hidden on the add-item page itself, where the full form is visible.
export function AnalysisStatus({ variant }: { variant: "rail" | "bar" }) {
  const pathname = usePathname();
  const { step, file, preview, bg, crop, enhance } = useAnalysis();

  const editing = enhance.isolate.status === "running" || enhance.iron.status === "running";
  const removing = (bg.status === "running" || crop.status === "running" || editing) && step === "pick";
  const analyzing = step === "analyzing";
  const show =
    pathname !== "/wardrobe/new" &&
    file !== null &&
    (removing || analyzing || step === "review");

  // Both removal and analysis show a spinner; only the wording differs
  const working = removing || analyzing;
  const title = removing
    ? "Preparing your photo"
    : analyzing
      ? "Analysing your photo"
      : "Photo analysed";
  // The rail is narrow, so the second line doubles as the call to action
  // there and the separate button is only shown on the wider mobile bar
  const detail = removing
    ? editing
      ? "Editing with the image model"
      : crop.status === "running"
        ? "Cropping to the garment"
        : "Removing the background"
    : analyzing
      ? "You can keep browsing"
      : variant === "rail"
        ? "Open to review it"
        : "Waiting for your review";
  const action = working ? "View" : "Review";

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
          <Link href="/wardrobe/new" className="flex items-center gap-3">
            <span className="relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-soft">
              {preview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="" className="size-full object-cover" />
              )}
              {working && (
                <span className="absolute inset-0 grid place-items-center bg-paper/70">
                  <span className="size-4 animate-spin rounded-full border-2 border-line border-t-ink" />
                </span>
              )}
              {!working && (
                <span className="absolute -right-0.5 -bottom-0.5 grid size-4 place-items-center rounded-full bg-ok">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" className="size-2.5">
                    <path d="M5 12l5 5L20 7" />
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
