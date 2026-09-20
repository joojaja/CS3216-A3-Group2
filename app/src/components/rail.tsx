"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { signOut } from "@/lib/actions/auth";
import { AnalysisStatus } from "@/components/analysis-status";

const links = [
  { href: "/wardrobe", label: "Wardrobe", short: "Wardrobe", icon: HomeIcon },
  { href: "/wardrobe/new", label: "Add item", short: "Add", icon: PlusIcon },
  { href: "/planner", label: "Outfit planner", short: "Planner", icon: ClockIcon },
  { href: "/evaluator", label: "Should I buy it?", short: "Buy?", icon: BagIcon },
  { href: "/profile", label: "Profile", short: "Profile", icon: UserIcon },
];

export type RailUser = { name: string; email: string } | null;
export type RailWeather = { short: string; source: string } | null;

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
      {/* Desktop rail */}
      <aside className="hidden h-full flex-col bg-cobalt pt-6 text-white md:flex">
        <Link href="/wardrobe" className="px-6 pb-6 text-xl font-semibold tracking-tight">
          Wearabouts
        </Link>
        <nav className="relative flex flex-col">
          {active >= 0 && (
            <motion.div
              layoutId="rail-pill"
              className="absolute inset-x-3 h-11 rounded-[10px] bg-white/15"
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
                index === active ? "text-white" : "text-cobalt-faint hover:text-white"
              }`}
            >
              <link.icon className="size-[19px] shrink-0" />
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto">
          <AnalysisStatus variant="rail" />
        </div>

        <div className="border-t border-white/20 px-6 py-4 text-[13px] leading-relaxed text-cobalt-faint">
          <b className="block text-sm font-medium text-white">Singapore, now</b>
          {weather ? `${weather.short}. ${weather.source}.` : "Forecast unavailable right now."}
        </div>

        <div className="flex items-center gap-3 border-t border-white/20 px-6 py-4">
          <span className="grid size-[34px] shrink-0 place-items-center rounded-full bg-tangerine text-sm font-semibold">
            {initial}
          </span>
          <div className="min-w-0">
            <b className="block truncate text-sm font-medium">{user?.name ?? "Dev session"}</b>
            <span className="block truncate text-xs text-cobalt-faint">
              {user?.email ?? "Supabase not configured"}
            </span>
          </div>
          <form action={signOut} className="ml-auto shrink-0">
            <button type="submit" className="text-xs text-cobalt-faint hover:text-white">
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile: status bar for background analysis, then the tab bar */}
      <div className="md:hidden">
        <AnalysisStatus variant="bar" />
        <nav className="relative grid grid-cols-5 bg-cobalt pb-1.5">
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
              index === active ? "text-white" : "text-cobalt-faint"
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
