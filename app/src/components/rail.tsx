"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { signOut } from "@/lib/actions/auth";
import { AnalysisStatus } from "@/components/analysis-status";
import { PlannerStatus } from "@/components/planner-status";

const links = [
  { href: "/wardrobe", label: "Wardrobe", short: "Wardrobe", icon: HomeIcon },
  { href: "/wardrobe/new", label: "Add item", short: "Add", icon: PlusIcon },
  { href: "/planner", label: "Outfit planner", short: "Planner", icon: ClockIcon },
  { href: "/evaluator", label: "Should I buy it?", short: "Buy?", icon: BagIcon },
  { href: "/profile", label: "Profile", short: "Profile", icon: UserIcon },
];

export type RailUser = { name: string; email: string } | null;
export type RailWeather = {
  temperature: string | null;
  humidity: string | null;
  condition: string | null;
} | null;

// Longest matching href wins, so /wardrobe/new lights up Add item rather
// than Wardrobe.
function activeIndex(pathname: string) {
  let best = -1;
  let bestLength = 0;
  links.forEach((link, index) => {
    if (pathname.startsWith(link.href) && link.href.length > bestLength) {
      best = index;
      bestLength = link.href.length;
    }
  });
  return best;
}

export function Rail({ user, weather }: { user: RailUser; weather: RailWeather }) {
  const pathname = usePathname();
  const active = activeIndex(pathname);
  const initial = (user?.name ?? user?.email ?? "?").charAt(0).toUpperCase();

  return (
    <>
      {/* Desktop rail: paper surface with a hairline edge, like the landing header */}
      <aside className="hidden h-full flex-col border-r border-line bg-paper pt-6 md:flex">
        <Link
          href="/wardrobe"
          aria-label="Wearabouts home"
          className="flex items-center gap-2 px-6 pb-7 text-[22px] tracking-[-0.05em] text-ink"
        >
          <LogoMark className="size-[30px] shrink-0" />
          <span>
            <b className="font-semibold">wear</b>abouts
          </span>
        </Link>
        <nav className="relative flex flex-col">
          {active >= 0 && (
            <motion.div
              layoutId="rail-pill"
              className="absolute inset-x-3 h-11 rounded-[10px] bg-soft"
              initial={false}
              animate={{ y: active * 46 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
          {links.map((link, index) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative z-10 flex h-[46px] items-center gap-3 px-6 text-[15px] font-medium transition-colors ${
                index === active ? "text-ink" : "text-mute hover:text-ink"
              }`}
            >
              <link.icon className="size-[19px] shrink-0" />
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto">
          <AnalysisStatus variant="rail" />
          <PlannerStatus variant="rail" />
        </div>

        <div className="border-t border-line px-4 py-4">
          <b className="mb-1 block text-[11px] font-semibold tracking-[0.15em] uppercase text-ink">
            Singapore weather
          </b>
          {weather ? (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-soft px-3 py-3 text-ink">
                <ThermometerIcon className="size-5 text-tangerine" />
                <span className="mt-2 block text-[10px] font-medium tracking-wide text-mute uppercase">
                  Temperature
                </span>
                <strong className="mt-0.5 block text-[15px] font-semibold">
                  {weather.temperature ? `${weather.temperature}°C` : "Unavailable"}
                </strong>
              </div>
              <div className="rounded-xl bg-soft px-3 py-3 text-ink">
                <DropletIcon className="size-5 text-cobalt" />
                <span className="mt-2 block text-[10px] font-medium tracking-wide text-mute uppercase">
                  Humidity
                </span>
                <strong className="mt-0.5 block text-[15px] font-semibold">
                  {weather.humidity ? `${weather.humidity}%` : "Unavailable"}
                </strong>
              </div>
              {weather.condition && (
                <div className="col-span-2 flex items-center gap-3 rounded-xl bg-soft px-3 py-3 text-ink">
                  <WeatherConditionIcon
                    condition={weather.condition}
                    className="size-6 shrink-0 text-tangerine"
                  />
                  <span>
                    <span className="block text-[10px] font-medium tracking-wide text-mute uppercase">
                      Weather
                    </span>
                    <strong className="mt-0.5 block text-[14px] font-semibold leading-snug">
                      {weather.condition}
                    </strong>
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p className="mt-2 text-xs text-mute">Weather unavailable right now.</p>
          )}
        </div>

        <div className="flex items-center gap-3 border-t border-line px-6 py-4">
          <span className="grid size-[34px] shrink-0 place-items-center rounded-full bg-tangerine text-sm font-semibold text-white">
            {initial}
          </span>
          <div className="min-w-0">
            <b className="block truncate text-sm font-medium text-ink">{user?.name ?? "Dev session"}</b>
            <span className="block truncate text-xs text-mute">
              {user?.email ?? "Supabase not configured"}
            </span>
          </div>
          <form action={signOut} className="ml-auto shrink-0">
            <button type="submit" className="text-xs text-mute hover:text-ink">
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile: status bars for background work, then the tab bar */}
      <div className="md:hidden">
        <AnalysisStatus variant="bar" />
        <PlannerStatus variant="bar" />
        <nav className="relative grid grid-cols-5 border-t border-line bg-paper pb-1.5">
        {active >= 0 && (
          <motion.div
            className="absolute top-0 left-0 h-[3px] w-1/5 rounded-b-[3px] bg-tangerine"
            initial={false}
            animate={{ x: `${active * 100}%` }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          />
        )}
        {links.map((link, index) => (
          <Link
            key={link.href}
            href={link.href}
            className={`grid justify-items-center gap-1 px-1 pt-3 pb-2 text-center text-[10.5px] transition-colors ${
              index === active ? "text-ink" : "text-mute"
            }`}
          >
            <link.icon
              className={`size-5 transition-transform ${index === active ? "-translate-y-0.5" : ""}`}
            />
            {link.short}
          </Link>
        ))}
        </nav>
      </div>
    </>
  );
}

type IconProps = { className?: string };
const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.9 } as const;

// Same mark as the landing page header and footer
function LogoMark({ className }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 12 12 31 20 20 28 31 36 12M12 15l8-6c4-4-2-9-5-5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HomeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...stroke}>
      <path d="M3 9l9-6 9 6v11a1 1 0 01-1 1h-5v-7h-6v7H4a1 1 0 01-1-1z" />
    </svg>
  );
}
function PlusIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...stroke}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function ClockIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...stroke}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </svg>
  );
}
function BagIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...stroke}>
      <path d="M4 7h16l-1.5 13h-13z" />
      <path d="M9 7a3 3 0 016 0" />
    </svg>
  );
}
function UserIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...stroke}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0116 0" />
    </svg>
  );
}

function ThermometerIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...stroke} aria-hidden="true">
      <path d="M9 14.8V5a3 3 0 016 0v9.8a5 5 0 11-6 0z" />
      <path d="M12 7v9" />
    </svg>
  );
}

function DropletIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...stroke} aria-hidden="true">
      <path d="M12 3s6 6.4 6 11a6 6 0 11-12 0c0-4.6 6-11 6-11z" />
    </svg>
  );
}

function WeatherConditionIcon({
  condition,
  className,
}: IconProps & { condition: string }) {
  if (/thunder/i.test(condition)) {
    return (
      <svg viewBox="0 0 24 24" className={className} {...stroke} aria-hidden="true">
        <path d="M7 17a4 4 0 01-.4-8A6 6 0 0118 10a3.5 3.5 0 01-.5 7H7z" />
        <path d="M13 14l-2 4h3l-2 3" />
      </svg>
    );
  }
  if (/rain|shower|drizzle/i.test(condition)) {
    return (
      <svg viewBox="0 0 24 24" className={className} {...stroke} aria-hidden="true">
        <path d="M7 15a4 4 0 01-.4-8A6 6 0 0118 8a3.5 3.5 0 01-.5 7H7z" />
        <path d="M8 18l-1 2M13 18l-1 2M18 18l-1 2" />
      </svg>
    );
  }
  if (/sun|fair|clear/i.test(condition)) {
    return (
      <svg viewBox="0 0 24 24" className={className} {...stroke} aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={className} {...stroke} aria-hidden="true">
      <path d="M6.5 18a4.5 4.5 0 01-.4-9A6 6 0 0118 10a4 4 0 01-1 8H6.5z" />
    </svg>
  );
}
