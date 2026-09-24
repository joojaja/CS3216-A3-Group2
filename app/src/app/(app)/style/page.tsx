import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { SetupNotice } from "@/components/setup-notice";
import { StylePalette } from "@/components/style-palette";
import { StyleArchetypes, type StyleThumb } from "@/components/style-archetypes";
import { demoItems } from "@/lib/demo-items";
import { itemName } from "@/lib/outfits/daily-rules";
import { buildPalette } from "@/lib/style/palette";
import { ruleArchetypes, styleItems, type StyleGrouping } from "@/lib/style/archetypes";
import { colourFamily } from "@/lib/style/colour-families";
import { orderStyleItems } from "@/lib/style/archetype-prompt";
import { cachedGroupingFor, loadStyleData, readStyleCache, type StyleRow } from "@/lib/style/server";

export const metadata: Metadata = { title: "My Style" };
export const dynamic = "force-dynamic";

export default async function StylePage() {
  const supabase = await createClient();

  let items: StyleRow[];
  let preferredStyles: string[] = [];
  let cached: StyleGrouping | null = null;
  const urlByPath = new Map<string, string>();

  if (!supabase) {
    items = demoItems;
  } else {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const [data, cacheRow] = user
      ? await Promise.all([loadStyleData(supabase, user.id), readStyleCache(supabase, user.id)])
      : [null, null];
    if (!data) {
      return (
        <>
          <PageHeader title="My Style" />
          <p className="px-5 py-6 text-sm text-body md:px-9">
            Could not read your wardrobe right now. Refresh the page to try again.
          </p>
        </>
      );
    }
    items = data.items;
    preferredStyles = data.preferredStyles;

    // The same hash the API route computes, so a cached grouping for an
    // unchanged wardrobe shows straight away with no model call
    cached = cachedGroupingFor(cacheRow, orderStyleItems(styleItems(items)));

    const paths = items.map((item) => item.image_path).filter(Boolean);
    const { data: signed } = paths.length
      ? await supabase.storage.from("wardrobe-images").createSignedUrls(paths, 3600)
      : { data: [] };
    for (const entry of signed ?? []) {
      if (entry.path && entry.signedUrl) urlByPath.set(entry.path, entry.signedUrl);
    }
  }

  if (items.length === 0) {
    return (
      <>
        <PageHeader title="My Style" description="Your style and colour palette, worked out from your wardrobe." />
        <div className="px-5 py-6 md:px-9">
          <div className="max-w-xl rounded-2xl border border-line bg-[#fcfbf7] px-5 py-6">
            <h2 className="text-lg font-semibold">Nothing to read yet</h2>
            <p className="mt-1.5 text-[14px] text-body">
              My Style groups the items you have confirmed into styles and shows the colours you own most. Add your
              first item to see it.
            </p>
            <Link
              href="/wardrobe/new"
              className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-cobalt px-4 text-sm font-medium text-white hover:bg-cobalt-deep"
            >
              Add an item
            </Link>
          </div>
        </div>
      </>
    );
  }

  const thumbs: Record<string, StyleThumb> = Object.fromEntries(
    items.map((item) => [
      item.id,
      {
        id: item.id,
        name: itemName(item),
        imageUrl: urlByPath.get(item.image_path) ?? null,
        hex: colourFamily(item.primary_colour).hex,
      },
    ]),
  );

  const palette = buildPalette(items);
  const grouping: StyleGrouping = cached ?? { archetypes: ruleArchetypes(items), source: "rules" };
  // The AI grouping needs a signed-in user and the free-tier key. Without
  // either, the rule groups are the whole answer
  const aiAvailable = Boolean(supabase && process.env.GOOGLE_GENERATIVE_AI_FREE_API_KEY);

  return (
    <>
      <PageHeader title="My Style" />
      <div className="px-5 py-5 pb-24 md:px-9 md:py-8">
        {!supabase && (
          <div className="mb-6">
            <SetupNotice />
          </div>
        )}
        <div className="grid max-w-3xl gap-12">
          {grouping.archetypes.length > 0 ? (
            <StyleArchetypes
              initial={grouping}
              thumbs={thumbs}
              preferredStyles={preferredStyles}
              refine={aiAvailable && !cached}
              aiAvailable={aiAvailable}
            />
          ) : (
            <p className="text-[14px] text-body">
              Your confirmed items are all sleepwear, which My Style leaves out of style groups. Your colours are below.
            </p>
          )}
          <StylePalette palette={palette} thumbs={thumbs} />
        </div>
      </div>
    </>
  );
}
