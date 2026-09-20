import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/profile-form";
import { PageHeader } from "@/components/page-header";
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

const dataBox = (
  <aside className="rounded-xl border border-line bg-card px-5 py-4.5 text-sm shadow-[0_12px_32px_#24282308]">
    <b className="block text-[11px] font-semibold tracking-[0.15em] uppercase text-mute">Your data</b>
    <p className="mt-2.5 leading-relaxed text-body">
      Wardrobe photos and preferences are private to your account. Deleting an
      item removes its stored photo. Full account deletion is on the roadmap.
    </p>
  </aside>
);

export default async function ProfilePage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <>
        <PageHeader
          eyebrow="Profile"
          title="Profile and preferences"
          description="Connect Supabase to save preferences. The form below is a preview."
        />
        <div className="px-5 py-5 pb-24 md:px-9 md:py-6">
          <SetupNotice />
          <div className="mt-5 grid gap-6 md:grid-cols-[1fr_300px] md:items-start">
            <ProfileForm profile={emptyProfile} />
            {dataBox}
          </div>
        </div>
      </>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("user_profiles")
    .select(
      "display_name, preferred_styles, preferred_colours, disliked_colours, common_occasions, preference_notes, sizes",
    )
    .eq("user_id", user?.id)
    .maybeSingle();

  return (
    <>
      <PageHeader
        eyebrow="Profile"
        title="Profile and preferences"
        description={`Signed in as ${user?.email}. These preferences shape your outfit recommendations and you can change them any time.`}
      />
      <div className="px-5 py-5 pb-24 md:px-9 md:py-6">
        <div className="grid gap-6 md:grid-cols-[1fr_300px] md:items-start">
          <ProfileForm profile={profile ?? emptyProfile} />
          {dataBox}
        </div>
      </div>
    </>
  );
}
