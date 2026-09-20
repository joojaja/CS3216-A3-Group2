"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const stages = [
  [
    "The wardrobe",
    "Plenty of clothes. Still no clear answer.",
    "Seeing everything at once does not make the decision easier.",
  ],
  [
    "The context",
    "What works for where you're going?",
    "Your plans and surroundings narrow the wardrobe to what fits tonight.",
  ],
  [
    "The comparison",
    "A suggestion with a reason.",
    "See how formality, colour and the forecast influence the choice.",
  ],
  [
    "The outfit",
    "One considered outfit, ready for your review.",
    "Every piece answers the same occasion, weather and practical needs.",
  ],
];

export default function LandingStory() {
  const [active, setActive] = useState(0);
  const [enhanced, setEnhanced] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onScroll = () => {
      if (window.innerWidth < 901 || media.matches) return;
      const section = document.querySelector<HTMLElement>(".drape-story");
      if (!section) return;
      const range = section.offsetHeight - window.innerHeight;
      const progress = Math.max(
        0,
        Math.min(1, -section.getBoundingClientRect().top / range),
      );
      setActive(Math.min(3, Math.floor(progress * 3 + 0.5)));
    };
    const updateMode = () =>
      setEnhanced(window.innerWidth >= 901 && !media.matches);
    updateMode();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateMode);
    media.addEventListener("change", updateMode);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateMode);
      media.removeEventListener("change", updateMode);
    };
  }, []);

  return (
    <section
      className={`drape-story${enhanced ? " is-enhanced" : ""}`}
      id="story"
      aria-label="How Wearabouts narrows a wardrobe decision"
    >
      <h2 className="sr-only">How Wearabouts works</h2>
      <div className="drape-story-desktop">
        <a className="drape-story-skip" href="#after-story">
          Skip story <span aria-hidden="true">↘</span>
        </a>
        <div className="drape-story-copy">
          <span className="drape-story-count">
            0{active + 1} / 04 · {stages[active][0]}
          </span>
          <h2>{stages[active][1]}</h2>
          <p>{stages[active][2]}</p>
          <div className="drape-progress">
            <span style={{ width: `${((active + 1) / 4) * 100}%` }} />
          </div>
        </div>
        <div className="drape-story-images">
          {[2, 3, 4, 5].map((n, i) => (
            <Image
              className={i === active ? "is-active" : ""}
              key={n}
              src={`/landing/narrative-${n}.webp`}
              alt=""
              aria-hidden="true"
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
              src={`/landing/narrative-${i + 2}.webp`}
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
