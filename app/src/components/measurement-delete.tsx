"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteMeasurements } from "@/lib/actions/measurements";
import { useToast } from "@/components/toast";

// Two-step delete, so a stray tap cannot wipe the profile
export function MeasurementDelete() {
  const router = useRouter();
  const { toast } = useToast();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function remove() {
    setError(null);
    startTransition(async () => {
      const result = await deleteMeasurements();
      if (result.error) {
        setError(result.error);
        return;
      }
      setConfirming(false);
      toast("Measurements deleted");
      router.refresh();
    });
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="min-h-10 text-sm font-medium text-bad underline-offset-2 hover:underline"
      >
        Delete my measurements
      </button>
    );
  }

  return (
    <div role="group" aria-label="Confirm delete" className="grid gap-2 text-sm">
      <p className="text-body">This removes every measurement you saved. You cannot undo it.</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          className="min-h-10 rounded-lg bg-bad px-3.5 font-medium text-white disabled:opacity-50"
        >
          {pending ? "Deleting..." : "Delete"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="min-h-10 rounded-lg border border-line px-3.5 font-medium text-ink"
        >
          Keep them
        </button>
      </div>
      {error && <p role="alert" className="text-bad">{error}</p>}
    </div>
  );
}
