"use client";

import { useActionState, useEffect, useRef } from "react";
import { saveProfile, type ProfileFormState } from "@/lib/actions/profile";
import { useToast } from "@/components/toast";

type Profile = {
  display_name: string | null;
  preferred_styles: string[];
  preferred_colours: string[];
  disliked_colours: string[];
  common_occasions: string[];
  preference_notes: string | null;
  sizes: { top?: string; bottom?: string; shoes?: string } | null;
};

const inputClass =
  "mt-1.5 block w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm font-normal transition focus:border-cobalt focus:outline-none focus:ring-[3px] focus:ring-cobalt-light";

function Field({
  label,
  name,
  defaultValue,
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  hint?: string;
}) {
  return (
    <label className="block text-[13.5px] font-medium">
      {label}
      <input name={name} defaultValue={defaultValue} className={inputClass} />
      {hint && <span className="mt-1 block text-xs font-normal text-mute">{hint}</span>}
    </label>
  );
}

export function ProfileForm({ profile }: { profile: Profile }) {
  const { toast } = useToast();
  const [state, action, pending] = useActionState<ProfileFormState, FormData>(saveProfile, {});
  const lastSaved = useRef<ProfileFormState | null>(null);

  // Server actions return a fresh state object per submission, so a new
  // reference with saved=true means a save just completed
  useEffect(() => {
    if (state.saved && state !== lastSaved.current) {
      lastSaved.current = state;
      toast("Preferences saved");
    }
  }, [state, toast]);

  return (
    <form action={action} className="grid gap-3.5">
      <Field label="Display name" name="display_name" defaultValue={profile.display_name ?? ""} />
      <div className="grid gap-3.5 sm:grid-cols-2">
        <Field
          label="Preferred styles"
          name="preferred_styles"
          defaultValue={profile.preferred_styles.join(", ")}
          hint="Comma separated, e.g. minimalist, streetwear"
        />
        <Field
          label="Common occasions"
          name="common_occasions"
          defaultValue={profile.common_occasions.join(", ")}
          hint="e.g. lectures, office, dates, gym"
        />
        <Field
          label="Preferred colours"
          name="preferred_colours"
          defaultValue={profile.preferred_colours.join(", ")}
        />
        <Field
          label="Disliked colours"
          name="disliked_colours"
          defaultValue={profile.disliked_colours.join(", ")}
        />
      </div>
      <div className="grid gap-3.5 sm:grid-cols-3">
        <Field label="Top size" name="size_top" defaultValue={profile.sizes?.top ?? ""} />
        <Field label="Bottom size" name="size_bottom" defaultValue={profile.sizes?.bottom ?? ""} />
        <Field label="Shoe size" name="size_shoes" defaultValue={profile.sizes?.shoes ?? ""} />
      </div>
      <label className="block text-[13.5px] font-medium">
        Anything else we should know
        <textarea
          name="preference_notes"
          rows={3}
          defaultValue={profile.preference_notes ?? ""}
          placeholder="e.g. prefer covered shoulders, runs warm easily"
          className={inputClass}
        />
      </label>

      {state.error && <p className="text-sm text-bad">{state.error}</p>}

      <div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-ink transition hover:bg-accent-deep disabled:opacity-50"
        >
          {pending ? "Saving..." : "Save preferences"}
        </button>
      </div>
    </form>
  );
}
