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

  return <motion.b className="block text-[26px] leading-none font-semibold tracking-tight md:text-[26px]">{rounded}</motion.b>;
}

export function StatsStrip({
  stats,
}: {
  stats: { value: number; label: string }[];
}) {
  return (
    <div className="mb-5 grid grid-cols-3 gap-2 md:gap-3">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-xl border border-line px-3 py-3 md:px-4 md:py-3.5">
          <Count value={stat.value} />
          <span className="mt-1.5 block text-xs text-mute md:text-[13px]">{stat.label}</span>
        </div>
      ))}
    </div>
  );
}
