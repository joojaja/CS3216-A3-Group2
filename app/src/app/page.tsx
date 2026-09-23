import type { Metadata } from "next";
import Link from "next/link";
import { siteUrl, siteDescription } from "@/lib/site";
import Image from "next/image";
import "./landing.css";
import "./landing-cinematic.css";
import "./landing-refresh.css";
import LandingStory from "@/components/landing-story";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const featureRows = [
  {
    number: "01 · Build your wardrobe",
    title: "Your clothes, finally searchable.",
    body: "Add a piece, review the suggested details, and keep the version you confirm.",
    src: "/landing/feature-wardrobe.webp",
    alt: "Six realistic wardrobe product photos: an ivory shirt, olive trousers, black T-shirt, beige overshirt, white sneakers and blue Oxford shirt",
    shotLabel: "My wardrobe · 24 pieces",
    width: 1400,
    height: 933,
  },
  {
    number: "02 · Dress for the day",
    title: "Tell it where life is taking you.",
    body: "Plan around Singapore heat, humidity and rain with recommendations built from your own clothes.",
    src: "/landing/feature-weather.webp",
    alt: "A man in Singapore wearing an ivory overshirt, black T-shirt, olive trousers and white sneakers",
    shotLabel: "Outfit planner · Dinner tonight",
    width: 1400,
    height: 933,
  },
  {
    number: "03 · Explore your style",
    title: "Inspiration you can actually recreate.",
    body: "See curated looks matched to your confirmed wardrobe and personal style.",
    src: "/landing/feature-style.webp",
    alt: "Four curated Singapore smart-casual looks personalised to the same style profile",
    shotLabel: "Explore · Curated for you",
    width: 1400,
    height: 933,
  },
  {
    number: "04 · Check before buying",
    title: "Know whether a new piece earns its place.",
    body: "Compare a prospective piece with what you own before it becomes another forgotten purchase.",
    src: "/landing/feature-purchase.webp",
    alt: "Wearabouts purchase analysis for a light blue jersey, including redundancy and wardrobe compatibility",
    shotLabel: "Purchase check · Live analysis",
    width: 1600,
    height: 983,
  },
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
            <Image src="/landing/brand-mark.png" alt="" width={48} height={32} />
            <span><b>wear</b>abouts</span>
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
          <Image
            className="drape-hero-backdrop"
            src="/landing/hero.png"
            alt="A woman in a black blazer and cream trousers beside pieces from her wardrobe"
            fill
            priority
            sizes="100vw"
          />
          <div className="drape-container drape-hero-copy">
            <span className="drape-eyebrow">Your wardrobe, wherever life takes you</span>
            <h1 id="hero-title">
              <span className="drape-hero-line">Know what</span>
              <span className="drape-hero-line">to wear,</span>
              <span className="drape-hero-line"><em>wherever.</em></span>
            </h1>
          </div>
        </section>
        <div className="drape-hero-ctas">
          <div className="drape-container">
            <Link className="drape-button drape-primary-cta" href="/login?mode=signup&next=/onboarding">Try Wearabouts now <span aria-hidden="true">→</span></Link>
            <a className="drape-how-link" href="#story">See how it works</a>
          </div>
        </div>
        <section className="drape-bridge" aria-label="Wearabouts proposition">
          <div className="drape-container">
            <h2>
              Wearabouts turns the clothes you already own into outfits for today, any occasion and smarter decisions about what to buy next.
            </h2>
          </div>
        </section>
        <LandingStory />
        <section id="features" className="drape-section drape-feature-section">
          <div className="drape-container">
            <div className="drape-feature-heading">
              <span className="drape-eyebrow">Inside Wearabouts</span>
              <h2>From a full wardrobe to one clear decision.</h2>
              <p className="drape-feature-intro">See how Wearabouts turns the clothes you own into useful, personal answers.</p>
            </div>
            <div className="drape-feature-tour">
              {featureRows.map((row, index) => (
                <article className={index % 2 ? "is-reversed" : ""} key={row.number}>
                  <div className="drape-product-shot">
                    <div className="drape-shot-bar">
                      <span>{row.shotLabel}</span>
                      <span className="drape-shot-dots"><i /><i /><i /></span>
                    </div>
                    <div className={`drape-shot-body${index >= 2 ? " is-photo" : ""}`}>
                      {index === 0 && (
                        <div className="drape-shot-filter">
                          <span>All</span><span>Tops</span><span>Bottoms</span><span>Outerwear</span>
                        </div>
                      )}
                      {index === 1 && (
                        <div className="drape-weather-card">
                          <span><b>Warm, with rain later</b><br />Singapore · 29°C · humid</span>
                          <strong aria-hidden="true">☂</strong>
                        </div>
                      )}
                      <div className={index === 2 ? "drape-explore-visual" : ""}>
                        <Image className={`drape-shot-image${index === 3 ? " is-purchase" : ""}`} src={row.src} alt={row.alt} width={row.width} height={row.height} />
                        {index === 2 && (
                          <div className="drape-badges" aria-hidden="true">
                            <span>Matched to your style</span>
                            <span>Looks you can recreate</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="drape-feature-copy"><span className="drape-feature-number">{row.number}</span><h3>{row.title}</h3><p>{row.body}</p></div>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section id="pricing" className="drape-section drape-pricing">
          <div className="drape-container">
            <div className="drape-pricing-heading">
              <span className="drape-eyebrow">Pricing</span>
              <h2>Start free. Go deeper when you need to.</h2>
              <p>
                The core wardrobe experience is free in beta. Wearabouts Plus
                is planned for users who want more frequent analysis and
                richer history.
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
                  Join Wearabouts <span aria-hidden="true">↗</span>
                </Link>
              </article>
              <article className="drape-price-card drape-price-planned">
                <span className="drape-eyebrow">Planned</span>
                <h3>Wearabouts Plus</h3>
                <p className="drape-price">
                  S$8.90<span>/month</span>
                </p>
                <p className="drape-price-annual">
                  or S$79 a year, saving about 25%
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
            <span className="drape-eyebrow">Dress for what is next</span>
            <h2>Your easiest outfit starts here.</h2>
            <p>
              Start with the clothes you already own. Review every suggestion, understand the reason and decide what earns a place next.
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
            <Image src="/landing/brand-mark.png" alt="" width={48} height={32} />
            <span><b>wear</b>abouts</span>
          </Link>
          <Link href="/privacy">Privacy and data</Link>
          <small>Made with Singapore in mind.</small>
        </div>
      </footer>
    </main>
  );
}
