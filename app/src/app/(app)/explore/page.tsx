import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Explore" };

export default function ExplorePage() {
  return (
    <>
      <PageHeader
        title="Explore"
        description="Discover more ways to wear what you already own."
      />
      <div className="px-5 py-5 pb-24 md:px-9 md:py-6">
        <section className="rounded-xl border border-line bg-card p-5 md:p-6">
          <p className="text-sm font-medium">Explore is coming soon</p>
          <p className="mt-1 text-sm text-mute">
            This space will hold wardrobe ideas and inspiration.
          </p>

          <div
            aria-hidden="true"
            className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {[0, 1, 2].map((item) => (
              <div key={item} className="overflow-hidden rounded-xl border border-line bg-wash/60">
                <div className="shim aspect-[4/3] w-full" />
                <div className="grid gap-2.5 p-4">
                  <div className="shim h-4 w-2/3" />
                  <div className="shim h-3 w-full" />
                  <div className="shim h-3 w-4/5" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
