import Link from "next/link";
import { signOut } from "@/lib/actions/auth";

const links = [
  { href: "/wardrobe", label: "Wardrobe" },
  { href: "/wardrobe/new", label: "Add item" },
  { href: "/planner", label: "Outfit planner" },
  { href: "/evaluator", label: "Should I buy it?" },
  { href: "/profile", label: "Profile" },
];

export function AppNav() {
  return (
    <header className="border-b border-stone-200 bg-white/80 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/wardrobe" className="text-sm font-semibold tracking-wide">
          APP_NAME
        </Link>
        <div className="flex items-center gap-4 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-stone-600 hover:text-stone-900"
            >
              {link.label}
            </Link>
          ))}
          <form action={signOut}>
            <button
              type="submit"
              className="text-stone-400 hover:text-stone-700"
            >
              Sign out
            </button>
          </form>
        </div>
      </nav>
    </header>
  );
}
