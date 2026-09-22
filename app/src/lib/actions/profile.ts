"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { GENDER_VALUES, isMissingGenderColumn } from "@/lib/profile-gender";

const profileSchema = z.object({
  display_name: z.string().max(120),
  gender: z.enum(GENDER_VALUES).nullable(),
  preferred_styles: z.array(z.string()),
  preferred_colours: z.array(z.string()),
  disliked_colours: z.array(z.string()),
  common_occasions: z.array(z.string()),
  preference_notes: z.string().max(2000),
  sizes: z.object({
    top: z.string().max(20),
    bottom: z.string().max(20),
    shoes: z.string().max(20),
  }),
});

export type ProfileFormState = { error?: string; saved?: boolean };

export async function saveProfile(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const supabase = await createClient();
  if (!supabase) return { error: "Service is not configured" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const list = (name: string) =>
    String(formData.get(name) ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  const parsed = profileSchema.safeParse({
    display_name: String(formData.get("display_name") ?? ""),
    gender: String(formData.get("gender") ?? "") || null,
    preferred_styles: list("preferred_styles"),
    preferred_colours: list("preferred_colours"),
    disliked_colours: list("disliked_colours"),
    common_occasions: list("common_occasions"),
    preference_notes: String(formData.get("preference_notes") ?? ""),
    sizes: {
      top: String(formData.get("size_top") ?? ""),
      bottom: String(formData.get("size_bottom") ?? ""),
      shoes: String(formData.get("size_shoes") ?? ""),
    },
  });

  if (!parsed.success) return { error: "Invalid profile data" };

  // Upsert rather than update, so an account whose profile row is missing
  // (for example one created before a schema reset) still saves instead of
  // silently matching zero rows
  const { error } = await supabase
    .from("user_profiles")
    .upsert(
      { user_id: user.id, ...parsed.data, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );

  if (isMissingGenderColumn(error)) {
    const profileWithoutGender = {
      display_name: parsed.data.display_name,
      preferred_styles: parsed.data.preferred_styles,
      preferred_colours: parsed.data.preferred_colours,
      disliked_colours: parsed.data.disliked_colours,
      common_occasions: parsed.data.common_occasions,
      preference_notes: parsed.data.preference_notes,
      sizes: parsed.data.sizes,
    };
    const { error: retryError } = await supabase.from("user_profiles").upsert(
      {
        user_id: user.id,
        ...profileWithoutGender,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (retryError) return { error: "Could not save profile" };
    return {
      error:
        "Your other preferences were saved, but gender needs the Supabase profile update before it can be saved.",
    };
  }
  if (error) return { error: "Could not save profile" };

  revalidatePath("/profile");
  return { saved: true };
}
