export type ExploreProduct = {
  id: string;
  retailer: string;
  name: string;
  productUrl: string;
  imageUrl: string;
  price: string;
  category: "top" | "bottom" | "outerwear" | "dress";
  colour: string;
  styles: string[];
  weatherTags: string[];
  fitLine: "men" | "women";
};

const muji = (
  code: string,
  details: Omit<ExploreProduct, "id" | "retailer" | "productUrl" | "imageUrl">,
): ExploreProduct => ({
  id: `muji-${code}`,
  retailer: "MUJI Singapore",
  productUrl: `https://www.muji.com/sg/products/cmdty/detail/${code}`,
  imageUrl: `https://img.muji.net/img/item/${code}_1260.jpg`,
  ...details,
});

// A small controlled catalogue keeps URLs and images trustworthy. Product
// availability can change, so the interface tells users to check the retailer.
export const EXPLORE_CATALOGUE: ExploreProduct[] = [
  muji("4547315485413", { name: "UV protection quick-dry waffle T-shirt", price: "$29.90", category: "top", colour: "off white", styles: ["casual", "minimal"], weatherTags: ["hot_humid"], fitLine: "men" }),
  muji("4550723380362", { name: "Lyocell-blend half-sleeve shirt", price: "$49.90", category: "top", colour: "off white", styles: ["smart casual", "minimal"], weatherTags: ["hot_humid"], fitLine: "men" }),
  muji("4550723239424", { name: "Ripstop cargo shorts", price: "$49.90", category: "bottom", colour: "black", styles: ["casual", "utility"], weatherTags: ["hot_humid"], fitLine: "men" }),
  muji("4550723196673", { name: "Quick-dry washable polo", price: "$49.90", category: "top", colour: "medium grey stripe", styles: ["smart casual", "minimal"], weatherTags: ["hot_humid"], fitLine: "men" }),
  muji("4550723185738", { name: "Breathable wide-fit straight pants", price: "$59.90", category: "bottom", colour: "navy", styles: ["casual", "minimal"], weatherTags: ["hot_humid", "air_conditioned"], fitLine: "men" }),
  muji("4550723181549", { name: "Water-repellent hooded jacket", price: "$59.90", category: "outerwear", colour: "charcoal grey", styles: ["casual", "utility"], weatherTags: ["rain"], fitLine: "men" }),
  muji("4550723180825", { name: "Stretch jersey jacket", price: "$99.90", category: "outerwear", colour: "dark grey", styles: ["business", "smart casual"], weatherTags: ["air_conditioned"], fitLine: "men" }),
  muji("4550723176569", { name: "Quick-dry darted wide-fit pants", price: "$59.90", category: "bottom", colour: "charcoal grey", styles: ["smart casual", "minimal"], weatherTags: ["hot_humid"], fitLine: "men" }),
  muji("4548076937784", { name: "Kapok-blend double-gauze shirt", price: "$39.90", category: "top", colour: "white", styles: ["casual", "natural"], weatherTags: ["hot_humid"], fitLine: "men" }),
  muji("4548076426288", { name: "Washed broadcloth short-sleeve shirt", price: "$29.90", category: "top", colour: "white", styles: ["casual", "minimal"], weatherTags: ["hot_humid"], fitLine: "men" }),
  muji("4550723552455", { name: "Washed denim easy tapered pants", price: "$29.90", category: "bottom", colour: "blue", styles: ["casual", "classic"], weatherTags: ["all_weather"], fitLine: "women" }),
  muji("4550723502665", { name: "Straight hakama pants", price: "$59.90", category: "bottom", colour: "black", styles: ["minimal", "smart casual"], weatherTags: ["all_weather"], fitLine: "women" }),
  muji("4550723361491", { name: "Smooth easy tapered pants", price: "$39.90", category: "bottom", colour: "charcoal grey", styles: ["casual", "minimal"], weatherTags: ["all_weather"], fitLine: "women" }),
  muji("4550723424110", { name: "Lyocell-blend half-sleeve blouse", price: "$49.90", category: "top", colour: "black", styles: ["smart casual", "minimal"], weatherTags: ["hot_humid"], fitLine: "women" }),
  muji("4550723179027", { name: "Washed broadcloth regular-collar shirt", price: "$39.90", category: "top", colour: "white", styles: ["classic", "smart casual"], weatherTags: ["air_conditioned", "all_weather"], fitLine: "women" }),
  muji("4550723165686", { name: "Lyocell openwork polo cardigan", price: "$49.90", category: "outerwear", colour: "black", styles: ["smart casual", "minimal"], weatherTags: ["air_conditioned"], fitLine: "women" }),
  muji("4550723071819", { name: "High-twist jersey sleeveless dress", price: "$49.90", category: "dress", colour: "charcoal grey", styles: ["casual", "minimal"], weatherTags: ["hot_humid"], fitLine: "women" }),
  muji("4550723077033", { name: "Cool-touch wide-fit T-shirt", price: "$19.90", category: "top", colour: "white", styles: ["casual", "minimal"], weatherTags: ["hot_humid"], fitLine: "women" }),
  muji("4550723074995", { name: "Cool-touch anti-sweat-stain T-shirt", price: "$19.90", category: "top", colour: "white", styles: ["casual", "minimal"], weatherTags: ["hot_humid"], fitLine: "women" }),
  muji("4550723563093", { name: "UV protection quick-dry zip hoodie", price: "$49.90", category: "outerwear", colour: "medium grey", styles: ["casual", "sporty"], weatherTags: ["rain", "air_conditioned"], fitLine: "women" }),
  muji("4550512649656", { name: "Water-repellent hooded jacket", price: "$79.90", category: "outerwear", colour: "beige", styles: ["casual", "utility"], weatherTags: ["rain"], fitLine: "women" }),
];

