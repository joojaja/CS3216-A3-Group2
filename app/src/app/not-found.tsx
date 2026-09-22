import Link from "next/link";
import "./landing.css";
export default function NotFound() {
  return (
    <main className="drape-public min-h-screen px-6 py-20">
      <div className="mx-auto max-w-xl">
        <Link href="/" className="drape-wordmark">Wearabouts.</Link>
        <h1 style={{ fontSize: "clamp(40px, 7vw, 64px)", marginTop: 64 }}>Nothing hanging here.</h1>
        <p style={{ marginTop: 24 }}>This page may have moved, or this item is no longer available.</p>
        <Link href="/wardrobe" style={{ display: "inline-block", marginTop: 32, padding: "14px 24px", borderRadius: 12, background: "#e59b87" }}>Go to your wardrobe</Link>
      </div>
    </main>
  );
}
