// Outline silhouettes used wherever an item has no photo yet, and for the
// category filters. Drawn on a 64-unit grid so they scale with the container.

const PATHS: Record<string, React.ReactNode> = {
  top: (
    <path d="M23 10h18l13 7-6 10-4-2v27H20V25l-4 2-6-10z" strokeLinejoin="round" />
  ),
  shirt: (
    <path
      d="M22 10 32 16l10-6 12 7-5 11-4-2v26H19V26l-4 2-5-11z"
      strokeLinejoin="round"
    />
  ),
  bottom: <path d="M18 8h28l3 48H36l-4-26-4 26H15z" strokeLinejoin="round" />,
  outerwear: (
    <>
      <path
        d="M24 10 32 15l8-5 13 8-5 10-3-2v28H19V26l-3 2-5-10z"
        strokeLinejoin="round"
      />
      <path d="M32 15v39" />
    </>
  ),
  dress: (
    <path
      d="M24 8h16l2 12-6 4 10 30H18l10-30-6-4z"
      strokeLinejoin="round"
    />
  ),
  footwear: <path d="M8 40h16l10-9 8 4 14 5v8H8z" strokeLinejoin="round" />,
  accessory: (
    <>
      <path d="M14 24h36l-3 30H17z" strokeLinejoin="round" />
      <path d="M24 24v-4a8 8 0 0116 0v4" />
    </>
  ),
  all: (
    <>
      <rect x="10" y="10" width="18" height="18" rx="3" />
      <rect x="36" y="10" width="18" height="18" rx="3" />
      <rect x="10" y="36" width="18" height="18" rx="3" />
      <rect x="36" y="36" width="18" height="18" rx="3" />
    </>
  ),
};

export type GarmentKind = keyof typeof PATHS;

export function GarmentIcon({
  kind,
  className,
  strokeWidth = 3,
}: {
  kind: string;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      className={className}
      aria-hidden
    >
      {PATHS[kind] ?? PATHS.top}
    </svg>
  );
}

// Tints for placeholder tiles, keyed by the item's primary colour where we
// recognise it, otherwise a neutral wash.
const TINTS: Record<string, [string, string]> = {
  white: ["#ecebe3", "#384436"],
  "off-white": ["#ecebe3", "#384436"],
  cream: ["#f5efdf", "#8a6a1f"],
  black: ["#e4e4dc", "#1a1c19"],
  grey: ["#e4e4dc", "#4a4f47"],
  gray: ["#e4e4dc", "#4a4f47"],
  navy: ["#dfe3e8", "#2f3f5c"],
  blue: ["#dfe3e8", "#2f3f5c"],
  indigo: ["#dde1ea", "#3b4a6b"],
  denim: ["#dde1ea", "#3b4a6b"],
  green: ["#e2e8dc", "#55704f"],
  sage: ["#e2e8dc", "#55704f"],
  olive: ["#e6e8d6", "#5b6b2f"],
  red: ["#f1dcd7", "#a32e30"],
  pink: ["#f3dfe0", "#a4506a"],
  rose: ["#f3dfe0", "#a4506a"],
  orange: ["#f6e2d6", "#b76650"],
  apricot: ["#f6e2d6", "#b76650"],
  yellow: ["#f5edd2", "#8a6a1f"],
  butter: ["#f5edd2", "#8a6a1f"],
  brown: ["#eddfd2", "#6b4a2e"],
  beige: ["#efe6d6", "#7d6647"],
  tan: ["#efe6d6", "#7d6647"],
  purple: ["#e8dfe9", "#5b3f6b"],
};

export function tintFor(colour?: string | null): { bg: string; fg: string } {
  const key = (colour ?? "").toLowerCase().trim();
  const hit =
    TINTS[key] ??
    Object.entries(TINTS).find(([name]) => key.includes(name))?.[1] ??
    (["#ecebe3", "#384436"] as [string, string]);
  return { bg: hit[0], fg: hit[1] };
}
