"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { trackFunnel } from "@/lib/analytics";

type FeedItem = {
  id: string;
  retailer: string;
  name: string;
  productUrl: string;
  imageUrl: string;
  price: string;
  category: string;
  colour: string;
  fitLine: "men" | "women";
  reason: string;
};

type FeedResponse =
  | { status: "locked"; item_count: number; needed: number }
  | { status: "ready"; cached: boolean; items: FeedItem[] };

export function ExploreFeed() {
  const [result, setResult] = useState<FeedResponse | null>(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<FeedItem | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/explore", { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "Could not load your feed.");
        setResult(body as FeedResponse);
        if (body.status === "ready") trackFunnel("explore_feed_loaded");
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setError(reason instanceof Error ? reason.message : "Could not load your feed.");
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!selected) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selected]);

  if (error) {
    return (
      <section className="rounded-xl border border-bad-line bg-bad-light p-5" role="alert">
        <h2 className="text-lg font-medium text-ink">Your feed could not load</h2>
        <p className="mt-1 text-sm text-body">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 rounded-lg bg-tangerine px-4 py-2 text-sm font-semibold text-ink transition hover:bg-tangerine-light"
        >
          Try again
        </button>
      </section>
    );
  }

  if (!result) return <FeedSkeleton />;

  if (result.status === "locked") {
    const noun = result.needed === 1 ? "item" : "items";
    return (
      <section className="rounded-xl border border-line bg-card px-5 py-10 text-center md:px-8 md:py-14">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-cobalt-light text-cobalt" aria-hidden="true">
          <WardrobeIcon />
        </span>
        <h2 className="mt-4 text-xl font-medium">Add {result.needed} more {noun} first</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-mute">
          Your feed unlocks at five confirmed wardrobe items, so its suggestions can respond to what you own.
        </p>
        <p className="mt-2 text-xs text-mute">{result.item_count} of 5 items added</p>
        <Link
          href="/wardrobe/new"
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-tangerine px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-tangerine-light"
        >
          Add an item
        </Link>
      </section>
    );
  }

  return (
    <>
      <div className="mb-5 flex items-center justify-between gap-4">
        <p className="text-sm text-mute">10 ideas chosen to complement your wardrobe.</p>
        {result.cached && (
          <span className="shrink-0 rounded-full bg-wash px-3 py-1 text-xs text-mute">Saved feed</span>
        )}
      </div>

      <section aria-label="Personalised clothing recommendations" className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
        {result.items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSelected(item)}
            className="group mb-4 block w-full break-inside-avoid overflow-hidden rounded-xl border border-line bg-card text-left shadow-sm transition hover:-translate-y-0.5 hover:border-cobalt hover:shadow-md"
            aria-label={`View ${item.name} at ${item.retailer}`}
          >
            <div className={`relative w-full overflow-hidden bg-wash ${index % 3 === 1 ? "aspect-[4/5]" : "aspect-[3/4]"}`}>
              <Image
                src={item.imageUrl}
                alt={item.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover transition duration-300 group-hover:scale-[1.02]"
              />
              <span className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium capitalize text-ink shadow-sm backdrop-blur">
                {item.fitLine} fit
              </span>
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-mute">{item.retailer}</p>
                  <h2 className="mt-1 text-base leading-5 font-medium text-ink">{item.name}</h2>
                </div>
                <span className="shrink-0 text-sm font-semibold text-ink">{item.price}</span>
              </div>
              <p className="mt-3 text-sm leading-5 text-body">{item.reason}</p>
              <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-cobalt">
                View product <ExternalIcon />
              </p>
            </div>
          </button>
        ))}
      </section>

      {selected && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-ink/55 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelected(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="purchase-dialog-title"
            className="w-full max-w-md rounded-xl border border-line bg-[#fcfbf7] p-5 shadow-2xl md:p-6"
          >
            <h2 id="purchase-dialog-title" className="text-xl font-medium">Open {selected.retailer}?</h2>
            <p className="mt-2 text-sm leading-6 text-body">
              You will leave Wearabouts to view {selected.name}. Check the current price, size and availability before buying.
            </p>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                autoFocus
                onClick={() => setSelected(null)}
                className="rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-ink transition hover:border-cobalt"
              >
                Stay here
              </button>
              <a
                href={selected.productUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  trackFunnel("explore_product_opened");
                  setSelected(null);
                }}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-tangerine px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-tangerine-light"
              >
                Visit product <ExternalIcon />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function FeedSkeleton() {
  return (
    <section aria-label="Preparing your personalised feed" aria-busy="true">
      <p className="mb-5 text-sm text-mute">Reading your wardrobe and preparing your feed...</p>
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="mb-4 break-inside-avoid overflow-hidden rounded-xl border border-line bg-card">
            <div className={`shim w-full ${index % 3 === 1 ? "aspect-[4/5]" : "aspect-[3/4]"}`} />
            <div className="grid gap-2.5 p-4">
              <div className="shim h-3 w-1/3" />
              <div className="shim h-5 w-4/5" />
              <div className="shim h-3 w-full" />
              <div className="shim h-3 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function WardrobeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-6">
      <path d="M8 7a4 4 0 1 1 7.7 1.5L20 12v2H4v-2l8-5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 14h14l-1 6H6l-1-6Z" strokeLinejoin="round" />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" className="size-3.5" aria-hidden="true">
      <path d="M7 5h8v8M15 5l-9 9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
