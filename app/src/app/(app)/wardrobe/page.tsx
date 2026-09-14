import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { WardrobeGrid } from "@/components/wardrobe-grid";
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
    primary_colour: "white",
    secondary_colours: [],
    pattern: "solid",
    material_cues: "lightweight weave",
    formality: "smart_casual",
    layering_role: "standalone",
    weather_tags: ["hot_humid"],
    user_notes: null,
    attributes_confirmed: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-2",
    user_id: "dev",
    image_path: "",
    category: "bottom",
    subcategory: "chinos",
    primary_colour: "khaki",
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
    id: "demo-3",
    user_id: "dev",
    image_path: "",
    category: "footwear",
    subcategory: "sneakers",
    primary_colour: "white",
    secondary_colours: ["grey"],
    pattern: "solid",
    material_cues: null,
    formality: "casual",
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
    category: "outerwear",
    subcategory: "denim jacket",
    primary_colour: "blue",
    secondary_colours: [],
    pattern: "solid",
    material_cues: "heavy",
    formality: "casual",
    layering_role: "outer",
    weather_tags: ["air_conditioned"],
    user_notes: null,
    attributes_confirmed: true,
    created_at: new Date().toISOString(),
  },
];

export default async function WardrobePage() {
  const supabase = await createClient();
  if (!supabase) {
    return (
      <div>
        <SetupNotice />
        <p className="mt-4 text-sm text-stone-500">
          Demo items below are placeholders until the backend is connected.
        </p>
        <div className="mt-4">
          <WardrobeGrid items={demoItems} />
        </div>
      </div>
    );
  }

  const { data: items } = await supabase
    .from("wardrobe_items")
    .select("*")
    .order("created_at", { ascending: false });

  const paths = (items ?? []).map((item) => item.image_path);
  const { data: signed } = paths.length
    ? await supabase.storage
        .from("wardrobe-images")
        .createSignedUrls(paths, 3600)
    : { data: [] };

  const urlByPath = new Map(
    (signed ?? []).map((entry) => [entry.path, entry.signedUrl]),
  );

  const itemsWithUrls: WardrobeItem[] = (items ?? []).map((item) => ({
    ...item,
    signed_image_url: urlByPath.get(item.image_path),
  }));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Your wardrobe</h1>
        <Link
          href="/wardrobe/new"
          className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white"
        >
          Add item
        </Link>
      </div>

      {itemsWithUrls.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-stone-300 bg-white p-10 text-center">
          <p className="font-medium">Your wardrobe is empty</p>
          <p className="mt-1 text-sm text-stone-500">
            Photograph a few pieces of clothing to get started. AI will draft
            the details and you confirm them.
          </p>
          <Link
            href="/wardrobe/new"
            className="mt-4 inline-block rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white"
          >
            Add your first item
          </Link>
        </div>
      ) : (
        <div className="mt-6">
          <WardrobeGrid items={itemsWithUrls} />
        </div>
      )}
    </div>
  );
}
