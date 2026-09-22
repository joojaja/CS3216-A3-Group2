import Link from "next/link";

// Switches between the items you own and the outfits you saved from them.
// Both pages sit under /wardrobe, so the rail keeps the Wardrobe tab active.
export function WardrobeTabs({
  active,
  savedCount,
}: {
  active: "items" | "outfits";
  savedCount: number | null;
}) {
  const tabs = [
    { key: "items", href: "/wardrobe", label: "Items" },
    {
      key: "outfits",
      href: "/wardrobe/outfits",
      label: savedCount ? `Saved outfits (${savedCount})` : "Saved outfits",
    },
  ] as const;

  return (
    <nav aria-label="Wardrobe views" className="mb-5 inline-flex rounded-full border border-line bg-white p-1">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          aria-current={active === tab.key ? "page" : undefined}
          className={`rounded-full px-4 py-1.5 text-[13.5px] font-medium transition ${
            active === tab.key ? "bg-ink text-white" : "text-mute hover:text-ink"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
