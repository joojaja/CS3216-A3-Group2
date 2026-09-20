import type { Metadata } from "next";
import localFont from "next/font/local";
import { siteUrl, siteDescription } from "@/lib/site";
import { AnalyticsConsent } from "@/components/analytics-consent";
import "./globals.css";

const uiFont = localFont({
  src: [
    { path: "../../public/landing/font-2.woff", weight: "400" },
    { path: "../../public/landing/font-3.woff", weight: "600" },
  ],
  variable: "--font-geist-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Wearabouts | Wardrobe-first outfit assistant",
    template: "%s | Wearabouts",
  },
  description: siteDescription,
  applicationName: "Wearabouts",
  alternates: { canonical: "/" },
  twitter: {
    card: "summary_large_image",
    title: "Wearabouts | Make more of the clothes you own",
    description: siteDescription,
    images: ["/opengraph-image"],
  },
  openGraph: {
    type: "website",
    siteName: "Wearabouts",
    title: "Wearabouts | Wardrobe-first outfit assistant",
    description:
      "Wear what you own. Get outfits matched to Singapore's weather. Check before you buy.",
    url: siteUrl,
    locale: "en_SG",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Wearabouts. Make more of the clothes you own.",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${uiFont.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <AnalyticsConsent />
      </body>
    </html>
  );
}
