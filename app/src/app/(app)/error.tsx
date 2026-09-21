"use client";

import Link from "next/link";
export default function AppError({ retry }: { retry: () => void }) {
  return (
    <section className="m-5 rounded-2xl border border-line bg-white p-8 md:m-9" role="alert">
      <h1 className="text-2xl font-semibold">This page could not load</h1>
      <p className="mt-3 max-w-prose text-mute">Please try again. If the problem continues, return to your wardrobe and open the page again.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button onClick={retry} className="rounded-lg bg-cobalt px-5 py-3 text-sm font-semibold text-white">Try again</button>
        <Link href="/wardrobe" className="rounded-lg border border-line px-5 py-3 text-sm">Your wardrobe</Link>
      </div>
    </section>
  );
}
