const configuredSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const siteUrl = configuredSiteUrl.replace(/\/$/, "");
export const siteDescription =
  "Make more of the clothes you own. Wearabouts is a private wardrobe assistant for Singapore, with weather-aware outfits and purchase checks.";
