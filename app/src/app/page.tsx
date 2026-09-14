import Link from "next/link";
import { FadeIn } from "@/components/reveal";

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

export default function LandingPage() {
  return (
    <main className="flex-1">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
        <span className="text-sm font-semibold tracking-wide">APP_NAME</span>
        <Link
          href="/login"
          className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white"
        >
          Sign in
        </Link>
      </header>

      <section className="mx-auto max-w-3xl px-4 pb-16 pt-16 text-center sm:pt-24">
        <FadeIn>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Wear what you own. Buy what you need.
          </h1>
        </FadeIn>
        <FadeIn delay={0.1}>
          <p className="mx-auto mt-5 max-w-xl text-lg text-stone-600">
            APP_NAME is a private digital wardrobe that helps you get more out
            of the clothes you already have, before it ever suggests buying
            something new.
          </p>
        </FadeIn>
        <FadeIn delay={0.2}>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              href="/login"
              className="rounded-lg bg-stone-900 px-5 py-2.5 text-sm font-medium text-white"
            >
              Start your wardrobe
            </Link>
            <a
              href="#features"
              className="rounded-lg border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-700"
            >
              See how it works
            </a>
          </div>
        </FadeIn>
      </section>

      <section id="features" className="mx-auto max-w-5xl px-4 py-12">
        <h2 className="text-center text-2xl font-semibold tracking-tight">
          Built around your wardrobe, not a shop
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {features.map((feature, index) => (
            <FadeIn key={feature.title} delay={index * 0.06}>
              <div className="h-full rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
                <h3 className="font-medium">{feature.title}</h3>
                <p className="mt-2 text-sm text-stone-600">{feature.body}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12 text-center">
        <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
        <ol className="mx-auto mt-6 max-w-md space-y-3 text-left">
          {steps.map((step, index) => (
            <FadeIn key={step} delay={index * 0.06}>
              <li className="flex items-start gap-3 rounded-xl border border-stone-200 bg-white p-4 text-sm shadow-sm">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-900 text-xs font-medium text-white">
                  {index + 1}
                </span>
                {step}
              </li>
            </FadeIn>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12">
        <h2 className="text-center text-2xl font-semibold tracking-tight">
          Pricing
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <FadeIn>
            <div className="h-full rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
              <h3 className="font-medium">Free</h3>
              <p className="mt-1 text-3xl font-semibold">$0</p>
              <ul className="mt-4 space-y-2 text-sm text-stone-600">
                <li>Unlimited wardrobe items</li>
                <li>Outfit recommendations with Singapore weather</li>
                <li>Purchase evaluation</li>
              </ul>
            </div>
          </FadeIn>
          <FadeIn delay={0.06}>
            <div className="h-full rounded-xl border border-stone-200 bg-stone-50 p-6">
              <h3 className="font-medium text-stone-500">Pro (planned)</h3>
              <p className="mt-1 text-3xl font-semibold text-stone-400">TBD</p>
              <ul className="mt-4 space-y-2 text-sm text-stone-500">
                <li>Batch uploads and wardrobe insights</li>
                <li>Outfit history and favourites</li>
                <li>Priority AI analysis</li>
              </ul>
              <p className="mt-4 text-xs text-stone-400">
                Placeholder for the monetization strategy. AI image analysis
                has a real per-call cost, so heavy features would sit here.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      <footer className="mx-auto max-w-5xl px-4 py-10 text-center text-xs text-stone-400">
        <p>
          APP_NAME keeps your wardrobe photos private. AI suggestions can be
          wrong, and you always make the final call.
        </p>
      </footer>
    </main>
  );
}
