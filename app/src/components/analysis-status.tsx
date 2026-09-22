"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useUploadQueue } from "@/components/multi-item-uploader";

// Shows the state of the add-item flow while the user is on another tab:
// a photo being analysed, or a finished analysis waiting to be reviewed.
// Hidden on the add-item page itself, where the full form is visible.
export function AnalysisStatus({ variant }: { variant: "rail" | "bar" }) {
  const pathname = usePathname();
  const { jobs, snapshots } = useUploadQueue();
  const active = jobs
    .map((id) => snapshots[id])
    .filter(
      (snapshot) =>
        snapshot?.hasFile &&
        (snapshot.working ||
          snapshot.status === "Ready to review" ||
          snapshot.status === "Needs attention"),
    );
  const workingItems = active.filter((snapshot) => snapshot.working);
  const focus = workingItems[0] ?? active[0];
  const working = workingItems.length > 0;
  const show =
    pathname !== "/wardrobe/new" &&
    focus !== undefined;

  const title = working
    ? workingItems.length === 1
      ? focus?.status ?? "Preparing clothing"
      : `Preparing ${workingItems.length} items`
    : active.length === 1
      ? focus?.status ?? "Item ready"
      : `${active.length} items ready`;
  const detail = working
    ? "You can keep browsing"
    : variant === "rail"
      ? "Open to review"
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
              {focus?.preview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={focus.preview} alt="" className="size-full object-cover" />
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
