import Link from "next/link";
import { FadeIn } from "@/components/reveal";
import { GarmentIcon } from "@/components/garment-icon";

const features = [
  {
    title: "Know what you own",
    body: "Photograph a piece of clothing and AI drafts the details for you. You check and correct them, so your wardrobe is always accurate.",
  },
  {
    title: "Outfits for real Singapore weather",
    body: "Describe the occasion and get outfits built from your own clothes, checked against the live NEA forecast for heat, humidity and rain.",
  },
  {
    title: "Check before you buy",
    body: "Upload a product screenshot and see what you already own that is similar, what it would go with, and whether it fills a real gap.",
  },
  {
    title: "Learns from your feedback",
    body: "Tell it when an outfit was too warm or too formal. Future suggestions quietly get better.",
  },
];

const steps = [
  "Add a few pieces from your wardrobe",
  "Describe an occasion and get outfit picks",
  "Check a purchase before you spend",
];

const previewTiles = [
  { kind: "shirt", bg: "#EEF1FB", fg: "#2549E8" },
  { kind: "top", bg: "#FFE6D9", fg: "#FF6B2C" },
  { kind: "bottom", bg: "#DCE4FF", fg: "#1733AE" },
  { kind: "footwear", bg: "#E6F6EC", fg: "#1B7A48" },
  { kind: "outerwear", bg: "#D7E0FA", fg: "#2549E8" },
];

const previewNav = ["Wardrobe", "Add item", "Outfit planner", "Should I buy it?", "Profile"];

export default function LandingPage() {
  return (
    <main className="flex-1">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-white/90 px-5 py-3.5 backdrop-blur sm:px-10">
        <span className="text-xl font-semibold tracking-tight">Drape</span>
        <Link
          href="/login"
          className="rounded-lg bg-cobalt px-4 py-2.5 text-sm font-medium text-white"
        >
          Sign in
        </Link>
      </header>

      <section className="overflow-hidden bg-cobalt px-5 pt-14 text-center text-white sm:px-10 sm:pt-20">
        <FadeIn>
          <h1 className="mx-auto max-w-[16ch] text-4xl font-semibold leading-[1.02] tracking-tight sm:text-6xl">
            Wear what you own. Buy what you need.
          </h1>
        </FadeIn>
        <FadeIn delay={0.1}>
          <p className="mx-auto mt-5 max-w-[52ch] text-base leading-relaxed text-cobalt-light sm:text-lg">
            Drape is a private digital wardrobe that helps you get more out of
            the clothes you already have, before it ever suggests buying
            something new.
          </p>
        </FadeIn>
        <FadeIn delay={0.2}>
          <div className="mt-7 flex flex-wrap justify-center gap-2.5">
            <Link
              href="/login"
              className="rounded-lg bg-tangerine px-5 py-2.5 text-sm font-medium text-white"
            >
              Start your wardrobe
            </Link>
            <a
              href="#features"
              className="rounded-lg border border-white/45 px-5 py-2.5 text-sm font-medium text-white"
            >
              See how it works
            </a>
          </div>
        </FadeIn>

        {/* The application itself, bleeding out of the hero */}
        <FadeIn delay={0.3} className="mx-auto mt-8 max-w-4xl sm:mt-12">
          <div className="grid h-48 grid-cols-1 overflow-hidden rounded-t-xl border border-b-0 border-white/35 bg-white text-left text-ink sm:h-72 sm:grid-cols-[180px_1fr]">
            <div className="hidden bg-cobalt-deep px-0 py-4 text-xs text-cobalt-faint sm:block">
              <b className="block px-4 pb-3.5 text-sm text-white">Drape</b>
              {previewNav.map((item, index) => (
                <span
                  key={item}
                  className={
                    index === 0
                      ? "mx-2 block rounded-md bg-white/15 px-2 py-2 text-white"
                      : "block px-4 py-2"
                  }
                >
                  {item}
                </span>
              ))}
            </div>
            <div className="p-4 sm:p-5">
              <h2 className="mb-3 text-base font-semibold">Your wardrobe</h2>
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
                {previewTiles.map((tile, index) => (
                  <div
                    key={tile.kind}
                    className={`grid aspect-square place-items-center rounded-lg ${index >= 3 ? "hidden sm:grid" : ""}`}
                    style={{ background: tile.bg, color: tile.fg }}
                  >
                    <GarmentIcon kind={tile.kind} className="w-[44%]" />
                  </div>
                ))}
              </div>
              <p className="mt-3 rounded-lg bg-wash px-3 py-2 text-xs text-mute">
                <b className="font-semibold text-ink">Lunch outdoors, midday.</b>{" "}
                Linen over cotton stays breathable at 31°C. Canvas dries faster
                if the 3pm showers arrive.
              </p>
            </div>
          </div>
        </FadeIn>
      </section>

      <section id="features" className="mx-auto max-w-5xl px-5 py-12 sm:px-10 sm:py-16">
        <h2 className="mb-6 text-2xl font-semibold tracking-tight sm:text-3xl">
          Built around your wardrobe, not a shop
        </h2>
        <div className="grid overflow-hidden rounded-xl border border-line sm:grid-cols-2">
          {features.map((feature, index) => (
            <FadeIn
              key={feature.title}
              delay={index * 0.06}
              className={`border-line p-5 transition-colors hover:bg-wash sm:p-7 ${
                index < features.length - 1 ? "border-b" : ""
              } ${index < 2 ? "sm:border-b" : "sm:border-b-0"} ${
                index % 2 === 0 ? "sm:border-r" : ""
              }`}
            >
              <h3 className="text-base font-semibold sm:text-lg">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-mute">{feature.body}</p>
            </FadeIn>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-12 sm:px-10 sm:py-16">
        <h2 className="mb-6 text-2xl font-semibold tracking-tight sm:text-3xl">How it works</h2>
        <ol className="max-w-xl border-l-[3px] border-cobalt">
          {steps.map((step, index) => (
            <FadeIn key={step} delay={index * 0.06}>
              <li
                className={`px-5 py-4 text-base ${index < steps.length - 1 ? "border-b border-line" : ""}`}
              >
                {step}
              </li>
            </FadeIn>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-12 sm:px-10 sm:py-16">
        <h2 className="mb-6 text-2xl font-semibold tracking-tight sm:text-3xl">Pricing</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <FadeIn>
            <div className="h-full rounded-xl border-2 border-cobalt p-6 sm:p-7">
              <h3 className="text-lg font-semibold">Free</h3>
              <p className="mt-1 text-4xl font-semibold tracking-tight">$0</p>
              <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-mute">
                <li>Unlimited wardrobe items</li>
                <li>Outfit recommendations with Singapore weather</li>
                <li>Purchase evaluation</li>
              </ul>
            </div>
          </FadeIn>
          <FadeIn delay={0.06}>
            <div className="h-full rounded-xl border border-line bg-wash p-6 sm:p-7">
              <h3 className="text-lg font-semibold text-mute">Pro (planned)</h3>
              <p className="mt-1 text-4xl font-semibold tracking-tight text-mute">TBD</p>
              <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-mute">
                <li>Batch uploads and wardrobe insights</li>
                <li>Outfit history and favourites</li>
                <li>Priority AI analysis</li>
              </ul>
              <p className="mt-4 text-xs leading-relaxed text-mute">
                Placeholder for the monetization strategy. AI image analysis has
                a real per-call cost, so heavy features would sit here.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      <footer className="border-t border-line px-5 py-9 text-center text-xs text-mute sm:px-10">
        Drape keeps your wardrobe photos private. AI suggestions can be wrong,
        and you always make the final call.
      </footer>
    </main>
  );
}
