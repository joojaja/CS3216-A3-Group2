import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { WardrobeGrid } from "@/components/wardrobe-grid";
import { StatsStrip } from "@/components/stats-strip";
import { PageHeader } from "@/components/page-header";
import { SetupNotice } from "@/components/setup-notice";
import type { WardrobeItem } from "@/lib/types";
import { demoItems } from "@/lib/demo-items";

export const metadata: Metadata = { title: "Wardrobe" };
export const dynamic = "force-dynamic";


const addButton = (
  <Link
    href="/wardrobe/new"
    className="hidden rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:bg-accent-deep md:inline-block"
  >
    Add item
  </Link>
);

// Floating add button on mobile, where the header action is hidden
const fab = (
  <Link
    href="/wardrobe/new"
    aria-label="Add item"
    className="fixed right-4 bottom-[76px] z-20 grid size-[54px] place-items-center rounded-full bg-accent text-ink shadow-[0_6px_18px_rgba(183,102,80,0.35)] md:hidden"
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
          eyebrow="Wardrobe"
          title="Your wardrobe"
          description={`${demoItems.length} demo items. Connect Supabase to see your own.`}
          action={addButton}
        />
        <div className="px-5 py-5 md:px-9 md:py-6">
          <SetupNotice />
          <div className="mt-5">
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

  const [{ data: items }, { count: worn }, { count: checked }] = await Promise.all([
    supabase.from("wardrobe_items").select("*").order("created_at", { ascending: false }),
    supabase
      .from("recommendation_feedback")
      .select("id", { count: "exact", head: true })
      .eq("action", "wore"),
    supabase.from("purchase_evaluations").select("id", { count: "exact", head: true }),
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

  return (
    <>
      <PageHeader
        eyebrow="Wardrobe"
        title="Your wardrobe"
        description={
          count === 0
            ? "Nothing here yet"
            : `${count} ${count === 1 ? "item" : "items"}, all confirmed by you`
        }
        action={addButton}
      />
      <div className="px-5 py-5 pb-24 md:px-9 md:py-6">
        <StatsStrip
          stats={[
            { value: count, label: "items confirmed" },
            { value: worn ?? 0, label: "outfits worn" },
            { value: checked ?? 0, label: "purchases checked" },
          ]}
        />

        {count === 0 ? (
          <div className="rounded-2xl border border-line bg-card p-8 text-center shadow-[0_12px_32px_#24282308] md:p-12">
            <span className="block text-[11px] font-semibold tracking-[0.15em] uppercase text-mute">
              Start here
            </span>
            <p className="mt-3 font-serif text-[28px] leading-[1.1] tracking-[-0.03em] md:text-[34px]">
              Your wardrobe is empty.
            </p>
            <p className="mx-auto mt-3 max-w-[46ch] text-sm leading-relaxed text-mute">
              Photograph a few pieces of clothing to get started. AI will draft
              the details and you confirm them.
            </p>
            <Link
              href="/wardrobe/new"
              className="mt-6 inline-block rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-ink transition hover:bg-accent-deep"
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
