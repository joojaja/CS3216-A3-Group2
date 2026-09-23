import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { WardrobeGrid } from "@/components/wardrobe-grid";
import { StatsStrip } from "@/components/stats-strip";
import { PageHeader } from "@/components/page-header";
import { SetupNotice } from "@/components/setup-notice";
import { WardrobeTabs } from "@/components/wardrobe-tabs";
import { DailyStrip } from "@/components/daily-strip";
import { CutoutBackfill, type BackfillItem } from "@/components/cutout-backfill";
import type { WardrobeItem } from "@/lib/types";
import { demoItems } from "@/lib/demo-items";

export const metadata: Metadata = { title: "Wardrobe" };
export const dynamic = "force-dynamic";


const addButton = (
  <Link
    href="/wardrobe/new"
    className="hidden rounded-lg bg-cobalt px-4 py-2.5 text-sm font-medium text-white transition hover:bg-cobalt-deep md:inline-block"
  >
    Add item
  </Link>
);

// Floating add button on mobile, where the header action is hidden
const fab = (
  <Link
    href="/wardrobe/new"
    aria-label="Add item"
    className="fixed right-4 bottom-[76px] z-20 grid size-[54px] place-items-center rounded-full bg-tangerine text-white shadow-[0_6px_18px_rgba(255,107,44,0.38)] md:hidden"
  >
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="size-6">
      <path d="M12 5v14M5 12h14" />
    </svg>
  </Link>
);

export default async function WardrobePage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <>
        <PageHeader
          title="Your wardrobe"
          description={`${demoItems.length} demo items. Connect Supabase to see your own.`}
          action={addButton}
        />
        <div className="px-5 py-5 md:px-9 md:py-6">
          <SetupNotice />
          <div className="mt-5">
            <DailyStrip />
            <WardrobeTabs active="items" savedCount={null} />
            <StatsStrip
              stats={[
                { value: demoItems.length, label: "items confirmed" },
                { value: 3, label: "outfits worn" },
                { value: 2, label: "purchases checked" },
              ]}
            />
            <WardrobeGrid items={demoItems} />
          </div>
        </div>
        {fab}
      </>
    );
  }

  const [{ data: items }, { count: worn }, { count: checked }, { count: savedCount }] = await Promise.all([
    supabase.from("wardrobe_items").select("*").order("created_at", { ascending: false }),
    supabase
      .from("recommendation_feedback")
      .select("id", { count: "exact", head: true })
      .eq("action", "wore"),
    supabase.from("purchase_evaluations").select("id", { count: "exact", head: true }),
    // Null until the saved_outfits migration has run, which hides the count
    supabase.from("saved_outfits").select("id", { count: "exact", head: true }),
  ]);

  const paths = (items ?? []).map((item) => item.image_path);
  const { data: signed } = paths.length
    ? await supabase.storage.from("wardrobe-images").createSignedUrls(paths, 3600)
    : { data: [] };

  const urlByPath = new Map((signed ?? []).map((entry) => [entry.path, entry.signedUrl]));

  const itemsWithUrls: WardrobeItem[] = (items ?? []).map((item) => ({
    ...item,
    signed_image_url: urlByPath.get(item.image_path),
  }));

  const count = itemsWithUrls.length;

  // Items still without a transparent cut-out for outfit cards. Only once
  // the item cut-outs migration has added the column
  const cutoutsReady = (items ?? []).some((item) => "cutout_path" in item);
  const backfill: BackfillItem[] = cutoutsReady
    ? itemsWithUrls.map((item) => ({
        id: item.id,
        needsCutout: !item.cutout_path && !item.ai_confidence?.cutout_failed,
      }))
    : [];

  return (
    <>
      <PageHeader
        title="Your wardrobe"
        description={
          count === 0
            ? "Nothing here yet"
            : `${count} ${count === 1 ? "item" : "items"}, all confirmed by you`
        }
        action={addButton}
      />
      <div className="px-5 py-5 pb-24 md:px-9 md:py-6">
        {count > 0 && <DailyStrip />}
        {backfill.some((item) => item.needsCutout) && <CutoutBackfill items={backfill} />}
        <WardrobeTabs active="items" savedCount={savedCount ?? null} />
        <StatsStrip
          stats={[
            { value: count, label: "items confirmed" },
            { value: worn ?? 0, label: "outfits worn" },
            { value: checked ?? 0, label: "purchases checked" },
          ]}
        />

        {count === 0 ? (
          <div className="rounded-xl border border-dashed border-line bg-wash/60 p-8 text-center md:p-12">
            <p className="font-medium">Your wardrobe is empty</p>
            <p className="mx-auto mt-1 max-w-[46ch] text-sm text-mute">
              Photograph a few pieces of clothing to get started. AI will draft
              the details and you confirm them.
            </p>
            <Link
              href="/wardrobe/new"
              className="mt-5 inline-block rounded-lg bg-cobalt px-4 py-2.5 text-sm font-medium text-white"
            >
              Add your first item
            </Link>
          </div>
        ) : (
          <WardrobeGrid items={itemsWithUrls} />
        )}
      </div>
      {fab}
    </>
  );
}
