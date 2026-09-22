import Link from "next/link";
import type { Palette } from "@/lib/style/palette";
import type { StyleThumb } from "@/components/style-archetypes";

// The colour palette on My Style: a blended bar, then one row per colour
// family. Swatches are family colours, not colours measured from photos,
// so the page names the family and never prints a hex code.
export function StylePalette({ palette, thumbs }: { palette: Palette; thumbs: Record<string, StyleThumb> }) {
  const rows = palette.rows.filter((row) => row.key !== "other");
  const other = palette.rows.find((row) => row.key === "other");

  return (
    <section aria-labelledby="palette-heading">
      <h2 id="palette-heading" className="text-xl font-semibold tracking-tight md:text-2xl">
        Colour palette
      </h2>
      <p className="mt-1 text-[13.5px] text-mute">
        {palette.neutralPercent}% of your items are in neutral colours. Each item counts once, by its main colour.
      </p>

      <div
        role="img"
        aria-label={`Palette bar: ${palette.rows.map((row) => `${row.name} ${row.percent}%`).join(", ")}`}
        className="mt-4 h-14 rounded-xl border border-line md:h-16"
        style={{ background: palette.gradient }}
      />

      <ul className="mt-4 grid gap-1.5">
        {rows.map((row) => (
          <li
            key={row.key}
            className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 rounded-xl bg-wash/70 px-4 py-3 md:gap-4"
          >
            <span
              aria-hidden
              className="size-7 rounded-full border border-black/10"
              style={
                row.key === "multicolour"
                  ? { background: "conic-gradient(#B8312F, #E3C343, #3F7A4A, #3F6FB5, #6E4A8E, #B8312F)" }
                  : { background: row.hex }
              }
            />
            <span className="min-w-0">
              <b className="block text-[15px] font-medium">{row.name}</b>
              {row.alsoIn > 0 && (
                <span className="block text-xs text-mute">
                  Also a second colour on {row.alsoIn} {row.alsoIn === 1 ? "item" : "items"}
                </span>
              )}
            </span>
            <span className="text-[13.5px] text-mute">
              {row.count} {row.count === 1 ? "item" : "items"}
            </span>
            <span className="w-11 text-right text-[15px] font-semibold tabular-nums">{row.percent}%</span>
          </li>
        ))}
      </ul>

      {other && (
        <div className="mt-3 rounded-xl border border-dashed border-line px-4 py-3 text-[13.5px] text-body">
          <p>
            <b className="font-medium">
              {other.count} {other.count === 1 ? "item has a colour" : "items have colours"} we could not place
            </b>{" "}
            ({other.percent}% of the palette). Open an item and edit its colour to move it into a family.
          </p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {other.itemIds.map((id) => (
              <li key={id}>
                <Link
                  href={`/wardrobe/${id}`}
                  className="inline-block rounded-full border border-line bg-[#fcfbf7] px-3 py-1 text-xs capitalize hover:border-cobalt"
                >
                  {thumbs[id]?.name ?? "Item"}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
