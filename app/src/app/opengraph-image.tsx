import { ImageResponse } from "next/og";

export const alt =
  "Wearabouts. Make more of the clothes you own. A private wardrobe assistant for Singapore.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: "#f6f3ec",
          color: "#242823",
          padding: 72,
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", fontSize: 42 }}>
          Wearabouts<span style={{ color: "#b76650" }}>.</span>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 80,
            maxWidth: 950,
            lineHeight: 1.05,
            letterSpacing: -4,
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
          <span style={{ fontSize: 25, color: "#656a61" }}>
            Your wardrobe. Your plans. Singapore weather.
          </span>
          <span
            style={{
              background: "#e59b87",
              padding: "18px 28px",
              borderRadius: 12,
              fontSize: 24,
            }}
          >
            Start with one piece
          </span>
        </div>
      </div>
    ),
    size,
  );
}
