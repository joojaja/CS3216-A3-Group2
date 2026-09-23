"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { trackFunnel } from "@/lib/analytics";

const stages = [
  {
    label: "The wardrobe",
    heading: ["Plenty of clothes.", "Still no clear answer."],
    body: "Seeing everything at once does not make the decision easier. Wearabouts begins by understanding what is actually available.",
  },
  {
    label: "The context",
    heading: ["What works for", "where you're going?"],
    body: "Your plans and surroundings narrow the wardrobe to what genuinely fits tonight.",
  },
  {
    label: "The comparison",
    heading: ["Not just a suggestion.", "A reason."],
    body: "Olive stays smart enough for dinner while feeling lighter and easier for the walk than charcoal.",
  },
  {
    label: "The outfit",
    heading: ["One outfit.", "Zero second-guessing."],
    body: "Every piece now answers the same occasion, weather and practical needs.",
  },
];

export default function LandingStory() {
  const [active, setActive] = useState(0);
  const [enhanced, setEnhanced] = useState(false);
  const frame = useRef<number | null>(null);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const section = document.querySelector<HTMLElement>(".drape-story");
    const readingProgress = document.querySelector<HTMLElement>(".drape-reading-progress span");
    let latest = 0;
    const onScroll = () => {
      if (readingProgress) {
        const documentRange = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        readingProgress.style.transform = `scaleX(${Math.max(0, Math.min(1, window.scrollY / documentRange))})`;
      }
      if (window.innerWidth < 901 || media.matches) return;
      if (!section) return;
      latest = Math.max(0, Math.min(1, -section.getBoundingClientRect().top / Math.max(1, section.offsetHeight - window.innerHeight)));
      if (frame.current === null) frame.current = window.requestAnimationFrame(() => { setActive(Math.min(3, Math.floor(latest * 3 + 0.5))); frame.current = null; });
    };
    const updateMode = () =>
      setEnhanced(window.innerWidth >= 901 && !media.matches);
    updateMode();
    document.documentElement.classList.add("drape-motion-ready");
    const header = document.querySelector<HTMLElement>(".drape-header");
    const onHeaderScroll = () => header?.classList.toggle("is-compact", window.scrollY > 70);
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        if (entry.target.classList.contains("drape-pricing-heading")) trackFunnel("pricing_viewed");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -10% 0px" });
    document
      .querySelectorAll(
        ".drape-bridge, .drape-feature-heading, .drape-feature-tour article, .drape-pricing-heading, .drape-price-card, .drape-story-mobile article",
      )
      .forEach((el) => (media.matches ? el.classList.add("is-visible") : observer.observe(el)));
    window.addEventListener("scroll", onHeaderScroll, { passive: true });
    onHeaderScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateMode);
    media.addEventListener("change", updateMode);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("scroll", onHeaderScroll);
      window.removeEventListener("resize", updateMode);
      media.removeEventListener("change", updateMode);
      observer.disconnect();
      if (frame.current !== null) window.cancelAnimationFrame(frame.current);
    };
  }, []);

  return (
    <section
      className={`drape-story${enhanced ? " is-enhanced" : ""}`}
      id="story"
      aria-label="How Wearabouts narrows a wardrobe decision"
    >
      <div className="drape-reading-progress" aria-hidden="true"><span /></div>
      <h2 className="sr-only">How Wearabouts works</h2>
      <div className="drape-story-desktop">
        <div className="drape-story-copy">
          <h2>
            {stages[active].heading[0]}
            <br />
            {stages[active].heading[1]}
          </h2>
          <p>{stages[active].body}</p>
          <div className="drape-progress" role="progressbar" aria-valuemin={1} aria-valuemax={4} aria-valuenow={active + 1}>
            <span style={{ width: `${((active + 1) / 4) * 100}%` }} />
          </div>
        </div>
        <div className="drape-story-controller" role="group" aria-label="Story stages">
          <span className="drape-story-controller-capsule" aria-hidden="true" style={{ transform: `translateX(${active * 100}%)` }} />
          {stages.map((stage, i) => <button key={stage.label} type="button" aria-current={i === active ? "step" : undefined} aria-label={`Stage ${i + 1}: ${stage.label}`} onClick={() => sectionScroll(i)}>{["Wardrobe", "Context", "Comparison", "Outfit"][i]}</button>)}
        </div>
        <div className="drape-story-images">
          {stages.map((stage, i) => (
            <Image
              className={i === active ? "is-active" : ""}
              key={stage.label}
              src={`/landing/${["story-wardrobe", "story-context", "story-comparison", "story-outfit"][i]}.webp`}
              alt={stage.body}
              aria-hidden={i === active ? undefined : true}
              fill
              sizes="100vw"
            />
          ))}
        </div>
      </div>
      <div className="drape-story-mobile drape-container">
        {stages.map((stage, i) => (
          <article key={stage.label}>
            <div>
              <h3>
                {stage.heading[0]}
                <br />
                {stage.heading[1]}
              </h3>
              <p>{stage.body}</p>
            </div>
            <Image
              src={`/landing/${["story-wardrobe", "story-context", "story-comparison", "story-outfit"][i]}.webp`}
              alt={
                i === 3 ? "The selected outfit ready to wear" : "Wardrobe scene"
              }
              width={1122}
              height={1402}
              sizes="(max-width: 640px) calc(100vw - 44px), 50vw"
            />
          </article>
        ))}
      </div>
    </section>
  );
}

function sectionScroll(index: number) {
  const section = document.querySelector<HTMLElement>(".drape-story");
  if (!section) return;
  const offset = (section.offsetHeight - window.innerHeight) * (index / 3);
  const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
  window.scrollTo({ top: section.offsetTop + offset, behavior });
}
