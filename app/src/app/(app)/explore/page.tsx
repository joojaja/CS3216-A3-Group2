import type { Metadata } from "next";
import { ExploreFeed } from "@/components/explore-feed";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Explore" };

export default function ExplorePage() {
  return (
    <>
      <PageHeader
        title="Explore"
        description="Find pieces that add something useful to your wardrobe."
      />
      <div className="px-5 py-5 pb-24 md:px-9 md:py-6">
        <ExploreFeed />
      </div>
    </>
  );
}
