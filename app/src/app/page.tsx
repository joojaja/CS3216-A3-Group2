import Link from "next/link";
import { siteUrl, siteDescription } from "@/lib/site";
import Image from "next/image";
import "./landing.css";
import LandingStory from "@/components/landing-story";

const features = [
  [
    "Your wardrobe, remembered",
    "Add a piece, review the suggested details, and keep the version you confirm.",
  ],
  [
    "Weather-aware outfits",
    "Plan for Singapore heat, humidity and rain with recommendations built from your own clothes.",
  ],
  [
    "A reason with every outfit",
    "See the occasion, weather and colour signals that shaped each suggestion.",
  ],
  [
    "Check before you buy",
    "Compare a prospective piece with what you own before it becomes another forgotten purchase.",
  ],
];

export default function LandingPage() {
  return (
    <main className="drape-public">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org", "@type": "WebSite", name: "Wearabouts",
        url: siteUrl, description: siteDescription, inLanguage: "en-SG",
      }).replace(/</g, "\\u003c") }} />
      <a className="drape-skip" href="#main-content">
        Skip to content
      </a>
      <header className="drape-header">
        <nav className="drape-nav" aria-label="Primary navigation">
          <Link
            className="drape-wordmark"
            href="/"
            aria-label="Wearabouts home"
          >
            <svg
              className="drape-logo-mark"
              viewBox="0 0 40 40"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M4 12 12 31 20 20 28 31 36 12M12 15l8-6c4-4-2-9-5-5"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>
              <b>wear</b>abouts
            </span>
          </Link>
          <div className="drape-links">
            <a href="#story">How it works</a>
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
          </div>
          <div className="drape-nav-actions">
            <Link href="/login">Sign in</Link>
            <Link
              className="drape-button drape-button-small"
              href="/login?mode=signup&next=/onboarding"
            >
              Start your wardrobe <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <details className="drape-mobile-menu">
            <summary aria-label="Open navigation">Menu</summary>
            <div>
              <a href="#story">How it works</a>
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
              <Link href="/login">Sign in</Link>
              <Link href="/login?mode=signup&next=/onboarding">
                Start your wardrobe
              </Link>
            </div>
          </details>
        </nav>
      </header>
      <div id="main-content">
        <section className="drape-hero" aria-labelledby="hero-title">
          <div className="drape-container">
            <h1 id="hero-title">
              Know what to wear, <em>wherever.</em>
            </h1>
            <figure>
              <Image
                src="/landing/narrative-1.webp"
                alt="A person considering clothes in a warm walk-in wardrobe"
                width={1125}
                height={868}
                priority
                sizes="(max-width: 640px) calc(100vw - 44px), min(1240px, calc(100vw - 72px))"
              />
              <figcaption>Your wardrobe, wherever life takes you.</figcaption>
            </figure>
          </div>
        </section>
        <section className="drape-bridge" aria-label="Wearabouts proposition">
          <div className="drape-container">
            <span className="drape-eyebrow">Wearabouts</span>
            <h2>
              Turn the clothes you already own into outfits for today, any
              occasion and smarter decisions about what to buy next.
            </h2>
          </div>
        </section>
        <LandingStory />
        <section id="after-story" className="drape-section drape-problem">
          <div className="drape-container drape-narrow">
            <span className="drape-eyebrow">Less wardrobe friction</span>
            <h2>
              Your clothes are already doing enough.
              <br />
              Your memory shouldn&apos;t have to.
            </h2>
            <div className="drape-questions">
              <p>What works for dinner tonight?</p>
              <p>What suits the weather outside?</p>
              <p>Is this new piece actually useful?</p>
            </div>
            <p className="drape-muted">
              Wearabouts gives the wardrobe you already own a clear next move.
            </p>
          </div>
        </section>
        <section id="features" className="drape-section drape-feature-section">
          <div className="drape-container">
            <div className="drape-feature-heading">
              <span className="drape-eyebrow">
                Designed around your wardrobe
              </span>
              <h2>Every suggestion earns its place.</h2>
              <p>
                Wearabouts combines your plans, your confirmed wardrobe and
                Singapore weather, then shows the signals behind the result.
              </p>
            </div>
            <div className="drape-feature-grid">
              {features.map(([title, body], index) => (
                <article key={title}>
                  <span className="drape-feature-number">0{index + 1}</span>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section className="drape-section drape-explain">
          <div className="drape-container drape-explain-grid">
            <div>
              <span className="drape-eyebrow">Why this outfit works</span>
              <h2>A clear answer, with the reasoning beside it.</h2>
              <p>
                Recommendations stay understandable. You can see what the
                occasion asks for, what the forecast changes and which pieces
                are doing the work.
              </p>
              <Link
                className="drape-text-link"
                href="/login?mode=signup&next=/onboarding"
              >
                Build your wardrobe <span aria-hidden="true">↗</span>
              </Link>
            </div>
            <div className="drape-reason-card">
              <Image
                src="/landing/narrative-5.webp"
                alt="A selected outfit ready to wear"
                width={1122}
                height={1402}
                sizes="(max-width: 640px) calc(100vw - 44px), 50vw"
              />
              <div className="drape-reason-copy">
                <span className="drape-card-label">Example recommendation</span>
                <strong>Dinner-ready, breathable for the walk</strong>
                <div className="drape-reasons">
                  <span>Occasion · smart casual</span>
                  <span>Weather · warm evening</span>
                  <span>Movement · walkable</span>
                </div>
                <small>
                  Example signals shown for illustration. Wearabouts uses your
                  confirmed items and current forecast.
                </small>
              </div>
            </div>
          </div>
        </section>
        <section className="drape-section drape-purchase">
          <div className="drape-container drape-purchase-grid">
            <div>
              <span className="drape-eyebrow">The next decision</span>
              <h2>Buy for the wardrobe you have.</h2>
              <p>
                Before something new becomes another forgotten purchase, compare
                it with the pieces you already own.
              </p>
              <Link
                className="drape-button"
                href="/login?mode=signup&next=/onboarding"
              >
                Check a piece <span aria-hidden="true">↗</span>
              </Link>
            </div>
            <div className="drape-purchase-card">
              <span className="drape-card-label">
                Illustrative purchase check
              </span>
              <strong>A lightweight overshirt</strong>
              <div className="drape-purchase-row">
                <span>Similar owned items</span>
                <b>Review together</b>
              </div>
              <div className="drape-purchase-row">
                <span>Possible pairings</span>
                <b>Shown from your wardrobe</b>
              </div>
              <div className="drape-purchase-row">
                <span>Decision</span>
                <b>Yours to make</b>
              </div>
              <small>
                This example explains the evidence Wearabouts would show. It is
                not a live verdict.
              </small>
            </div>
          </div>
        </section>
        <section id="pricing" className="drape-section drape-pricing">
          <div className="drape-container">
            <div className="drape-pricing-heading">
              <span className="drape-eyebrow">Simple to start</span>
              <h2>Useful before it asks for more.</h2>
              <p>
                Begin with the complete wardrobe-first loop. A paid plan is
                planned for heavier AI use after the beta.
              </p>
            </div>
            <div className="drape-price-grid">
              <article className="drape-price-card drape-price-primary">
                <span className="drape-eyebrow">Beta</span>
                <h3>Free</h3>
                <p className="drape-price">S$0</p>
                <p>
                  Everything needed to build a private wardrobe and try the core
                  experience.
                </p>
                <ul>
                  <li>Wardrobe uploads with editable AI suggestions</li>
                  <li>Singapore-weather outfit planning</li>
                  <li>Purchase checks against your wardrobe</li>
                  <li>Feedback that shapes later recommendations</li>
                </ul>
                <Link
                  className="drape-button"
                  href="/login?mode=signup&next=/onboarding"
                >
                  Join the beta <span aria-hidden="true">↗</span>
                </Link>
              </article>
              <article className="drape-price-card drape-price-planned">
                <span className="drape-eyebrow">Planned</span>
                <h3>Wearabouts Plus</h3>
                <p className="drape-price">
                  S$8.90<span>/month</span>
                </p>
                <p>
                  For users who want more frequent analysis and deeper wardrobe
                  history.
                </p>
                <ul>
                  <li>Higher AI analysis limits</li>
                  <li>Deeper preference history</li>
                  <li>Saved outfits and wardrobe insights</li>
                </ul>
                <span className="drape-planned-note">
                  Planned, not available for purchase yet.
                </span>
              </article>
            </div>
          </div>
        </section>
        <section id="join" className="drape-join">
          <div className="drape-container drape-narrow">
            <span className="drape-eyebrow">Private by default</span>
            <h2>Make more of what you already own.</h2>
            <p>
              Your wardrobe photos and preferences belong to you. AI suggestions
              can be wrong, so you stay in control of every confirmed item and
              final decision.
            </p>
            <Link
              className="drape-button"
              href="/login?mode=signup&next=/onboarding"
            >
              Start your wardrobe <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </section>
      </div>
      <footer className="drape-footer">
        <div className="drape-container">
          <Link className="drape-wordmark" href="/">
            <svg
              className="drape-logo-mark"
              viewBox="0 0 40 40"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M4 12 12 31 20 20 28 31 36 12M12 15l8-6c4-4-2-9-5-5"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>
              <b>wear</b>abouts
            </span>
          </Link>
          <Link href="/privacy">Privacy and data</Link>
          <small>Made with Singapore in mind.</small>
        </div>
      </footer>
    </main>
  );
}
