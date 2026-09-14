"use client";

import { useActionState } from "react";
import { saveProfile, type ProfileFormState } from "@/lib/actions/profile";

type Profile = {
  display_name: string | null;
  preferred_styles: string[];
  preferred_colours: string[];
  disliked_colours: string[];
  common_occasions: string[];
  preference_notes: string | null;
  sizes: { top?: string; bottom?: string; shoes?: string } | null;
};

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
    <label className="block text-sm">
      {label}
      <input
        name={name}
        defaultValue={defaultValue}
        className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
      />
      {hint && <span className="mt-1 block text-xs text-stone-400">{hint}</span>}
    </label>
  );
}

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState<ProfileFormState, FormData>(
    saveProfile,
    {},
  );

  return (
    <form action={action} className="space-y-4">
      <Field
        label="Display name"
        name="display_name"
        defaultValue={profile.display_name ?? ""}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
        <Field
          label="Top size"
          name="size_top"
          defaultValue={profile.sizes?.top ?? ""}
        />
        <Field
          label="Bottom size"
          name="size_bottom"
          defaultValue={profile.sizes?.bottom ?? ""}
        />
        <Field
          label="Shoe size"
          name="size_shoes"
          defaultValue={profile.sizes?.shoes ?? ""}
        />
      </div>
      <label className="block text-sm">
        Anything else we should know
        <textarea
          name="preference_notes"
          rows={3}
          defaultValue={profile.preference_notes ?? ""}
          placeholder="e.g. prefer covered shoulders, runs warm easily"
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
        />
      </label>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.saved && (
        <p className="text-sm text-emerald-700">Preferences saved.</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Saving..." : "Save preferences"}
      </button>
    </form>
  );
}