export type WardrobeForRetrieval = {
  category: string;
  primary_colour: string | null;
  weather_tags: string[];
};

export type ProfileForRetrieval = {
  preferred_styles?: string[] | null;
  preferred_colours?: string[] | null;
  disliked_colours?: string[] | null;
};

const normal = (value: string) => value.trim().toLowerCase().replaceAll("_", " ");

export function retrieveExploreCandidates(
  wardrobe: WardrobeForRetrieval[],
  profile: ProfileForRetrieval | null,
  limit = 16,
) {
  const categoryCounts = new Map<string, number>();
  const colourCounts = new Map<string, number>();
  for (const item of wardrobe) {
    categoryCounts.set(item.category, (categoryCounts.get(item.category) ?? 0) + 1);
    if (item.primary_colour) {
      const colour = normal(item.primary_colour);
      colourCounts.set(colour, (colourCounts.get(colour) ?? 0) + 1);
    }
  }

  const preferredStyles = new Set((profile?.preferred_styles ?? []).map(normal));
  const preferredColours = new Set((profile?.preferred_colours ?? []).map(normal));
  const dislikedColours = new Set((profile?.disliked_colours ?? []).map(normal));

  return EXPLORE_CATALOGUE.map((product, index) => {
    const colour = normal(product.colour);
    let score = 0;
    score += Math.max(0, 4 - (categoryCounts.get(product.category) ?? 0)) * 2;
    score += product.weatherTags.includes("hot_humid") ? 2 : 0;
    score += product.weatherTags.includes("rain") ? 0.75 : 0;
    score += preferredColours.has(colour) ? 3 : 0;
    score += product.styles.some((style) => preferredStyles.has(normal(style))) ? 2 : 0;
    score -= (colourCounts.get(colour) ?? 0) * 0.4;
    score -= dislikedColours.has(colour) ? 20 : 0;
    return { product, score, index };
  })
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, Math.max(10, Math.min(limit, EXPLORE_CATALOGUE.length)))
    .map(({ product, score }) => ({ product, score }));
}
