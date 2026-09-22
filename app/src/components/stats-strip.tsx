export function StatsStrip({
  stats,
}: {
  stats: { value: number; label: string }[];
}) {
  return (
    <div className="app-stats mb-7 grid grid-cols-3 gap-2 md:gap-3">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-xl border border-line px-3 py-3 md:px-4 md:py-3.5">
          <b className="block text-[26px] leading-none font-semibold tracking-tight">{stat.value}</b>
          <span className="mt-1.5 block text-xs text-mute md:text-[13px]">{stat.label}</span>
        </div>
      ))}
    </div>
  );
}
