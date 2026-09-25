import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt =
  "Wearabouts. Make more of the clothes you own. A private wardrobe assistant for Singapore.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const fraunces = await readFile(
  join(process.cwd(), "public/landing/font-1.woff"),
);
const inter = await readFile(
  join(process.cwd(), "public/landing/font-2.woff"),
);
const brandMark = await readFile(
  join(process.cwd(), "public/landing/brand-mark.png"),
);
const brandMarkDataUrl = `data:image/png;base64,${brandMark.toString("base64")}`;

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: "#F6F3EC",
          color: "#1A1C19",
          padding: 72,
          flexDirection: "column",
          justifyContent: "space-between",
          fontFamily: "Inter",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <img src={brandMarkDataUrl} width={88} height={58} alt="" />
          <div style={{ display: "flex", fontFamily: "Fraunces", fontSize: 44 }}>
            <span>wear</span>
            <span style={{ opacity: 0.6 }}>abouts</span>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            fontFamily: "Fraunces",
            fontSize: 84,
            maxWidth: 900,
            lineHeight: 1.05,
            letterSpacing: -3,
          }}
        >
          Make more of the clothes you own.
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 25, color: "#55704F" }}>
            Private wardrobe. Singapore weather. Check before you buy.
          </span>
          <span
            style={{
              background: "#E59B87",
              color: "#1A1C19",
              padding: "18px 28px",
              borderRadius: 999,
              fontSize: 24,
            }}
          >
            Start with one piece
          </span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Fraunces", data: fraunces, weight: 400, style: "normal" },
        { name: "Inter", data: inter, weight: 400, style: "normal" },
      ],
    },
  );
}
