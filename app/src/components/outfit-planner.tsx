"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { GarmentIcon, tintFor } from "@/components/garment-icon";
import { useToast } from "@/components/toast";
import {
  FEEDBACK_REASONS,
  usePlanner,
  type FeedbackAction,
  type Reason,
  type Recommendation,
  type RecommendedItem,
  type Turn,
} from "@/components/planner-context";

const EXAMPLES = [
  "Casual outdoor birthday lunch tomorrow afternoon",
  "Smart casual dinner in town, indoors",
  "Campus day with lectures, likely rain",
];

// A thread of occasion requests and the outfits built for each. Every reply
// is structured: items from the wardrobe, the reasoning and feedback controls.
// The thread and any running request live in PlannerProvider, so they survive
// switching tabs.
export function OutfitPlanner() {
  const { turns, latest, seen, markSeen, send } = usePlanner();
  const bottom = useRef<HTMLDivElement>(null);

  // Being on this page is what counts as having seen the reply, which
  // dismisses the status card shown on the other tabs
  useEffect(() => {
    if (!seen && latest && latest.status !== "loading") markSeen();
  }, [seen, latest, markSeen]);

  // Keep the newest exchange in view as replies arrive
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [turns.length, latest?.status]);

  // Follow-ups such as "Show another" belong to the most recent outfits, even
  // when a later message was declined or failed
  const lastAnswered = [...turns].reverse().find((turn) => turn.status === "done")?.id;

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-[880px] flex-1 px-5 py-5 md:px-9 md:py-6">
        {turns.length === 0 ? (
          <Intro onPick={(text) => void send(text)} />
        ) : (
          <div className="grid gap-7">
            {turns.map((turn, index) => (
              <TurnView
                key={turn.id}
                turn={turn}
                isLatest={index === turns.length - 1}
                canFollowUp={turn.id === lastAnswered}
              />
            ))}
          </div>
        )}
        <div ref={bottom} />
      </div>
      <Composer />
    </div>
  );
}

function Intro({ onPick }: { onPick: (text: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-[560px] py-10 text-center md:py-16"
    >
      <span className="block text-[11px] font-semibold tracking-[0.15em] uppercase text-mute">
        Start a plan
      </span>
      <h2 className="mt-3 font-serif text-[30px] leading-[1.08] tracking-[-0.04em] md:text-[36px]">
        What is the occasion?
      </h2>
      <p className="mt-3 text-[14.5px] leading-relaxed text-mute">
        Describe where you are going and when. You get up to three outfits from your own
        wardrobe, each with its reasoning. Then adjust them in a follow-up: more formal, not
        the sneakers, show another option.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => onPick(example)}
            className="min-h-[42px] rounded-full border border-line bg-card px-4 py-2 text-[13px] transition hover:border-cobalt hover:bg-soft"
          >
            {example}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

function TurnView({
  turn,
  isLatest,
  canFollowUp,
}: {
  turn: Turn;
  isLatest: boolean;
  canFollowUp: boolean;
}) {
  const { retry, send } = usePlanner();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.2, 0.8, 0.3, 1] }}
      className="grid gap-4"
    >
      <p className="ml-auto max-w-[min(85%,560px)] rounded-2xl rounded-br-md bg-cobalt px-4 py-2.5 text-[14.5px] leading-relaxed whitespace-pre-wrap text-white">
        {turn.message}
      </p>

      {turn.status === "loading" && (
        <div className="grid gap-3.5">
          <p className="flex items-center gap-3 text-sm text-mute">
            <span className="size-[18px] animate-spin rounded-full border-[2.5px] border-line border-t-cobalt" />
            Building outfits from your confirmed items.
          </p>
          <div className="grid max-w-[560px] gap-3.5 rounded-xl border border-line p-5">
            <div className="shim h-3.5 w-1/3" />
            <div className="flex gap-3">
              <div className="shim aspect-[3/4] w-full max-w-[120px]" />
              <div className="shim aspect-[3/4] w-full max-w-[120px]" />
              <div className="shim aspect-[3/4] w-full max-w-[120px]" />
            </div>
            <div className="shim h-10" />
          </div>
        </div>
      )}

      {turn.status === "error" && (
        <div className="grid max-w-[560px] gap-2.5 rounded-2xl rounded-bl-md bg-bad-light px-4 py-3 text-[14px] text-bad">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex-1">{turn.error}</span>
            {isLatest && (
              <button
                type="button"
                onClick={() => void retry()}
                className="rounded-lg border border-bad-line bg-white px-3 py-1.5 text-[13px] font-medium"
              >
                Try again
              </button>
            )}
          </div>
          {/* Only present when the server runs in development */}
          {turn.errorDetail && (
            <pre className="overflow-x-auto rounded-lg border border-bad-line bg-white/70 px-3 py-2 text-[12px] leading-relaxed whitespace-pre-wrap break-words text-bad/90">
              <b className="font-semibold">Development only.</b> {turn.errorDetail}
            </pre>
          )}
        </div>
      )}

      {turn.status === "declined" && (
        <p className="max-w-[560px] rounded-2xl rounded-bl-md bg-wash px-4 py-2.5 text-[14.5px] leading-relaxed text-body">
          {turn.declineMessage}
        </p>
      )}

      {turn.status === "done" && (
        <div className="grid gap-3.5">
          <div className={`grid gap-3.5 ${turn.recs.length > 1 ? "xl:grid-cols-2" : "max-w-[640px]"}`}>
            {turn.recs.map((rec, index) => (
              <OutfitCard
                key={rec.id ?? `${turn.id}-${index}`}
                rec={rec}
                index={index}
                items={turn.items}
                onAnother={canFollowUp ? () => void send("Show another option") : null}
              />
            ))}
          </div>
          {turn.weather && (
            <p className="text-xs text-mute">Singapore forecast used: {turn.weather}</p>
          )}
        </div>
      )}
    </motion.div>
  );
}

