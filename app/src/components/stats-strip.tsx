"use client";

import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect } from "react";

function Count({ value }: { value: number }) {
  const raw = useMotionValue(0);
  const rounded = useTransform(raw, (v) => Math.round(v));

  useEffect(() => {
    const controls = animate(raw, value, { duration: 0.9, ease: [0.2, 0.8, 0.3, 1] });
    return controls.stop;
  }, [raw, value]);

  return (
    <motion.b className="block font-serif text-[32px] leading-none tracking-[-0.03em] md:text-[38px]">
      {rounded}
    </motion.b>
  );
}

// Hairline-topped figures, the same treatment as the numbered feature grid
// on the landing page
export function StatsStrip({
  stats,
}: {
  stats: { value: number; label: string }[];
}) {
  return (
    <div className="mb-6 grid grid-cols-3 gap-5 md:gap-8">
      {stats.map((stat) => (
        <div key={stat.label} className="border-t border-line pt-3.5">
          <Count value={stat.value} />
          <span className="mt-2 block text-xs text-mute md:text-[13px]">{stat.label}</span>
        </div>
      ))}
    </div>
  );
}
