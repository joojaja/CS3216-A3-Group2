"use client";

import { useState } from "react";
import { FEEDBACK_REASONS, type Reason } from "@/components/planner-context";

// The second tier of feedback after a thumbs-down or "Not for me": pick the
// reasons, then send. Shared by planner cards and the daily feed.
export function FeedbackReasons({
  onCancel,
  onSubmit,
}: {
  onCancel: () => void;
  onSubmit: (reasons: Reason[]) => void;
}) {
  const [reasons, setReasons] = useState<Set<Reason>>(new Set());

  function toggle(value: Reason) {
    setReasons((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  return (
    <div className="grid gap-3 rounded-xl bg-wash p-3.5">
      <b className="text-[13.5px] font-semibold">What did not work? Select all that apply.</b>
      <div className="flex flex-wrap gap-1.5">
        {FEEDBACK_REASONS.map((reason) => {
          const on = reasons.has(reason.value);
          return (
            <button
              key={reason.value}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(reason.value)}
              className={`rounded-full border px-3 py-1.5 text-[13px] transition ${
                on ? "border-cobalt bg-cobalt text-white" : "border-line bg-white hover:border-cobalt"
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
            onClick={onCancel}
            className="rounded-lg border border-line bg-white px-3.5 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={reasons.size === 0}
            onClick={() => onSubmit([...reasons])}
            className="rounded-lg bg-cobalt px-3.5 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            Send feedback
          </button>
        </div>
      </div>
    </div>
  );
}
