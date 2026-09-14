import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "APP_NAME | Wardrobe-first outfit assistant",
    template: "%s | APP_NAME",
  },
  description:
    "APP_NAME helps you wear what you already own, get outfits matched to Singapore's weather, and check whether a purchase is worth it before you spend.",
  openGraph: {
    type: "website",
    siteName: "APP_NAME",
    title: "APP_NAME | Wardrobe-first outfit assistant",
    description:
      "Wear what you own. Get outfits matched to Singapore's weather. Check before you buy.",
    url: siteUrl,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
