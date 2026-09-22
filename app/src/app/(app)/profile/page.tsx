import Link from "next/link";
import { signOut } from "@/lib/actions/auth";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/profile-form";
import { PageHeader } from "@/components/page-header";
import { SetupNotice } from "@/components/setup-notice";
import { isMissingGenderColumn } from "@/lib/profile-gender";
import {
  FREE_BEAUTIFY_CREDITS,
  readAccountEntitlement,
  type AccountTier,
} from "@/lib/account-entitlements";

export const metadata: Metadata = { title: "Profile" };
export const dynamic = "force-dynamic";

const emptyProfile = {
  display_name: "",
  gender: null,
  preferred_styles: [] as string[],
  preferred_colours: [] as string[],
  disliked_colours: [] as string[],
  common_occasions: [] as string[],
  preference_notes: "",
  sizes: null,
};

function ProfileSidebar({
  accountTier,
  beautifyCreditsRemaining,
}: {
  accountTier: AccountTier;
  beautifyCreditsRemaining: number;
}) {
  return (
  <div className="grid gap-4">
    <aside className="rounded-xl border border-cobalt/25 bg-cobalt-light/45 px-4.5 py-4 text-sm">
      <div className="flex items-center justify-between gap-3">
        <b className="font-semibold">
          {accountTier === "premium" ? "Premium Tier" : "Free Tier"}
        </b>
        {accountTier === "free" && (
          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-cobalt">
            {beautifyCreditsRemaining} Beautify edits left
          </span>
        )}
      </div>
      {accountTier === "free" && (
        <>
          <h2 className="mt-4 text-base font-semibold text-ink">Unlock Premium</h2>
          <ul className="mt-2 grid list-disc gap-1.5 pl-5 leading-relaxed text-body">
            <li>More Beautify edits</li>
            <li>Refresh your Explore recommendations</li>
            <li>Uninterrupted outfit planning</li>
          </ul>
          <button
            type="button"
            disabled
            className="mt-4 w-full cursor-not-allowed rounded-lg bg-line px-4 py-2.5 font-semibold text-mute"
          >
            Planned feature
          </button>
        </>
      )}
    </aside>
    <aside className="rounded-xl border border-line px-4.5 py-4 text-sm">
      <b className="block font-semibold">Body measurements</b>
      <p className="mt-1.5 leading-relaxed text-mute">
        Add your measurements once to get size suggestions for the brands you shop.
      </p>
      <Link
        href="/profile/measurements"
        className="mt-3 inline-block rounded-lg border border-line px-3.5 py-2 font-medium text-cobalt transition hover:border-cobalt"
      >
        Add or edit measurements
      </Link>
    </aside>
    <aside className="rounded-xl border border-line px-4.5 py-4 text-sm">
      <b className="block font-semibold">Your data</b>
      <p className="mt-1.5 leading-relaxed text-mute">
        Wardrobe photos and preferences are private to your account. Deleting an
        item removes its stored photo. Full account deletion is on the roadmap.
      </p>
      <Link href="/privacy" className="mt-4 inline-block underline underline-offset-4">Privacy and analytics settings</Link>
      <form action={signOut} className="mt-5"><button className="rounded-lg border border-line px-4 py-2.5">Sign out</button></form>
    </aside>
  </div>
  );
}

export default async function ProfilePage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <>
        <PageHeader
          title="Profile and preferences"
          description="Connect Supabase to save preferences. The form below is a preview."
        />
        <div className="px-5 py-5 pb-24 md:px-9 md:py-6">
          <SetupNotice />
          <div className="mt-5 grid gap-6 md:grid-cols-[1fr_300px] md:items-start">
            <ProfileForm profile={emptyProfile} />
            <ProfileSidebar
              accountTier="free"
              beautifyCreditsRemaining={FREE_BEAUTIFY_CREDITS}
            />
          </div>
        </div>
      </>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: entitlementRow } = await supabase
    .from("account_entitlements")
    .select("account_tier, beautify_credits_remaining")
    .eq("user_id", user?.id)
    .maybeSingle();
  const entitlement = readAccountEntitlement(entitlementRow);

  const profileWithGender = await supabase
    .from("user_profiles")
    .select(
      "display_name, gender, preferred_styles, preferred_colours, disliked_colours, common_occasions, preference_notes, sizes",
    )
    .eq("user_id", user?.id)
    .maybeSingle();
  let profile = profileWithGender.data;
  if (isMissingGenderColumn(profileWithGender.error)) {
    const fallback = await supabase
      .from("user_profiles")
      .select(
        "display_name, preferred_styles, preferred_colours, disliked_colours, common_occasions, preference_notes, sizes",
      )
      .eq("user_id", user?.id)
      .maybeSingle();
    profile = fallback.data ? { ...fallback.data, gender: null } : null;
  }

  return (
    <>
      <PageHeader
        title="Profile and preferences"
        description={`Signed in as ${user?.email}. These preferences shape your outfit recommendations and you can change them any time.`}
      />
      <div className="px-5 py-5 pb-24 md:px-9 md:py-6">
        <div className="grid gap-6 md:grid-cols-[1fr_300px] md:items-start">
          <ProfileForm profile={profile ?? emptyProfile} />
          <ProfileSidebar
            accountTier={entitlement.accountTier}
            beautifyCreditsRemaining={entitlement.beautifyCreditsRemaining}
          />
        </div>
      </div>
    </>
  );
}
