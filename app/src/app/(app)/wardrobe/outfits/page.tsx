import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadSavedOutfits } from "@/lib/outfits/server";
import type { SavedOutfitView } from "@/lib/outfits/types";
import { PageHeader } from "@/components/page-header";
import { SetupNotice } from "@/components/setup-notice";
import { SavedOutfits } from "@/components/saved-outfits";
import { WardrobeTabs } from "@/components/wardrobe-tabs";

export const metadata: Metadata = { title: "Saved outfits" };
export const dynamic = "force-dynamic";

export default async function SavedOutfitsPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <>
        <PageHeader title="Saved outfits" description="Outfits you kept from your daily picks and the planner." />
        <div className="px-5 py-5 md:px-9 md:py-6">
          <SetupNotice />
          <div className="mt-5">
            <WardrobeTabs active="outfits" savedCount={null} />
            <SavedOutfits outfits={[]} />
          </div>
        </div>
      </>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let outfits: SavedOutfitView[] | null = null;
  try {
    outfits = await loadSavedOutfits(supabase, user.id);
  } catch (error) {
    // Most likely the saved_outfits migration has not been run yet
    console.error("[saved-outfits:page]", error instanceof Error ? error.message : "unknown");
  }

  return (
    <>
      <PageHeader
        title="Saved outfits"
        description={
          outfits && outfits.length > 0
            ? `${outfits.length} ${outfits.length === 1 ? "outfit" : "outfits"} made from your own clothes`
            : "Outfits you kept from your daily picks and the planner."
        }
      />
      <div className="px-5 py-5 pb-24 md:px-9 md:py-6">
        <WardrobeTabs active="outfits" savedCount={outfits?.length ?? null} />
        {outfits ? (
          <SavedOutfits outfits={outfits} />
        ) : (
          <div role="alert" className="rounded-xl border border-bad-line bg-bad-light px-4 py-3 text-sm text-bad">
            Saved outfits could not load right now. Try again in a moment.
          </div>
        )}
      </div>
    </>
  );
}
