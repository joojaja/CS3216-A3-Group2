import { useId } from "react";
import type { MeasurementKey } from "@/lib/sizing/types";
import { MEASUREMENT_BY_KEY } from "@/lib/sizing/measurements";

// One neutral front-facing outline, drawn on a 160 x 400 grid, with a tape
// layer per measurement. Only the highlighted layers render, so the same
// component serves the wizard, the missing-measurement prompt and the size
// result. Colours come from the theme tokens so a future dark theme only
// has to redefine them.

// Left half of the body, then the right half as its mirror image
const OUTLINE =
  "M72 54 L72 64 C60 66 46 68 42 76 L28 178 L36 182 L50 104 " +
  "C48 130 56 145 56 160 C56 175 46 190 46 210 L56 372 L48 384 L74 384 L74 372 L78 226 " +
  "L82 226 L86 372 L86 384 L112 384 L104 372 L114 210 " +
  "C114 190 104 175 104 160 C104 145 112 130 110 104 L124 182 L132 178 L118 76 " +
  "C114 68 100 66 88 64 L88 54 Z";

// Ellipses for tape wrapped around the body, lines with end ticks for
// straight measurements
const PARTS: Record<MeasurementKey, React.ReactNode> = {
  chest: <ellipse cx="80" cy="118" rx="32" ry="5" />,
  waist: <ellipse cx="80" cy="160" rx="25" ry="4" />,
  hips: <ellipse cx="80" cy="206" rx="35" ry="5" />,
  inseam: (
    <>
      <path d="M72 234 L67 366" />
      <path d="M67 234 L77 234 M62 366 L72 366" />
    </>
  ),
  height: (
    <>
      <path d="M148 14 L148 384" />
      <path d="M142 14 L154 14 M142 384 L154 384" />
    </>
  ),
  foot_length: (
    <>
      <path d="M86 394 L112 394" />
      <path d="M86 389 L86 399 M112 389 L112 399" />
    </>
  ),
};

type Props = {
  highlight: MeasurementKey[];
  size?: "sm" | "md";
  className?: string;
};

export function BodyDiagram({ highlight, size = "md", className = "" }: Props) {
  const id = useId();
  const labels = highlight.map((k) => MEASUREMENT_BY_KEY[k].label.toLowerCase());
  const title = labels.length
    ? `Body outline with the ${labels.join(" and ")} highlighted`
    : "Body outline";
  const desc =
    highlight.length === 1 ? MEASUREMENT_BY_KEY[highlight[0]].instruction : undefined;

  return (
    <svg
      viewBox="0 0 160 400"
      role="img"
      aria-labelledby={`${id}-title`}
      aria-describedby={desc ? `${id}-desc` : undefined}
      className={`${size === "sm" ? "h-28" : "h-64 md:h-72"} w-auto shrink-0 ${className}`}
    >
      <title id={`${id}-title`}>{title}</title>
      {desc && <desc id={`${id}-desc`}>{desc}</desc>}
      <g data-layer="outline" aria-hidden="true">
        <circle cx="80" cy="34" r="19" fill="var(--color-wash)" stroke="var(--color-mute)" strokeOpacity="0.5" strokeWidth="1.5" />
        <path d={OUTLINE} fill="var(--color-wash)" stroke="var(--color-mute)" strokeOpacity="0.5" strokeWidth="1.5" strokeLinejoin="round" />
      </g>
      {highlight.map((key) => (
        <g
          key={key}
          data-part={key}
          aria-hidden="true"
          fill="none"
          stroke="var(--color-tangerine)"
          strokeWidth="3"
          strokeLinecap="round"
        >
          {PARTS[key]}
        </g>
      ))}
    </svg>
  );
}
