import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { WardrobeGrid } from "@/components/wardrobe-grid";
import { StatsStrip } from "@/components/stats-strip";
import { PageHeader } from "@/components/page-header";
import { SetupNotice } from "@/components/setup-notice";
import type { WardrobeItem } from "@/lib/types";

export const metadata: Metadata = { title: "Wardrobe" };
export const dynamic = "force-dynamic";

// Placeholder items shown only when Supabase is not configured, so the
// frontend can be browsed without a backend.
const demoItems: WardrobeItem[] = [
  {
    id: "demo-1",
    user_id: "dev",
    image_path: "",
    category: "top",
    subcategory: "linen shirt",
    primary_colour: "off-white",
    secondary_colours: [],
    pattern: "solid",
    material_cues: "lightweight weave",
    formality: "smart_casual",
    layering_role: "standalone",
    weather_tags: ["hot_humid", "air_conditioned"],
    user_notes: null,
    attributes_confirmed: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-2",
    user_id: "dev",
    image_path: "",
    category: "top",
    subcategory: "cotton tee",
    primary_colour: "apricot",
    secondary_colours: [],
    pattern: "solid",
    material_cues: null,
    formality: "casual",
    layering_role: "base",
    weather_tags: ["hot_humid"],
    user_notes: null,
    attributes_confirmed: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-3",
    user_id: "dev",
    image_path: "",
    category: "bottom",
    subcategory: "chinos",
    primary_colour: "navy",
    secondary_colours: [],
    pattern: "solid",
    material_cues: null,
    formality: "smart_casual",
    layering_role: "standalone",
    weather_tags: ["all_weather"],
    user_notes: null,
    attributes_confirmed: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-4",
    user_id: "dev",
    image_path: "",
    category: "footwear",
    subcategory: "canvas shoes",
    primary_colour: "sage",
    secondary_colours: [],
    pattern: "solid",
    material_cues: null,
    formality: "casual",
    layering_role: "standalone",
    weather_tags: ["rain", "all_weather"],
    user_notes: null,
    attributes_confirmed: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-5",
    user_id: "dev",
    image_path: "",
    category: "outerwear",
    subcategory: "denim jacket",
    primary_colour: "indigo",
    secondary_colours: [],
    pattern: "solid",
    material_cues: "heavy",
    formality: "casual",
    layering_role: "outer",
    weather_tags: ["air_conditioned", "cool_evening"],
    user_notes: null,
    attributes_confirmed: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-6",
    user_id: "dev",
    image_path: "",
    category: "top",
    subcategory: "poplin shirt",
    primary_colour: "butter",
    secondary_colours: [],
    pattern: "solid",
    material_cues: null,
    formality: "business",
    layering_role: "standalone",
    weather_tags: ["air_conditioned"],
    user_notes: null,
    attributes_confirmed: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-7",
    user_id: "dev",
    image_path: "",
    category: "top",
    subcategory: "knit top",
    primary_colour: "rose",
    secondary_colours: [],
    pattern: "solid",
    material_cues: null,
    formality: "casual",
    layering_role: "standalone",
    weather_tags: ["hot_humid"],
    user_notes: null,
    attributes_confirmed: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-8",
    user_id: "dev",
    image_path: "",
    category: "bottom",
    subcategory: "wide trousers",
    primary_colour: "grey",
    secondary_colours: [],
    pattern: "solid",
    material_cues: null,
    formality: "smart_casual",
    layering_role: "standalone",
    weather_tags: ["hot_humid", "all_weather"],
    user_notes: null,
    attributes_confirmed: true,
    created_at: new Date().toISOString(),
  },
];

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
