import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/profile-form";
import { SetupNotice } from "@/components/setup-notice";

export const metadata: Metadata = { title: "Profile" };
export const dynamic = "force-dynamic";

const emptyProfile = {
  display_name: "",
  preferred_styles: [] as string[],
  preferred_colours: [] as string[],
  disliked_colours: [] as string[],
  common_occasions: [] as string[],
  preference_notes: "",
  sizes: null,
};

export default async function ProfilePage() {
  const supabase = await createClient();
  if (!supabase) return <SetupNotice />;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("user_profiles")
    .select(
      "display_name, preferred_styles, preferred_colours, disliked_colours, common_occasions, preference_notes, sizes",
    )
    .eq("user_id", user?.id)
    .single();

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold tracking-tight">
        Profile and preferences
      </h1>
      <p className="mt-1 text-sm text-stone-500">
        Signed in as {user?.email}. These preferences shape your outfit
        recommendations and you can change them any time.
      </p>
      <div className="mt-6">
        <ProfileForm profile={profile ?? emptyProfile} />
      </div>
      <div className="mt-10 rounded-xl border border-stone-200 bg-white p-5 text-sm">
        <p className="font-medium">Your data</p>
        <p className="mt-1 text-stone-500">
          Wardrobe photos and preferences are private to your account. Deleting
          an item removes its stored photo. Full account deletion is on the
          roadmap.
        </p>
      </div>
    </div>
  );
}
