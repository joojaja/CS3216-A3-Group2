"use server";

import { saveProfile, type ProfileFormState } from "@/lib/actions/profile";
import { createClient } from "@/lib/supabase/server";

export async function saveOnboarding(
  form: FormData,
): Promise<ProfileFormState> {
  const result = await saveProfile({}, form);
  if (!result.saved) return result;
  const supabase = await createClient();
  if (!supabase) return { error: "We could not connect. Please try again." };
  // A presentation-only resume marker. Never used for authorization or ownership.
  const { error } = await supabase.auth.updateUser({
    data: { drape_preferences_saved: true },
  });
  if (error)
    return {
      error:
        "Your preferences were saved, but we could not continue. Please try again.",
    };
  return { saved: true };
}