function OutfitCard({
  rec,
  index,
  items,
  onAnother,
}: {
  rec: Recommendation;
  index: number;
  items: Record<string, RecommendedItem>;
  onAnother: (() => void) | null;
}) {
  const { toast } = useToast();
  const { sentFeedback, sendFeedback, busy } = usePlanner();
  const [reasonsOpen, setReasonsOpen] = useState(false);
  const [reasons, setReasons] = useState<Set<Reason>>(new Set());
  const feedback = rec.id ? sentFeedback[rec.id] : null;

  async function give(action: FeedbackAction, picked?: Reason[]) {
    if (!rec.id) return;
    const ok = await sendFeedback(rec.id, action, picked);
    if (ok) {
      setReasonsOpen(false);
      setReasons(new Set());
      toast(action === "wore" ? "Marked as worn" : "Feedback recorded");
    } else {
      toast("Could not save feedback");
    }
  }

  function toggleReason(value: Reason) {
    setReasons((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4, ease: [0.2, 0.8, 0.3, 1] }}
      className="grid gap-3.5 rounded-xl border border-line bg-card p-5 shadow-[0_12px_32px_#24282308]"
    >
      <h3 className="text-[10px] font-semibold tracking-[0.13em] uppercase text-mute">
        Outfit {index + 1}
      </h3>

      <div className="flex gap-3 pb-5">
        {rec.item_ids.map((id, i) => {
          const item = items[id];
          const tint = tintFor(item?.primary_colour);
          const label = item
            ? [item.primary_colour, item.subcategory ?? item.category].filter(Boolean).join(" ")
            : "Unknown item";
          return (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.1 }}
              whileHover={{ y: -3 }}
              className="relative grid aspect-[3/4] w-full max-w-[120px] place-items-center rounded-[10px]"
              style={{ background: tint.bg, color: tint.fg }}
            >
              {item?.signed_image_url ? (
                // Supabase signed URLs expire and come from the configured project,
                // so use the browser image element instead of a fixed Next.js host rule.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.signed_image_url}
                  alt={label}
                  className="size-full rounded-[10px] bg-white object-contain"
                />
              ) : (
                <GarmentIcon kind={item?.category ?? "top"} className="w-[52%]" />
              )}
              <span className="absolute inset-x-0 -bottom-5 text-center text-xs text-mute capitalize">
                {label}
              </span>
            </motion.div>
          );
        })}
      </div>

      <div className="rounded-xl bg-wash px-4 py-3.5 text-[14.5px] leading-relaxed text-body">
        <b className="mb-1 block text-[10px] font-semibold tracking-[0.13em] uppercase text-ink">
          Why this
        </b>
        {rec.explanation}
      </div>

      {rec.warnings.map((warning) => (
        <p key={warning} className="rounded-lg bg-warn-light px-3 py-2 text-[13.5px] text-warn">
          {warning}
        </p>
      ))}

      {rec.id && (
        <div className="grid gap-3 border-t border-line pt-3.5">
          {feedback ? (
            <p className="text-sm text-ok">
              {feedback === "wore"
                ? "Marked as worn. Future picks will lean this way."
                : feedback === "liked"
                  ? "Noted that you like it."
                  : "Feedback recorded. Future picks will avoid this."}
            </p>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => give("wore")}
                className="rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-ink transition hover:bg-accent-deep"
              >
                Wear this
              </button>
              {onAnother && (
                <button
                  type="button"
                  onClick={onAnother}
                  disabled={busy}
                  className="rounded-lg border border-line px-5 py-3 text-sm font-medium transition hover:bg-soft disabled:opacity-40"
                >
                  Show another
                </button>
              )}
              <div className="ml-auto flex gap-1.5">
                <button
                  type="button"
                  aria-label="I like this outfit"
                  onClick={() => give("liked")}
                  className="grid size-[44px] place-items-center rounded-full border border-line transition hover:border-cobalt"
                >
                  <ThumbIcon />
                </button>
                <button
                  type="button"
                  aria-label="This outfit does not work"
                  aria-expanded={reasonsOpen}
                  onClick={() => {
                    setReasonsOpen((open) => !open);
                    setReasons(new Set());
                  }}
                  className={`grid size-[44px] place-items-center rounded-full border transition ${
                    reasonsOpen ? "border-ink bg-ink text-white" : "border-line hover:border-cobalt"
                  }`}
                >
                  <ThumbIcon down />
                </button>
              </div>
            </div>
          )}

          {/* Second tier of feedback after a thumbs-down, inline in the card */}
          <AnimatePresence initial={false}>
            {reasonsOpen && !feedback && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: [0.2, 0.8, 0.3, 1] }}
                className="overflow-hidden"
              >
                <div className="grid gap-3 rounded-xl bg-wash p-3.5">
                  <b className="text-[13.5px] font-semibold">
                    What did not work? Select all that apply.
                  </b>
                  <div className="flex flex-wrap gap-1.5">
                    {FEEDBACK_REASONS.map((reason) => {
                      const on = reasons.has(reason.value);
                      return (
                        <button
                          key={reason.value}
                          type="button"
                          aria-pressed={on}
                          onClick={() => toggleReason(reason.value)}
                          className={`rounded-full border px-3 py-1.5 text-[13px] transition ${
                            on
                              ? "border-cobalt bg-cobalt text-white"
                              : "border-line bg-white hover:border-cobalt"
                          }`}
                        >
                          {reason.label}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-mute">Your feedback shapes future suggestions.</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setReasonsOpen(false)}
                        className="rounded-lg border border-line bg-white px-3.5 py-2 text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={reasons.size === 0}
                        onClick={() => give("rejected", [...reasons])}
                        className="rounded-lg bg-accent px-3.5 py-2 text-sm font-semibold text-ink disabled:opacity-40"
                      >
                        Send feedback
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.article>
  );
}

function Composer() {
  const { draft, setDraft, send, stop, clear, busy, turns } = usePlanner();
  const box = useRef<HTMLTextAreaElement>(null);
  const canSend = draft.trim().length >= 2 && !busy;

  // Grow with the text up to a few lines, then scroll
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [draft]);

  function submit() {
    if (!canSend) return;
    void send();
    box.current?.focus();
  }

  return (
    <div className="sticky bottom-0 mt-auto border-t border-line bg-paper/95 px-5 pt-3 pb-3 backdrop-blur md:px-9">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="mx-auto flex max-w-[880px] items-end gap-2 rounded-2xl border border-line bg-white p-1.5 pl-4 transition focus-within:border-cobalt focus-within:ring-[3px] focus-within:ring-cobalt-light"
      >
        <textarea
          ref={box}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          aria-label="Describe the occasion"
          placeholder={
            turns.length
              ? "Adjust the outfits or describe a new occasion"
              : "Describe the occasion, for example a casual outdoor lunch tomorrow"
          }
          className="max-h-40 min-h-0 flex-1 resize-none bg-transparent py-2 text-[14.5px] leading-relaxed focus:outline-none"
        />
        {busy ? (
          <button
            type="button"
            onClick={stop}
            aria-label="Stop"
            className="grid size-9 shrink-0 place-items-center rounded-xl bg-ink text-white transition hover:bg-ink/85"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="size-3.5">
              <rect x="5" y="5" width="14" height="14" rx="2" />
            </svg>
          </button>
        ) : (
          <button
            type="submit"
            aria-label="Send"
            disabled={!canSend}
            className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent text-ink transition hover:bg-accent-deep disabled:opacity-40"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="size-[18px]">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>
        )}
      </form>
      <div className="mx-auto mt-2 flex max-w-[880px] items-center justify-between gap-3 text-xs text-mute">
        <span>Outfits come only from your confirmed items and the current Singapore forecast.</span>
        {turns.length > 0 && (
          <button type="button" onClick={clear} className="shrink-0 font-medium hover:text-ink">
            Start over
          </button>
        )}
      </div>
    </div>
  );
}

function ThumbIcon({ down = false }: { down?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      className={`size-[17px] ${down ? "rotate-180" : ""}`}
    >
      <path d="M7 11v9H4v-9zM7 11l4-8c1.5 0 2.5 1 2.5 2.5V10h5a2 2 0 012 2.3l-1 6.4a2 2 0 01-2 1.7H7" />
    </svg>
  );
}
