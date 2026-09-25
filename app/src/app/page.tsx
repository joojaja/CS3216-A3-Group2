import type { Metadata } from "next";
import Link from "next/link";
import { siteUrl, siteDescription } from "@/lib/site";
import Image from "next/image";
import "./landing.css";
import "./landing-cinematic.css";
import "./landing-refresh.css";
import "./landing-hero.css";
import "./landing-sections.css";
import LandingStory from "@/components/landing-story";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const featureRows = [
  {
    number: "01 · Build your wardrobe",
    title: "Your clothes, finally searchable",
    body: "Add a photo and Wearabouts picks out useful details such as category, colour and material. You can correct any tag, find any piece and rediscover your clothes.",
    src: "/landing/feature-wardrobe.webp",
    alt: "Six realistic wardrobe product photos: an ivory shirt, olive trousers, black T-shirt, beige overshirt, white sneakers and blue Oxford shirt",
    shotLabel: "My wardrobe · 24 pieces",
    width: 1400,
    height: 933,
  },
  {
    number: "02 · Dress for the day",
    title: "Plan beyond the dress code",
    body: "Where you are going matters. So does the weather and everything else happening that day. Wearabouts considers it all before suggesting one complete look.",
    src: "/landing/feature-weather-screenshot.png",
    alt: "The outfit planner showing two recommended outfits for a casual outdoor birthday lunch, each with a photo, an explanation of why it suits the occasion and weather, and a warning about the forecast",
    shotLabel: "Outfit planner · Today's outfits",
    width: 1254,
    height: 1254,
  },
  {
    number: "03 · Explore your style",
    title: "Inspiration you can actually wear.",
    body: "Browse looks curated by the Wearabouts team and matched to your style profile. Instead of saving outfits built from someone else's closet, discover ideas that feel more like you and work with what you already own.",
    src: "/landing/feature-explore-screenshot.png",
    alt: "The Explore page showing a grid of curated clothing pieces from local retailers, such as water-repellent jackets and trousers, each with a product name, price and short explanation of why it complements the wardrobe",
    shotLabel: "Explore · Curated for you",
    width: 2358,
    height: 1262,
  },
  {
    number: "04 · Check before buying",
    title: "Make every new piece earn its place.",
    body: "Compare a prospective purchase with your wardrobe before it becomes another forgotten item. See what it works with, what it might repeat and whether it adds something you will genuinely wear.",
    src: "/landing/feature-purchase.webp",
    alt: "Wearabouts purchase analysis for a light blue jersey, including redundancy and wardrobe compatibility",
    shotLabel: "Purchase check · Live analysis",
    width: 1600,
    height: 983,
  },
];

const faqItems = [
  {
    question: "What does Wearabouts actually do?",
    answer:
      "Wearabouts helps you organise the clothes you own, find outfits for real plans and think through potential purchases. It brings together your wardrobe, preferences, occasion and local weather to recommend one complete look and explain why it works.",
  },
  {
    question: "Do I need to upload my whole wardrobe before I can start?",
    answer:
      "Not at all. Start with the clothes you wear most and add more whenever you feel like it. Wearabouts becomes more useful as your wardrobe grows, but there is no need to add everything at once.",
  },
  {
    question: "How does Wearabouts choose an outfit?",
    answer:
      "It considers what you own, where you are going, the weather, how much you might move and the preferences you share over time. You will also see why the outfit was chosen, so you can decide whether it feels right for you.",
  },
  {
    question: "What if Wearabouts gets something wrong?",
    answer:
      "You can review and correct details such as category, colour and material. You can also respond to recommendations, helping Wearabouts understand your taste better over time.",
  },
  {
    question: "Is my wardrobe private?",
    answer:
      "Yes. Your wardrobe is private by default and is used to personalise your experience. You stay in control of the clothes and information you add.",
  },
  {
    question: "Is Wearabouts free?",
    answer:
      "The core wardrobe experience is free during beta. A Wearabouts Plus plan is intended for people who want higher usage limits, deeper history and more advanced personalisation.",
  },
  {
    question: "Is Wearabouts trying to stop me from shopping?",
    answer:
      "No. It is here to help you shop with more intention. If something new genuinely works with your wardrobe, Wearabouts helps you see why. If it does not, you can find out before spending.",
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
          <span className="drape-nav-glass" aria-hidden="true">
            <span className="drape-nav-blur" />
          </span>
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
            src="/landing/hero-home.png"
            alt="A woman relaxing on a bench in a warm, walnut-panelled home dressing room beside an open wardrobe of neutral clothing"
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
          <div className="drape-hero-ctas">
            <div className="drape-container">
              <Link className="drape-button drape-primary-cta" href="/login?mode=signup&next=/onboarding">Try Wearabouts now <span aria-hidden="true">→</span></Link>
              <a className="drape-how-link" href="#story">See how it works</a>
            </div>
          </div>
        </section>
        <section className="drape-bridge" aria-label="Wearabouts proposition">
          <div className="drape-container">
            <h2>
              <b>Wear more</b> of what you own.
              <br />
              <b>Love more</b> of what you wear.
            </h2>
            <p>
              Rediscover old favourites, find combinations you have never tried and stop saving your best clothes for a day that never seems to come. Wearabouts starts with what is already in your wardrobe, helping turn them into outfits for any occasion and make smarter decisions about what to buy next.
            </p>
          </div>
        </section>
        <LandingStory />
        <section id="features" className="drape-section drape-feature-section">
          <div className="drape-container">
            <div className="drape-feature-heading is-wide">
              <span className="drape-eyebrow">Inside Wearabouts</span>
              <h2>
                The magic of Wearabouts is how it <em>all</em> works together to make personal style feel <em>simpler</em>
              </h2>
            </div>
            <div className="drape-feature-tour">
              {featureRows.map((row, index) => (
                <article className={index % 2 ? "is-reversed" : ""} key={row.number}>
                  <div className="drape-product-shot">
                    <div className="drape-shot-bar">
                      <span>{row.shotLabel}</span>
                      <span className="drape-shot-dots"><i /><i /><i /></span>
                    </div>
                    <div className={`drape-shot-body${index >= 1 ? " is-photo" : ""}`}>
                      {index === 0 && (
                        <div className="drape-shot-filter">
                          <span>All</span><span>Tops</span><span>Bottoms</span><span>Outerwear</span>
                        </div>
                      )}
                      <div>
                        <Image
                          className={`drape-shot-image${index === 3 ? " is-purchase" : ""}`}
                          src={row.src}
                          alt={row.alt}
                          width={row.width}
                          height={row.height}
                        />
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
              <h2>
                Start free.
                <br />
                Go deeper when you need to.
              </h2>
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
                  Tailored for people who want more frequent analysis, a deeper
                  wardrobe history and more personalised recommendations.
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
        <section id="faq" className="drape-section drape-faq">
          <div className="drape-container drape-narrow">
            <div className="drape-faq-heading">
              <span className="drape-eyebrow">Frequently asked questions</span>
              <h2>A few things you might be wondering.</h2>
            </div>
            <div className="drape-faq-list">
              {faqItems.map((item) => (
                <details className="drape-faq-item" key={item.question}>
                  <summary>{item.question}</summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
        <section id="join" className="drape-join">
          <div className="drape-container drape-narrow">
            <span className="drape-eyebrow">Dress for what is next</span>
            <h2>Fall back in love with getting dressed.</h2>
            <p>
              Rediscover what you own, find outfits that feel like you and make getting ready something to look forward to again.
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
