import Link from "next/link";
import type { Metadata } from "next";
import { siteUrl, siteDescription } from "@/lib/site";
import Image from "next/image";
import "./landing.css";
import "./landing-cinematic.css";
import LandingStory from "@/components/landing-story";

const featureRows = [
  ["01 · Build your wardrobe", "Your clothes, finally searchable.", "Add a piece, review the suggested details, and keep the version you confirm.", "/landing/feature-wardrobe.webp", "Six realistic wardrobe product photos: an ivory shirt, olive trousers, black T-shirt, beige overshirt, white sneakers and blue Oxford shirt"],
  ["02 · Dress for the day", "Tell it where life is taking you.", "Plan around Singapore heat, humidity and rain with recommendations built from your own clothes.", "/landing/feature-weather.webp", "A man in Singapore wearing an ivory overshirt, black T-shirt, olive trousers and white sneakers"],
  ["03 · Explore your style", "Inspiration you can actually recreate.", "See curated looks matched to your confirmed wardrobe and personal style.", "/landing/feature-style.webp", "Four curated Singapore smart-casual looks personalised to the same style profile"],
  ["04 · Check before buying", "Know whether a new piece earns its place.", "Compare a prospective piece with what you own before it becomes another forgotten purchase.", "/landing/feature-purchase.webp", "Wearabouts purchase analysis for a light blue jersey, including redundancy and wardrobe compatibility"],
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
            <span>Wearabouts</span>
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
            <span className="drape-eyebrow">Your wardrobe, wherever life takes you</span>
            <h1 id="hero-title">Know what to wear, <em>wherever.</em></h1>
            <figure>
              <Image
                src="/landing/hero.png"
                alt="A woman in a black blazer and cream trousers beside pieces from her wardrobe"
                width={1731}
                height={909}
                priority
                sizes="(max-width: 640px) calc(100vw - 44px), min(1240px, calc(100vw - 72px))"
              />
              <figcaption><Link className="drape-button" href="/login?mode=signup&next=/onboarding">Get early access <span aria-hidden="true">↗</span></Link><a href="#story">See how it works <span aria-hidden="true">↓</span></a></figcaption>
            </figure>
          </div>
        </section>
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
            </div>
            <div className="drape-feature-tour">
              {featureRows.map(([label, title, body, src, alt], index) => (
                <article className={index % 2 ? "is-reversed" : ""} key={label}>
                  <div className="drape-feature-visual"><Image src={src} alt={alt} width={index === 3 ? 1600 : 1400} height={index === 3 ? 983 : 933} /></div>
                  <div className="drape-feature-copy"><span className="drape-feature-number">{label}</span><h3>{title}</h3><p>{body}</p>{index === 1 && <span className="drape-weather-chip">Singapore · 31°C · Light rain</span>}{index === 2 && <div className="drape-badges"><span>Matched to your style</span><span>Looks you can recreate</span></div>}</div>
                </article>
              ))}
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
            <span>Wearabouts</span>
          </Link>
          <Link href="/privacy">Privacy and data</Link>
          <small>Made with Singapore in mind.</small>
        </div>
      </footer>
    </main>
  );
}
