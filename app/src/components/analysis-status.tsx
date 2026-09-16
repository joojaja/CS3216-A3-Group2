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
  const { step, file, preview } = useAnalysis();

  const show =
    pathname !== "/wardrobe/new" && file !== null && (step === "analyzing" || step === "review");

  const analyzing = step === "analyzing";
  const title = analyzing ? "Analysing your photo" : "Photo analysed";
  // The rail is narrow, so the second line doubles as the call to action
  // there and the separate button is only shown on the wider mobile bar
  const detail = analyzing
    ? "You can keep browsing"
    : variant === "rail"
      ? "Open to review it"
      : "Waiting for your review";
  const action = analyzing ? "View" : "Review";

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
          <Link href="/wardrobe/new" className="flex items-center gap-3">
            <span className="relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-white/15">
              {preview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="" className="size-full object-cover" />
              )}
              {analyzing && (
                <span className="absolute inset-0 grid place-items-center bg-cobalt-deep/50">
                  <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                </span>
              )}
              {!analyzing && (
                <span className="absolute -right-0.5 -bottom-0.5 grid size-4 place-items-center rounded-full bg-ok">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" className="size-2.5">
                    <path d="M5 12l5 5L20 7" />
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
                  analyzing ? "bg-white/15 text-white" : "bg-tangerine text-white"
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
