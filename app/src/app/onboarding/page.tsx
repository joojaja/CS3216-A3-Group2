import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { emptyOnboardingProfile } from "@/lib/onboarding";
import { OnboardingFlow } from "@/components/onboarding-flow";
import { isMissingGenderColumn } from "@/lib/profile-gender";
import "../landing.css";
import "./onboarding.css";

export const metadata: Metadata = {
  title: "Set up your wardrobe",
  robots: { index: false, follow: false },
  alternates: { canonical: null },
};

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const supabase = await createClient();
  let profile = emptyOnboardingProfile;
  let resumeUpload = false;
  let loadError = false;
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login?next=/onboarding");
    const [profileResult, itemsResult] = await Promise.all([
      supabase
        .from("user_profiles")
        .select(
          "display_name, gender, preferred_styles, preferred_colours, disliked_colours, common_occasions, preference_notes, sizes",
        )
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("wardrobe_items")
        .select("id")
        .eq("user_id", user.id)
        .eq("attributes_confirmed", true)
        .limit(1),
    ]);
    if (itemsResult.data?.length) redirect("/wardrobe");
    if (isMissingGenderColumn(profileResult.error)) {
      const fallback = await supabase
        .from("user_profiles")
        .select(
          "display_name, preferred_styles, preferred_colours, disliked_colours, common_occasions, preference_notes, sizes",
        )
        .eq("user_id", user.id)
        .maybeSingle();
      loadError = Boolean(fallback.error || itemsResult.error);
      profile = fallback.data
        ? { ...fallback.data, gender: null }
        : emptyOnboardingProfile;
    } else {
      loadError = Boolean(profileResult.error || itemsResult.error);
      profile = profileResult.data ?? emptyOnboardingProfile;
    }
    resumeUpload = user.user_metadata?.drape_preferences_saved === true;
  }
  return (
    <main className="drape-public onboarding-page">
      <header className="onboarding-header">
        <Link href="/" className="onboarding-wordmark" aria-label="Wearabouts home">
          <Image src="/landing/brand-mark.png" alt="" width={36} height={24} />
          <span><b>wear</b>abouts</span>
        </Link>
        <Link href="/wardrobe">Finish later</Link>
      </header>
      {loadError ? (
        <section className="onboarding-card">
          <h1>We couldn&apos;t load your wardrobe.</h1>
          <p>Your preferences have not changed. Please reload to try again.</p>
          <Link href="/onboarding" className="onboarding-primary">
            Try again
          </Link>
        </section>
      ) : (
        <OnboardingFlow
          profile={profile}
          resumeUpload={resumeUpload}
          configured={Boolean(supabase)}
        />
      )}
    </main>
  );
}
