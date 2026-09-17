import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { demoItems } from "@/lib/demo-items";
import type { WardrobeItem } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { ItemEditor } from "@/components/item-editor";

export const dynamic = "force-dynamic";

function titleOf(item: WardrobeItem) {
  return [item.primary_colour, item.subcategory ?? item.category].filter(Boolean).join(" ");
}

async function loadItem(id: string): Promise<{ item: WardrobeItem; live: boolean } | null> {
  const supabase = await createClient();

  if (!supabase) {
    const item = demoItems.find((d) => d.id === id);
    return item ? { item, live: false } : null;
  }

  // Row level security limits the query to the signed-in user's rows, so a
  // foreign id simply comes back empty
  const { data: item } = await supabase
    .from("wardrobe_items")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!item) return null;

  const { data: signed } = await supabase.storage
    .from("wardrobe-images")
    .createSignedUrl(item.image_path, 3600);

  return { item: { ...item, signed_image_url: signed?.signedUrl }, live: true };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const found = await loadItem(id);
  return { title: found ? titleOf(found.item) : "Item" };
}

export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const found = await loadItem(id);
  if (!found) notFound();

  const { item, live } = found;
  const added = new Date(item.created_at).toLocaleDateString("en-SG", {
    day: "numeric",
    month: "long",
  });

  return (
    <>
      <PageHeader
        title={titleOf(item)}
        description={
          live
            ? `Added ${added}. Every field below is yours to change.`
            : "Demo item. Connect Supabase to edit real items."
        }
        action={
          <Link
            href="/wardrobe"
            className="inline-block rounded-lg border border-line px-4 py-2.5 text-sm font-medium transition hover:bg-wash"
          >
            Back to wardrobe
          </Link>
        }
      />
      <div className="px-5 py-5 pb-24 md:px-9 md:py-6">
        <ItemEditor item={item} live={live} />
      </div>
    </>
  );
}
