"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

const stages = [
  [
    "The wardrobe",
    "Plenty of clothes. Still no clear answer.",
    "Seeing everything at once does not make the decision easier. Wearabouts begins by understanding what is actually available.",
  ],
  [
    "The context",
    "What works for where you're going?",
    "Dinner at seven, smart casual, 29°C and a walk from the MRT narrow the options.",
  ],
  [
    "The comparison",
    "Not just a suggestion. A reason.",
    "Olive trousers beat charcoal for comfort without losing the right level of formality.",
  ],
  [
    "The outfit",
    "One outfit. Zero second-guessing.",
    "Ivory overshirt, black tee, olive trousers and white sneakers.",
  ],
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
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.target.classList.toggle("is-visible", entry.isIntersecting));
    }, { threshold: 0.12 });
    document.querySelectorAll(".drape-feature-tour article").forEach((article) => observer.observe(article));
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateMode);
    media.addEventListener("change", updateMode);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
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
          <span className="drape-story-count">
            0{active + 1} / 04 · {stages[active][0]}
          </span>
          <h2>{stages[active][1]}</h2>
          <p>{stages[active][2]}</p>
          <div className="drape-progress" role="progressbar" aria-valuemin={1} aria-valuemax={4} aria-valuenow={active + 1}>
            <span style={{ width: `${((active + 1) / 4) * 100}%` }} />
          </div>
        </div>
        <div className="drape-story-controller" aria-label="Story stages">
          {stages.map((stage, i) => <button key={stage[0]} type="button" aria-current={i === active ? "step" : undefined} onClick={() => sectionScroll(i)}>{["Wardrobe", "Context", "Comparison", "Outfit"][i]}</button>)}
        </div>
        <div className="drape-story-images">
          {[0, 1, 2, 3].map((_, i) => (
            <Image
              className={i === active ? "is-active" : ""}
              key={i}
              src={`/landing/${["story-wardrobe", "story-context", "story-comparison", "story-outfit"][i]}.webp`}
              alt={stages[i][2]}
              aria-hidden={i === active ? undefined : true}
              fill
              sizes="100vw"
            />
          ))}
        </div>
      </div>
      <div className="drape-story-mobile drape-container">
        {stages.map((stage, i) => (
          <article key={stage[0]}>
            <div>
              <span className="drape-story-count">
                0{i + 1} / 04 · {stage[0]}
              </span>
              <h3>{stage[1]}</h3>
              <p>{stage[2]}</p>
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
